/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { HubUtility } from "../HubUtility";
import { ChangesetGenerationConfig } from "../ChangesetGenerationConfig";
import { ChangesetGenerationHarness } from "../ChangesetGenerationHarness";
import { IModelDbHandler } from "../IModelDbHandler";
import { Id64, Id64String } from "@bentley/bentleyjs-core";
import { AccessToken, AuthorizedClientRequestContext } from "@bentley/imodeljs-clients";
import { IModelDb, GeometricElement3d, ConcurrencyControl } from "@bentley/imodeljs-backend";
import { Version } from "@bentley/imodeljs-clients";
import * as TypeMoq from "typemoq";
import { CodeSpec } from "@bentley/imodeljs-common";
import { Config } from "@bentley/imodeljs-clients";
export class TestMockObjects {
  public static readonly fakeAccessToken: string = "FAKE_ACCESS_TOKEN";
  public static readonly fakeIModelName: string = "FAKE_IMODEL";
  public static setupMockAppConfig() {
    Config.App.merge({
      imjs_agent_client_id: "FAKE_CLIENT_ID",
      imjs_agent_client_secret: "FAKE_CLIENT_SECRET",
      imjs_agent_service_user_email: "FAKE_USER_EMAIL",
      imjs_agent_service_user_password: "FAKE_USER_PASS",
      imjs_agent_project_name: "FAKE_PROJECT_NAME",
      imjs_agent_imodel_name: "FAKE_IMODEL_NAME",

      imjs_buddi_resolve_url_using_region: "103",
      imjs_default_relying_party_uri: "https://fake.com",
    });
  }

  public static clearMockAppConfig() {
    Config.App.remove("imjs_agent_client_id");
    Config.App.remove("imjs_agent_client_secret");
    Config.App.remove("imjs_agent_project_name");
    Config.App.remove("imjs_agent_imodel_name");
    Config.App.remove("imjs_buddi_resolve_url_using_region");
    Config.App.remove("imjs_default_relying_party_uri");
  }

