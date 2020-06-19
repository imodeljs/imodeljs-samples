/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { AgentAuthorizationClient, AzureFileHandler, RequestHost } from "@bentley/backend-itwin-client";
import { Logger } from "@bentley/bentleyjs-core";
import { ContextRegistryClient } from "@bentley/context-registry-client";
import { ChangeSetPostPushEvent, IModelHubClient, IModelQuery, NamedVersionCreatedEvent } from "@bentley/imodelhub-client";
import { AuthorizedBackendRequestContext, BriefcaseDb, BriefcaseManager, IModelHost, IModelHostConfiguration } from "@bentley/imodeljs-backend";
import { ChangeOpCode } from "@bentley/imodeljs-common";
import { AuthorizedClientRequestContext } from "@bentley/itwin-client";
import * as fs from "fs";
import * as path from "path";
import { BriefcaseProvider } from "./BriefcaseProvider";
import { ChangeSummaryExtractor } from "./ChangeSummaryExtractor";
import { QueryAgentConfig } from "./QueryAgentConfig";

/** Sleep for ms */
const pause = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Agent for querying changesets. Contains backend iModelJs engine. */
export class QueryAgent {
  private _projectId?: string;
  private _iModelId?: string;
  private _iModelDb?: BriefcaseDb;
  private _isInitialized: boolean = false;
  public constructor(
    private _hubClient: IModelHubClient = new IModelHubClient(new AzureFileHandler()),
    private _connectClient: ContextRegistryClient = new ContextRegistryClient(),
    private _briefcaseProvider: BriefcaseProvider = new BriefcaseProvider(),
    private _changeSummaryExtractor: ChangeSummaryExtractor = new ChangeSummaryExtractor()) { }

  public async run(listenFor?: number/*ms*/): Promise<void> {
    return this.listenForAndHandleChangesets(listenFor === undefined ? QueryAgentConfig.listenTime : listenFor);
  }

  /** Create listeners and respond to changesets */
  public async listenForAndHandleChangesets(listenFor: number/*ms*/) {
    // Subscribe to change set and named version events
    Logger.logTrace(QueryAgentConfig.loggingCategory, "Setting up changeset and named version listeners...");

    const getAccessToken = async () => {
      const accessToken = await IModelHost.getAccessToken();
      return accessToken;
    };

    const requestContext = await AuthorizedBackendRequestContext.create();
    requestContext.enter();

    const changeSetSubscription = await this._hubClient!.events.subscriptions.create(requestContext, this._iModelId!, ["ChangeSetPostPushEvent"]);
    const deleteChangeSetListener = this._hubClient!.events.createListener(requestContext, getAccessToken, changeSetSubscription!.wsgId, this._iModelId!,
      async (receivedEvent: ChangeSetPostPushEvent) => {
        Logger.logTrace(QueryAgentConfig.loggingCategory, `Received notification that change set "${receivedEvent.changeSetId}" was just posted on the Hub`);
        try {
          const locRequestContext = await AuthorizedBackendRequestContext.create(); // Refresh the authorization context just before extracting every change summary, in case it expires in between
          await this._extractChangeSummary(locRequestContext, receivedEvent.changeSetId!);
        } catch (error) {
          Logger.logError(QueryAgentConfig.loggingCategory, `Unable to extract changeset: ${receivedEvent.changeSetId}, failed with ${error}`);
        }
      });
    const namedVersionSubscription = await this._hubClient!.events.subscriptions.create(requestContext, this._iModelId!, ["VersionEvent"]);
    const deleteNamedVersionListener = this._hubClient!.events.createListener(requestContext, getAccessToken, namedVersionSubscription!.wsgId, this._iModelId!,
      async (receivedEvent: NamedVersionCreatedEvent) => {
        Logger.logTrace(QueryAgentConfig.loggingCategory, `Received notification that named version "${receivedEvent.versionName}" was just created on the Hub`);
      });

    Logger.logTrace(QueryAgentConfig.loggingCategory, `Listening to changesets for ${listenFor} ms.`);
    // Wait for callbacks from events in the iModelHub
    await pause(listenFor);

    if (this._iModelDb && this._iModelDb.isOpen) {
      this._iModelDb.close();
      await BriefcaseManager.delete(requestContext, this._iModelDb.briefcaseKey);
    }
    // Unsubscribe from events (if necessary)
    if (deleteChangeSetListener)
      deleteChangeSetListener();
    if (deleteNamedVersionListener)
      deleteNamedVersionListener();
    Logger.logTrace(QueryAgentConfig.loggingCategory, `Finished listening for changesets for ${listenFor} ms.`);
  }

  /** Asynchronous initialization */
  public async initialize(): Promise<void> {
    if (this._isInitialized)
      return;

    await RequestHost.initialize();

    // Following must be done before calling any API in imodeljs
    if (!IModelHost.authorizationClient)
      IModelHost.authorizationClient = new AgentAuthorizationClient(QueryAgentConfig.oidcAgentClientConfiguration);

    // Startup IModel Host if we need to
    const configuration = new IModelHostConfiguration();
    if (!IModelHost.configuration)
      await IModelHost.startup(configuration);

    try {
      // Initialize (cleanup) output directory
      this._initializeOutputDirectory();
      Logger.logTrace(QueryAgentConfig.loggingCategory, `Attempting to find Ids for iModel and Project`);
      let projectId, iModelId: string | undefined;
      const requestContext = await AuthorizedBackendRequestContext.create();
      requestContext.enter();

      try {
        projectId = (await this._connectClient.getProject(requestContext, {
          $select: "*",
          $filter: "Name+eq+'" + QueryAgentConfig.projectName + "'",
        }))!.wsgId;
        Logger.logTrace(QueryAgentConfig.loggingCategory, `Project ${QueryAgentConfig.projectName} has id: ${projectId}`);
        const iModels = await this._hubClient.iModels.get(requestContext, projectId, new IModelQuery().byName(QueryAgentConfig.iModelName));
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

  /** Extract a summary of information in the change set - who changed it, when it was changed, what was changed, how it was changed, and write it to a JSON file */
  private async _extractChangeSummary(requestContext: AuthorizedClientRequestContext, changeSetId: string) {
    requestContext.enter();

    this._iModelDb = await this._briefcaseProvider.getBriefcase(requestContext, this._projectId!, this._iModelId!, changeSetId);
    requestContext.enter();

    const changeContent = await this._changeSummaryExtractor.extractChangeSummary(requestContext, this._iModelDb!, changeSetId);
    requestContext.enter();

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
