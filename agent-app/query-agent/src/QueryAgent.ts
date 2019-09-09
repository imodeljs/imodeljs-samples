/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { BriefcaseProvider } from "./BriefcaseProvider";
import { ChangeSummaryExtractor } from "./ChangeSummaryExtractor";
import { Logger, LogLevel, ClientRequestContext } from "@bentley/bentleyjs-core";
import { AccessToken, ChangeSetPostPushEvent, NamedVersionCreatedEvent, ConnectClient, IModelHubClient, IModelQuery, AuthorizedClientRequestContext } from "@bentley/imodeljs-clients";
import { ChangeOpCode } from "@bentley/imodeljs-common";
import { IModelHost, IModelHostConfiguration, IModelDb } from "@bentley/imodeljs-backend";
import { QueryAgentConfig } from "./QueryAgentConfig";
import { OidcAgentClient, AzureFileHandler } from "@bentley/imodeljs-clients-backend";
import * as fs from "fs";
import * as path from "path";

const actx = new ClientRequestContext("");

/** Sleep for ms */
const pause = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
/** Agent for querying changesets. Contains backend iModelJs engine. */
export class QueryAgent {
  private _accessToken?: AccessToken;
  private _projectId?: string;
  private _iModelId?: string;
  private _iModelDb?: IModelDb;
  private _isInitialized: boolean = false;
  public constructor(
    private _hubClient: IModelHubClient = new IModelHubClient(new AzureFileHandler()),
    private _connectClient: ConnectClient = new ConnectClient(),
    private _briefcaseProvider: BriefcaseProvider = new BriefcaseProvider(),
    private _changeSummaryExtractor: ChangeSummaryExtractor = new ChangeSummaryExtractor(),
    private _oidcClient?: OidcAgentClient) {

    QueryAgentConfig.setupConfig();

    Logger.initializeToConsole();
    Logger.setLevelDefault(LogLevel.Error);
    Logger.setLevel(QueryAgentConfig.loggingCategory, LogLevel.Trace);

    // Following must be done before calling any API in imodeljs
    if (!this._oidcClient)
      this._oidcClient = new OidcAgentClient(QueryAgentConfig.oidcAgentClientConfiguration);
    // Startup IModel Host if we need to
    const configuration = new IModelHostConfiguration();
    if (!IModelHost.configuration)
      IModelHost.startup(configuration);
  }
  private async _login(): Promise<AccessToken> {
    // TODO: remove openid-client.d.ts once imodeljs changes are received
    Logger.logTrace(QueryAgentConfig.loggingCategory, `Getting JWT access token`);
    const jwt: AccessToken = await this._oidcClient!.getToken(actx);
    Logger.logTrace(QueryAgentConfig.loggingCategory, `Got JWT access token`);
    return jwt;
  }
  /** Create listeners and respond to changesets */
  public async listenForAndHandleChangesets(listenFor: number/*ms*/) {
    await this._initialize();
    // Subscribe to change set and named version events
    Logger.logTrace(QueryAgentConfig.loggingCategory, "Setting up changeset and named version listeners...");
    const authCtx = new AuthorizedClientRequestContext(this._accessToken!);
    const changeSetSubscription = await this._hubClient!.events.subscriptions.create(authCtx, this._iModelId!, ["ChangeSetPostPushEvent"]);
    const deleteChangeSetListener = this._hubClient!.events.createListener(authCtx, async () => this._accessToken!, changeSetSubscription!.wsgId, this._iModelId!,
      async (receivedEvent: ChangeSetPostPushEvent) => {
        Logger.logTrace(QueryAgentConfig.loggingCategory, `Received notification that change set "${receivedEvent.changeSetId}" was just posted on the Hub`);
        try {
          await this._extractChangeSummary(receivedEvent.changeSetId!);
        } catch (error) {
          Logger.logError(QueryAgentConfig.loggingCategory, `Unable to extract changeset: ${receivedEvent.changeSetId}, failed with ${error}`);
        }
      });
    const namedVersionSubscription = await this._hubClient!.events.subscriptions.create(authCtx, this._iModelId!, ["VersionEvent"]);
    const deleteNamedVersionListener = this._hubClient!.events.createListener(authCtx, async () => this._accessToken!, namedVersionSubscription!.wsgId, this._iModelId!,
      async (receivedEvent: NamedVersionCreatedEvent) => {
        Logger.logTrace(QueryAgentConfig.loggingCategory, `Received notification that named version "${receivedEvent.versionName}" was just created on the Hub`);
      });

    Logger.logTrace(QueryAgentConfig.loggingCategory, `Listening to changesets for ${listenFor} ms.`);
    // Wait for callbacks from events in the iModelHub
    await pause(listenFor);

    if (this._iModelDb)
      await this._iModelDb.close(authCtx);
    // Unsubscribe from events (if necessary)
    if (deleteChangeSetListener)
      deleteChangeSetListener();
    if (deleteNamedVersionListener)
      deleteNamedVersionListener();
    Logger.logTrace(QueryAgentConfig.loggingCategory, `Finished listening for changesets for ${listenFor} ms.`);
  }
  /** Asynchronous initialization */
  private async _initialize(): Promise<void> {
    if (!this._isInitialized) {
      try {
        // Initialize (cleanup) output directory
        this._initializeOutputDirectory();
        this._accessToken = await this._login();
        Logger.logTrace(QueryAgentConfig.loggingCategory, `Attempting to find Ids for iModel and Project`);
        let projectId, iModelId: string | undefined;
        const authCtx = new AuthorizedClientRequestContext(this._accessToken!);
        try {
          projectId = (await this._connectClient.getProject(authCtx, {
            $select: "*",
            $filter: "Name+eq+'" + QueryAgentConfig.projectName + "'",
          }))!.wsgId;
          Logger.logTrace(QueryAgentConfig.loggingCategory, `Project ${QueryAgentConfig.projectName} has id: ${projectId}`);
          const iModels = await this._hubClient.iModels.get(authCtx, projectId, new IModelQuery().byName(QueryAgentConfig.iModelName));
          if (iModels.length === 1)
            iModelId = iModels[0].wsgId;
        } catch (error) {
          Logger.logTrace(QueryAgentConfig.loggingCategory, `Error: ${error}`);
          throw error;
        }
        if (projectId && iModelId) {
          this._projectId = projectId;
          this._iModelId = iModelId;
          Logger.logTrace(QueryAgentConfig.loggingCategory, `Query Agent Initialized with event subscriptions for ${QueryAgentConfig.iModelName}`);
          this._isInitialized = true;
        }
      } catch (error) {
        const errorStr = `Unable to verify IModel:'${QueryAgentConfig.iModelName}', for project '${QueryAgentConfig.projectName}' exists in the iModel Hub: ${error}`;
        Logger.logError(QueryAgentConfig.loggingCategory, errorStr);
        throw errorStr;
      }

    }
  }
  /** Extract a summary of information in the change set - who changed it, when it was changed, what was changed, how it was changed, and write it to a JSON file */
  private async _extractChangeSummary(changeSetId: string) {
    this._iModelDb = await this._briefcaseProvider.getBriefcase(this._accessToken!, this._projectId!, this._iModelId!, changeSetId);
    const changeContent = await this._changeSummaryExtractor.extractChangeSummary(this._accessToken!, this._iModelDb!, changeSetId);
    // Write the change summary contents as JSON
    this._writeChangeSummaryToDisk(changeContent);
    return changeContent;
  }

