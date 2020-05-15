/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as TypeMoq from "typemoq";

import { Config } from "@bentley/bentleyjs-core";
import { ContextRegistryClient, Project } from "@bentley/context-registry-client";
import { EventHandler, EventSubscription, EventSubscriptionHandler, HubIModel,
  IModelHubClient, IModelHubEvent, IModelsHandler,
} from "@bentley/imodelhub-client";
import { BriefcaseDb } from "@bentley/imodeljs-backend";
import { OidcAgentClient } from "@bentley/backend-itwin-client";
import { AccessToken, UserInfo } from "@bentley/itwin-client";

import { BriefcaseProvider } from "../BriefcaseProvider";
import { ChangeSummaryExtractor } from "../ChangeSummaryExtractor";

/** Static test mock objects */
export class TestMockObjects {
  public static setupMockAppConfig() {
    Config.App.merge({
      imjs_agent_client_id: "FAKE_CLIENT_ID",
      imjs_agent_client_secret: "FAKE_CLIENT_SECRET",
      imjs_agent_service_user_email: "FAKE_USER_EMAIL",
      imjs_agent_service_user_password: "FAKE_USER_PASS",
      imjs_agent_project_name: "FAKE_PROJECT_NAME",
      imjs_agent_imodel_name: "FAKE_IMODEL_NAME",
      agent_app_port: 3000,
      agent_app_listen_time: 20,
      imjs_buddi_resolve_url_using_region: "103",
      imjs_default_relying_party_uri: "https://fake.com",
    });
  }

  public static clearMockAppConfig() {
    Config.App.remove("imjs_agent_client_id");
    Config.App.remove("imjs_agent_client_secret");
    Config.App.remove("imjs_agent_service_user_email");
    Config.App.remove("imjs_agent_service_user_password");
    Config.App.remove("imjs_agent_project_name");
    Config.App.remove("imjs_agent_imodel_name");
    Config.App.remove("agent_app_port");
    Config.App.remove("agent_app_listen_time");
    Config.App.remove("imjs_buddi_resolve_url_using_region");
    Config.App.remove("imjs_default_relying_party_uri");
  }

  public static clearMockAppConfigProjectName() {
    Config.App.remove("imjs_agent_project_name");
  }
  
  public static readonly fakeAccessToken: string = "FAKE_ACCESS_TOKEN";
  public static getMockChangeSummaryExtractor(): ChangeSummaryExtractor {
    const mockExtractor = TypeMoq.Mock.ofType<ChangeSummaryExtractor>();
    return mockExtractor.object;
  }

  public static getMockContextRegistryClient(): ContextRegistryClient {
    const mockContextRegistryClient = TypeMoq.Mock.ofType<ContextRegistryClient>();
    const project = new Project();
    project.wsgId = "FAKE_WSG_ID";
    mockContextRegistryClient.setup((_) => _.getProject(TypeMoq.It.isAny(), TypeMoq.It.isAny())).returns(async () => project);
    return mockContextRegistryClient.object;
  }

  public static getMockOidcAgentClient(throwsError = false): OidcAgentClient {
    const mockOidcAgentClient = TypeMoq.Mock.ofType<OidcAgentClient>();
    if (throwsError)
      mockOidcAgentClient.setup((_) => _.getToken(TypeMoq.It.isAny())).throws(new Error("Mock login failure"));
    else
      mockOidcAgentClient.setup((_) => _.getToken(TypeMoq.It.isAny())).returns(async () => this.getFakeAccessToken());
    return mockOidcAgentClient.object;
  }

  public static getMockIModelDb(): BriefcaseDb {
    const mockIModelDb = TypeMoq.Mock.ofType<BriefcaseDb>();
    return mockIModelDb.object;
  }
  public static getMockBriefcaseProvider(throwsError: boolean = false): BriefcaseProvider {
    const mockBriefcaseProvider = TypeMoq.Mock.ofType(BriefcaseProvider);
    if (throwsError) {
      mockBriefcaseProvider.setup((_) => _.getBriefcase(TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(),
        TypeMoq.It.isAny())).throws(new Error("MOCK Briefcase provider failure"));
    } else {
      mockBriefcaseProvider.setup((_) => _.getBriefcase(TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny())).returns(async () => {
        return this.getMockIModelDb();
      });
    }
    return mockBriefcaseProvider.object;
  }
  public static getMockHubClient(): IModelHubClient {
    const mockHubClient: TypeMoq.IMock<IModelHubClient> = TypeMoq.Mock.ofType(IModelHubClient);
    mockHubClient.setup((_) => _.events).returns(() => this.getMockEventHandler());
    mockHubClient.setup((_) => _.iModels).returns(() => this.getMockIModelsHandler());
    return mockHubClient.object;
  }
  public static getMockIModelsHandler(): IModelsHandler {
    const hubIModel = new HubIModel();
    hubIModel.wsgId = "FAKE_WSG_ID";
    const hubIModels: HubIModel[] = [hubIModel];
    const mockIModelHandler = TypeMoq.Mock.ofType<IModelsHandler>();
    mockIModelHandler.setup((_) => _.get(TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny())).returns(async () => hubIModels);
    return mockIModelHandler.object;
  }
  public static getMockEventHandler(): EventHandler {
    const mockEventHandler: TypeMoq.IMock<EventHandler> = TypeMoq.Mock.ofType(EventHandler);
    mockEventHandler.setup((_) => _.subscriptions).returns(() => this.getMockEventSubscriptionHandler());
    const listener = (event: IModelHubEvent) => { event; };
    mockEventHandler.setup((_) => _.createListener(TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(),
      TypeMoq.It.isAny(), listener)).returns(() => async () => { });
    return mockEventHandler.object;
  }
  public static getMockEventSubscriptionHandler(): EventSubscriptionHandler {
    const mockEventSubscriptionHandler: TypeMoq.IMock<EventSubscriptionHandler> = TypeMoq.Mock.ofType(EventSubscriptionHandler);
    mockEventSubscriptionHandler.setup((_) => _.create(TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny())).returns(async () => this.getMockEventSubscription());
    return mockEventSubscriptionHandler.object;
  }
  public static getMockEventSubscription(): EventSubscription {
    const mockEventSubscription: TypeMoq.IMock<EventSubscription> = TypeMoq.Mock.ofType(EventSubscription);
    return mockEventSubscription.object;
  }
  public static getFakeAccessToken(): AccessToken {
    const token = DummyAccessToken.fromForeignProjectAccessTokenJson(this.fakeAccessToken);
    return token!;
  }
  public static getFakeIModelId(): string {
    return "FAKE_IMODEL_ID";
  }
  public static getFakeProjectId(): string {
    return "FakePhysicalModelId";
  }
}

export class DummyAccessToken extends AccessToken {
  public static foreignProjectAccessTokenJsonProperty = "ForeignProjectAccessToken";

  /** Sets up a new AccessToken based on some generic token abstraction used for iModelBank use cases
   * @internal
   */
  public static fromForeignProjectAccessTokenJson(foreignJsonStr: string): AccessToken | undefined {
    if (!foreignJsonStr.startsWith(`{\"${this.foreignProjectAccessTokenJsonProperty}\":`))
      return undefined;
    const props: any = JSON.parse(foreignJsonStr);
    if (props[this.foreignProjectAccessTokenJsonProperty] === undefined)
      return undefined;
    const tok = new DummyAccessToken(foreignJsonStr);

    const userInfoJson = props[this.foreignProjectAccessTokenJsonProperty].userInfo;
    const userInfo = UserInfo.fromJson(userInfoJson);
    tok.setUserInfo(userInfo);
    return tok;
  }
}