  public static getMockChangesetGenerationHarness(throwsError = false, returns = true): ChangesetGenerationHarness {
    const harness = TypeMoq.Mock.ofType<ChangesetGenerationHarness>();
    harness.setup((_) => _.initialize()).returns(async () => { });
    if (throwsError)
      harness.setup((_) => _.generateChangesets(TypeMoq.It.isAny())).throws(new Error("Mock harness changeset generation error"));
    else
      harness.setup((_) => _.generateChangesets(TypeMoq.It.isAny())).returns(async () => returns);
    return harness.object;

  }
  public static getMockChangesetGenerationConfig(): ChangesetGenerationConfig {
    const config: ChangesetGenerationConfig = new ChangesetGenerationConfig();
    return config;
  }
  public static getMockProcess(): NodeJS.Process {
    const mockProcess = TypeMoq.Mock.ofType<NodeJS.Process>();
    mockProcess.setup((_) => _.exit(TypeMoq.It.isAny()));
    return mockProcess.object;
  }
  public static getMockHubUtility(): HubUtility {
    const mockHubUtility: TypeMoq.IMock<HubUtility> = TypeMoq.Mock.ofType2(HubUtility, [new ChangesetGenerationConfig()]);
    mockHubUtility.setup((_) => _.createNamedVersion(TypeMoq.It.isAny(), TypeMoq.It.isAny(),
      TypeMoq.It.isAny(), TypeMoq.It.isAny())).returns(async () => new Version());
    mockHubUtility.setup((_) => _.login()).returns(async () => this.getFakeAccessToken());
    mockHubUtility.setup((_) => _.queryProjectIdByName(TypeMoq.It.isAny(), TypeMoq.It.isAnyString())).returns(async () => {
      return this.getFakeProjectId();
    });

    return mockHubUtility.object;
  }
  public static getMockIModelDb(): IModelDb {
    const mockIModelDb = TypeMoq.Mock.ofType<IModelDb>();
    mockIModelDb.setup((_) => _.saveChanges(TypeMoq.It.isAny())).returns(() => { });
    mockIModelDb.setup((_) => _.pushChanges(TypeMoq.It.isAny(), TypeMoq.It.isAny())).returns(async () => { });
    mockIModelDb.setup((_) => _.elements).returns(() => this.getMockIModelDbElements());
    mockIModelDb.setup((_) => _.concurrencyControl).returns(() => this.getMockConcurrencyControl());
    // Below is a workaround to limitations of the typemoq framework. without it any mock DbOpener will never resolve promise
    // ref: https://stackoverflow.com/questions/44224528/promise-fails-to-resolve-with-typemoq-mock#
    mockIModelDb.setup((_: any) => _.then).returns(() => undefined);
    return mockIModelDb.object;
  }
  public static getMockConcurrencyControl(): ConcurrencyControl {
    const concCtrl = TypeMoq.Mock.ofType<ConcurrencyControl>();
    concCtrl.setup((_) => _.request(TypeMoq.It.isAny(), TypeMoq.It.isAny())).returns(async () => { });
    return concCtrl.object;
  }
  public static getMockIModelDbHandler(): IModelDbHandler {
    const mockIModelDbHandler = TypeMoq.Mock.ofType(IModelDbHandler);
    mockIModelDbHandler.setup((_) => _.openLatestIModelDb(TypeMoq.It.isAny(), TypeMoq.It.isAny(),
      TypeMoq.It.isAny())).returns(async () => this.getMockIModelDb());
    mockIModelDbHandler.setup((_) => _.getPhysModel(TypeMoq.It.isAny(), TypeMoq.It.isAny())).returns(() => Id64.fromString("FakePhysModelId"));
    mockIModelDbHandler.setup((_) => _.getCodeSpecByName(TypeMoq.It.isAny(), TypeMoq.It.isAny())).returns(() => this.getMockCodeSpec());
    // mockIModelDbHandler.setup((_) => _.insertSpatialCategory(TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny())).returns(() => new Id64("FakeSpatialCategoryId"));
    return mockIModelDbHandler.object;
  }
  public static getMockCodeSpec(): CodeSpec {
    const mockCodeSpec = TypeMoq.Mock.ofType<CodeSpec>();
    return mockCodeSpec.object;
  }
  public static getFakeIModelDbPath(): string {
    const pathname: string = this.fakeIModelName + ".bim";
    return pathname;
  }
  public static getFakeActivityLoggingContext(): AuthorizedClientRequestContext {
    return new AuthorizedClientRequestContext(this.getMockAccessToken());
  }
  public static getMockIModelDbElements(): IModelDb.Elements {
    const mockIModelDbElements: TypeMoq.IMock<IModelDb.Elements> = TypeMoq.Mock.ofType(IModelDb.Elements);
    mockIModelDbElements.setup((_) => _.insertElement(TypeMoq.It.isAny())).returns(() => this.getFakeElementId());
    mockIModelDbElements.setup((_) => _.getElement(TypeMoq.It.isAny())).returns(() => this.getMockIModelDbElement());
    mockIModelDbElements.setup((_) => _.queryElementIdByCode(TypeMoq.It.isAny())).returns(() => this.getFakeElementId());
    return mockIModelDbElements.object;
  }
  public static getMockIModelDbElement(): GeometricElement3d {
    const element = TypeMoq.Mock.ofType<GeometricElement3d>();
    return element.object;
  }
  public static getMockAccessToken(): AccessToken {
    const mockAccessToken = TypeMoq.Mock.ofType<AccessToken>();
    mockAccessToken.setup((_) => _.toTokenString()).returns(() => this.fakeAccessToken);
    return mockAccessToken.object;
  }
  public static getFakeAccessToken(): AccessToken {
    const token = AccessToken.fromForeignProjectAccessTokenJson(this.fakeAccessToken);
    return token!;
  }
  public static getFakeIModelId(): string {
    return "FAKE_IMODEL_ID";
  }
  public static getFakeCategoryId(): Id64String {
    return Id64.fromString("FakeCategoryId");
  }
  public static getFakeCodeSpecId(): Id64String {
    return Id64.fromString("FakeCodeSpecId");
  }
  public static getFakePhysicalModelId(): Id64String {
    return Id64.fromString("FakePhysicalModelId");
  }
  public static getFakeElementId(): Id64String {
    return Id64.fromString("FakeElementId");
  }
  public static getFakeProjectId(): string {
    return "FakePhysicalModelId";
  }
}