  /** Clean up the test output directory to prepare for fresh output */
  private _initializeOutputDirectory() {
    const outputDir = QueryAgentConfig.outputDir;
    if (!fs.existsSync(outputDir))
      fs.mkdirSync(outputDir);
    const changeSummaryDir = QueryAgentConfig.changeSummaryDir;
    this._deleteDirectory(changeSummaryDir);
    fs.mkdirSync(changeSummaryDir);
  }

  /** Write the change summary contents as JSON to disk */
  private _writeChangeSummaryToDisk(content: any) {
    const filePath = path.join(QueryAgentConfig.changeSummaryDir, `${content.id}.json`);

    // Dump the change summary
    fs.writeFileSync(filePath, JSON.stringify(content, (name, value) => {
      if (name === "opCode")
        return ChangeOpCode[value];
      if (name === "pushDate")
        return new Date(value).toLocaleString();
      return value;
    }, 2));

    Logger.logTrace(QueryAgentConfig.loggingCategory, `Wrote contents of change summary to ${filePath}`);
  }
  /** Utility to delete a directory that contains files */
  private _deleteDirectory(folderPath: string) {
    if (!fs.existsSync(folderPath))
      return;

    const files = fs.readdirSync(folderPath);
    for (const file of files) {
      const curPath = path.join(folderPath, file);
      fs.unlinkSync(curPath);
    }
    fs.rmdirSync(folderPath);
  }
}
