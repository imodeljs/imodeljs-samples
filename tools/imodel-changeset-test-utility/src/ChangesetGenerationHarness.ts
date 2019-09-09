/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { ChangesetGenerationConfig } from "./ChangesetGenerationConfig";
import { HubUtility } from "./HubUtility";
import { IModelDbHandler } from "./IModelDbHandler";
import { ChangesetGenerator } from "./ChangesetGenerator";
import { TestChangesetSequence } from "./TestChangesetSequence";
import { Id64String, Logger, LogLevel } from "@bentley/bentleyjs-core";
import { IModelDb, IModelHost, IModelHostConfiguration, KeepBriefcase } from "@bentley/imodeljs-backend";
import { AccessToken, Config, AuthorizedClientRequestContext } from "@bentley/imodeljs-clients";
import * as fs from "fs";
import { ColorDef, CodeScopeSpec, IModelVersion, IModel } from "@bentley/imodeljs-common";

/** Harness used to facilitate changeset generation */
export class ChangesetGenerationHarness {
  private _iModelDbHandler: IModelDbHandler;
  private _localIModelDbPath?: string;
  private _isInitialized: boolean = false;
  private _iModelId?: string;
  private _iModelDb?: IModelDb;
  private _hubUtility?: HubUtility;
  private _accessToken?: AccessToken;
  private _projectId?: string;
  private _physicalModelId?: Id64String;
  private _codeSpecId?: Id64String;
  private _categoryId?: Id64String;
  private _changeSetGenerator?: ChangesetGenerator;
  private _physicalModelName = "ChangeSetUtil Physical Model";
  private _spatialCategoryName = "ChangeSetUtilCategory";
  private _codeSpecName = "ChangeSetUtilCodeSpec";
  private _categoryName = "ChangeSetUtilCategory";
  public constructor(hubUtility?: HubUtility, iModelDbHandler?: IModelDbHandler, localIModelDbPath?: string) {
    ChangesetGenerationConfig.setupConfig();
    this._iModelDbHandler = iModelDbHandler ? iModelDbHandler : new IModelDbHandler();
    if (hubUtility)
      this._hubUtility = hubUtility;
    this._localIModelDbPath = localIModelDbPath ? localIModelDbPath : __dirname;

    if (!IModelHost.configuration)
      this._initializeIModelHost();
  }
  // Async Initialization
  public async initialize(): Promise<void> {
    if (!this._isInitialized) {
      try {
        this._initializeOutputDirectory();
        this._initializeLogger();
        if (!this._hubUtility)
          this._hubUtility = new HubUtility();
        this._accessToken = await this._hubUtility.login();
        const authCtx = new AuthorizedClientRequestContext(this._accessToken!);
        Logger.logTrace(ChangesetGenerationConfig.loggingCategory, `Attempting to file projectId for ${ChangesetGenerationConfig.projectName}`);
        this._projectId = await this._hubUtility.queryProjectIdByName(authCtx, ChangesetGenerationConfig.projectName);
        this._iModelId = await this._hubUtility.queryIModelIdByName(authCtx, this._projectId, ChangesetGenerationConfig.iModelName);
        Logger.logTrace(ChangesetGenerationConfig.loggingCategory, `Opening latest iModel`);
        this._iModelDb = await this._iModelDbHandler.openLatestIModelDb(authCtx, this._projectId!, this._iModelId!);
        const definitionModelId: Id64String = IModel.dictionaryId;
        let needToPrePush = false;
        Logger.logTrace(ChangesetGenerationConfig.loggingCategory, `Getting ChangeSet Physical Model`);
        const physModelId = this._iModelDbHandler.getPhysModel(this._iModelDb, this._physicalModelName);
        if (!physModelId) {
          Logger.logTrace(ChangesetGenerationConfig.loggingCategory, `Inserting ChangeSet Physical Model`);
          this._physicalModelId = this._iModelDbHandler.insertChangeSetUtilPhysicalModel(this._iModelDb, this._physicalModelName);
          needToPrePush = true;
        } else
          this._physicalModelId = physModelId;

        Logger.logTrace(ChangesetGenerationConfig.loggingCategory, `Getting ChangeSet Code Spec`);
        const codeSpec = this._iModelDbHandler.getCodeSpecByName(this._iModelDb, this._codeSpecName);
        if (!codeSpec) {
          Logger.logTrace(ChangesetGenerationConfig.loggingCategory, `Inserting ChangeSet Code Spec`);
          this._codeSpecId = this._iModelDbHandler.insertCodeSpec(this._iModelDb, this._codeSpecName, CodeScopeSpec.Type.Model);
          needToPrePush = true;
        } else
          this._codeSpecId = codeSpec.id;
        Logger.logTrace(ChangesetGenerationConfig.loggingCategory, `Getting ChangeSet Spatial Category`);
        const spatialCategory = this._iModelDbHandler.getSpatialCategory(this._iModelDb, this._spatialCategoryName);
        if (!spatialCategory) {
          Logger.logTrace(ChangesetGenerationConfig.loggingCategory, `Inserting ChangeSet Spatial Category`);
          this._categoryId = this._iModelDbHandler.insertSpatialCategory(this._iModelDb, definitionModelId, this._categoryName, new ColorDef("blanchedAlmond"));
          needToPrePush = true;
        } else
          this._categoryId = spatialCategory.id;

        this._changeSetGenerator = new ChangesetGenerator(this._accessToken!, this._hubUtility!,
          this._physicalModelId!, this._categoryId!, this._codeSpecId!, this._iModelDbHandler);
        if (needToPrePush) {
          await this._iModelDb.concurrencyControl.request(authCtx);
          this._iModelDb.saveChanges();
          await this._iModelDb.pullAndMergeChanges(authCtx, IModelVersion.latest());
          await this._iModelDb.pushChanges(authCtx);
        }
        if (await this._iModelDbHandler.deletePhysModelElements(this._iModelDb, this._physicalModelId, authCtx)) {
          await this._iModelDb.concurrencyControl.request(authCtx);
          this._iModelDb.saveChanges();
          await this._iModelDb.pullAndMergeChanges(authCtx, IModelVersion.latest());
          await this._iModelDb.pushChanges(authCtx);
        } else {
          await this._changeSetGenerator.pushFirstChangeSetTransaction(this._iModelDb);
          await this._iModelDb.pullAndMergeChanges(authCtx);
          await this._iModelDb.pushChanges(authCtx);
        }
        Logger.logTrace(ChangesetGenerationConfig.loggingCategory, `Successful Async Initialization`);
        this._isInitialized = true;
      } catch (error) {
        Logger.logTrace(ChangesetGenerationConfig.loggingCategory, `Error with async initialization: ${error}`);
      }
    }
  }
  public async generateChangesets(changesetSequence: TestChangesetSequence): Promise<boolean> {
    await this.initialize();
    const authCtx = new AuthorizedClientRequestContext(this._accessToken!);
    if (!this._isInitialized) {
      Logger.logTrace(ChangesetGenerationConfig.loggingCategory, "Unable to Generate ChangeSets when async initializtion fails");
      return false;
    }
    const retVal = await this._changeSetGenerator!.pushTestChangeSetsAndVersions(this._projectId!, this._iModelId!, changesetSequence);
    await this._iModelDb!.close(authCtx, KeepBriefcase.No);
    return retVal;
  }

  private _initializeLogger(): void {
    Logger.initializeToConsole();
    Logger.setLevelDefault(LogLevel.Error);
    Logger.setLevel(ChangesetGenerationConfig.loggingCategory, LogLevel.Trace);
    Logger.logTrace(ChangesetGenerationConfig.loggingCategory, "Logger initialized...");
    Logger.logTrace(ChangesetGenerationConfig.loggingCategory, `Configuration: ${JSON.stringify(Config.App)}`);
  }
  private _initializeIModelHost(): void {
    const configuration = new IModelHostConfiguration();
    IModelHost.startup(configuration);
  }
  /** Clean up the test output directory to prepare for fresh output */
  private _initializeOutputDirectory(): void {
    if (!fs.existsSync(this._localIModelDbPath!))
      fs.mkdirSync(this._localIModelDbPath!);
  }
}
