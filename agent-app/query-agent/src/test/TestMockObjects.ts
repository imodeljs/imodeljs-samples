/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { BriefcaseProvider } from "../BriefcaseProvider";
import { QueryAgentWebServer } from "../QueryAgentWebServer";
import { ChangeSummaryExtractor } from "../ChangeSummaryExtractor";
import { AccessToken, IModelHubClient, EventSubscription, IModelHubEvent, EventHandler, EventSubscriptionHandler, ConnectClient, Project, IModelsHandler, HubIModel } from "@bentley/imodeljs-clients";
import { IModelDb } from "@bentley/imodeljs-backend";
import * as TypeMoq from "typemoq";
import * as express from "express";
import { OidcAgentClient } from "@bentley/imodeljs-clients-backend";
import * as http from "http";
import { Config } from "@bentley/imodeljs-clients";
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

    public static readonly fakeAccessToken: string = "FAKE_ACCESS_TOKEN";
    public static getMockChangeSummaryExtractor(): ChangeSummaryExtractor {
        const mockExtractor = TypeMoq.Mock.ofType<ChangeSummaryExtractor>();
        return mockExtractor.object;
    }
    public static getMockExpressWebServer(): express.Express {
        const mockServer = TypeMoq.Mock.ofType<express.Express>();
        const mockHttpServer = TypeMoq.Mock.ofType<http.Server>();
        mockHttpServer.setup((_) => _.on(TypeMoq.It.isAny(), TypeMoq.It.isAny())).returns(() => mockHttpServer.object);
        mockServer.setup((_) => _.listen(TypeMoq.It.isAny(), TypeMoq.It.isAny())).returns(() => mockHttpServer.object);
        return mockServer.object;
    }
    public static getMockConnectClient(): ConnectClient {
        const mockConnectClient = TypeMoq.Mock.ofType<ConnectClient>();
        const project = new Project();
        project.wsgId = "FAKE_WSG_ID";
        mockConnectClient.setup((_) => _.getProject(TypeMoq.It.isAny(), TypeMoq.It.isAny())).returns(async () => project);
        return mockConnectClient.object;
    }
    public static getMockProcess(): NodeJS.Process {
        const mockProcess = TypeMoq.Mock.ofType<NodeJS.Process>();
        mockProcess.setup((_) => _.exit(TypeMoq.It.isAny()));
        return mockProcess.object;
    }
    public static getMockQueryAgentWebServer(runThrowsError = false, runResult = true): QueryAgentWebServer {
        const mockAgentWebServer = TypeMoq.Mock.ofType<QueryAgentWebServer>();
        if (runThrowsError)
            mockAgentWebServer.setup((_) => _.run()).throws(new Error("Mock web server run failure"));
        else
            mockAgentWebServer.setup((_) => _.run()).returns(async () => runResult);

        return mockAgentWebServer.object;
    }
    public static getMockOidcAgentClient(throwsError = false): OidcAgentClient {
        const mockOidcAgentClient = TypeMoq.Mock.ofType<OidcAgentClient>();
        if (throwsError)
            mockOidcAgentClient.setup((_) => _.getToken(TypeMoq.It.isAny())).throws(new Error("Mock login failure"));
        else
            mockOidcAgentClient.setup((_) => _.getToken(TypeMoq.It.isAny())).returns(async () => this.getFakeAccessToken());
        return mockOidcAgentClient.object;
    }

    public static getMockIModelDb(): IModelDb {
        const mockIModelDb = TypeMoq.Mock.ofType<IModelDb>();
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
        const token = AccessToken.fromForeignProjectAccessTokenJson(this.fakeAccessToken);
        return token!;
    }
    public static getFakeIModelId(): string {
        return "FAKE_IMODEL_ID";
    }
    public static getFakeProjectId(): string {
        return "FakePhysicalModelId";
    }
}
