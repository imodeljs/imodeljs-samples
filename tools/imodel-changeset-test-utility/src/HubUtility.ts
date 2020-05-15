/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import { AgentAuthorizationClient, AzureFileHandler } from "@bentley/backend-itwin-client";
import { ClientRequestContext, Logger } from "@bentley/bentleyjs-core";
import { ContextRegistryClient, Project } from "@bentley/context-registry-client";
import { Briefcase as HubBriefcase, BriefcaseQuery, HubIModel, IModelHubClient, IModelQuery, Version } from "@bentley/imodelhub-client";
import { BriefcaseManager } from "@bentley/imodeljs-backend";
import { IModelVersion } from "@bentley/imodeljs-common";
import { AccessToken, AuthorizedClientRequestContext } from "@bentley/itwin-client";
import { ChangesetGenerationConfig } from "./ChangesetGenerationConfig";

const actx = new ClientRequestContext("");

/** Class Containing utility functions for interactions with the iModelHub */
export class HubUtility {
  public connectClient: ContextRegistryClient;
  private _hubClient: IModelHubClient;
  public constructor() {
    this.connectClient = new ContextRegistryClient();
    this._hubClient = new IModelHubClient(new AzureFileHandler());
  }
  public getHubClient(): IModelHubClient {
    return this._hubClient;
  }
  public async login(): Promise<AccessToken> {
    const oidcConfig = ChangesetGenerationConfig.oidcAgentClientConfiguration;
    Logger.logTrace(ChangesetGenerationConfig.loggingCategory, `Attempting to login to OIDC for ${oidcConfig.clientId}`);
    const client = new AgentAuthorizationClient(oidcConfig);
    const jwt: AccessToken = await client.getAccessToken(actx);
    Logger.logTrace(ChangesetGenerationConfig.loggingCategory, `Successful login for ${oidcConfig.clientId}`);
    return jwt;
  }
  public async createNamedVersion(authContext: AuthorizedClientRequestContext, iModelId: string, name: string, description: string): Promise<Version> {
    const changeSetId: string = await IModelVersion.latest().evaluateChangeSet(authContext, iModelId, this._hubClient);
    Logger.logTrace(ChangesetGenerationConfig.loggingCategory, `Creating named version "${name}" on the Hub`);
    return this._hubClient.versions.create(authContext, iModelId, changeSetId, name, description);
  }
  /**
   * Queries the project id by its name
   * @param accessToken AccessToken
   * @param projectName Name of project
   * @throws If the project is not found, or there is more than one project with the supplied name
   */
  public async queryProjectIdByName(authContext: AuthorizedClientRequestContext, projectName: string): Promise<string> {
    const project: Project | undefined = await this._queryProjectByName(authContext, projectName);
    if (!project)
      return Promise.reject(`Project ${projectName} not found`);
    return project.wsgId;
  }

  /**
   * Queries the iModel id by its name
   * @param accessToken AccessToken
   * @param projectId Id of the project
   * @param iModelName Name of the iModel
   * @throws If the iModel is not found, or if there is more than one iModel with the supplied name
   */
  public async queryIModelIdByName(authContext: AuthorizedClientRequestContext, projectId: string, iModelName: string): Promise<string> {
    const iModel: HubIModel | undefined = await this._queryIModelByName(authContext, projectId, iModelName);
    if (!iModel)
      return Promise.reject(`IModel ${iModelName} not found`);
    return iModel.wsgId;
  }
  public async iModelExistsInHub(authContext: AuthorizedClientRequestContext, projectId: string, iModelName: string): Promise<boolean> {
    const iModel: HubIModel | undefined = await this._queryIModelByName(authContext, projectId, iModelName);
    if (iModel)
      return true;
    return false;
  }
  private async _queryProjectByName(authContext: AuthorizedClientRequestContext, projectName: string): Promise<Project | undefined> {
    const project: Project = await this.connectClient.getProject(authContext, {
      $select: "*",
      $filter: "Name+eq+'" + projectName + "'",
    });
    return project;
  }

  private async _queryIModelByName(authContext: AuthorizedClientRequestContext, projectId: string, iModelName: string): Promise<HubIModel | undefined> {
    const iModels = await this._hubClient.iModels.get(authContext, projectId, new IModelQuery().byName(iModelName));
    if (iModels.length === 0)
      return undefined;
    if (iModels.length > 1)
      return Promise.reject(`Too many iModels with name ${iModelName} found`);
    return iModels[0];
  }

  /**
   * Purges all acquired briefcases for the specified iModel (and user), if the specified threshold of acquired briefcases is exceeded
   */
  public async purgeAcquiredBriefcases(requestContext: AuthorizedClientRequestContext, projectName: string, iModelName: string, acquireThreshold: number = 16): Promise<void> {
    const projectId: string = await this.queryProjectIdByName(requestContext, projectName);
    const iModelId: string = await this.queryIModelIdByName(requestContext, projectId, iModelName);

    const briefcases: HubBriefcase[] = await BriefcaseManager.imodelClient.briefcases.get(requestContext, iModelId, new BriefcaseQuery().ownedByMe());
    if (briefcases.length > acquireThreshold) {
      Logger.logInfo(ChangesetGenerationConfig.loggingCategory, `Reached limit of maximum number of briefcases for ${projectName}:${iModelName}. Purging all briefcases.`);

      const promises = new Array<Promise<void>>();
      briefcases.forEach((briefcase: HubBriefcase) => {
        promises.push(BriefcaseManager.imodelClient.briefcases.delete(requestContext, iModelId, briefcase.briefcaseId!));
      });
      await Promise.all(promises);
    }
  }
}
