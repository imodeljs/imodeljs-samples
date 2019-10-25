/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { expect } from "chai";
import { Config } from "@bentley/imodeljs-clients";
import { QueryAgent } from "../QueryAgent";
import { QueryAgentWebServer } from "../QueryAgentWebServer";
import { QueryAgentConfig } from "../QueryAgentConfig";
import { ChangesetGenerationHarness, TestChangesetSequence } from "imodel-changeset-test-utility";
import { Logger } from "@bentley/bentleyjs-core";
import { TestMockObjects } from "./TestMockObjects";
import { main } from "../Main";
import { ChangeSummaryExtractor } from "../ChangeSummaryExtractor";
import * as express from "express";
import * as request from "supertest";
import * as path from "path";

// Unit Tests
describe("QueryAgent", () => {
  let agent: QueryAgent;
  before(() => {
    TestMockObjects.setupMockAppConfig();
  });

  after(() => {
    TestMockObjects.clearMockAppConfig();
  });

  it("Extracts changeset information published to an iModel", async () => {
    agent = new QueryAgent(TestMockObjects.getMockHubClient(), TestMockObjects.getMockConnectClient(), TestMockObjects.getMockBriefcaseProvider(),
      TestMockObjects.getMockChangeSummaryExtractor(), TestMockObjects.getMockOidcAgentClient());
    await agent.listenForAndHandleChangesets(10);
    await agent.listenForAndHandleChangesets(10);
  });

  it("Throws error when async initialization fails", async () => {
    const throwError = true;
    agent = new QueryAgent(TestMockObjects.getMockHubClient(), TestMockObjects.getMockConnectClient(), TestMockObjects.getMockBriefcaseProvider(),
      TestMockObjects.getMockChangeSummaryExtractor(), TestMockObjects.getMockOidcAgentClient(throwError));
    try {
      await agent.listenForAndHandleChangesets(10);
    } catch (error) {
      expect(error !== undefined).equals(true);
    }
  });
});
describe("QueryAgentConfig", () => {
  before(() => {
    TestMockObjects.setupMockAppConfig();
  });

  after(() => {
    TestMockObjects.clearMockAppConfig();
  });

  it("Uses __dirname/output as default output directory", () => {
    expect(QueryAgentConfig.outputDir).equals(path.join(__dirname, "../", "output"));
  });
});

describe("QueryAgentWebServer", () => {
  let agentWebServer: QueryAgentWebServer;

  before(() => {
    TestMockObjects.setupMockAppConfig();
    const agent: QueryAgent = new QueryAgent(TestMockObjects.getMockHubClient(), TestMockObjects.getMockConnectClient(), TestMockObjects.getMockBriefcaseProvider(),
      TestMockObjects.getMockChangeSummaryExtractor(), TestMockObjects.getMockOidcAgentClient());
    const webServer: express.Express = TestMockObjects.getMockExpressWebServer();
    agentWebServer = new QueryAgentWebServer(webServer, agent);
  });

  after(() => {
    TestMockObjects.clearMockAppConfig();
    Logger.logTrace(QueryAgentConfig.loggingCategory, "Cleaning up test resources, may take some time...");
    if (agentWebServer)
      agentWebServer.close();
  });

  it("Extracts changeset information published to an iModel", async () => {
    const listened = await agentWebServer.run(10);
    expect(listened).equals(true);
  });

  it("Returns false when listen for changesets routine throws error", async () => {
    const throwError = true;
    const agent: QueryAgent = new QueryAgent(TestMockObjects.getMockHubClient(), TestMockObjects.getMockConnectClient(), TestMockObjects.getMockBriefcaseProvider(),
      TestMockObjects.getMockChangeSummaryExtractor(), TestMockObjects.getMockOidcAgentClient(throwError));
    const webServer: express.Express = TestMockObjects.getMockExpressWebServer();
    agentWebServer = new QueryAgentWebServer(webServer, agent);
    const listened = await agentWebServer.run();
    expect(listened).equals(false);
  });
});
describe("Main", () => {
  let mockQueryAgentWebServer: QueryAgentWebServer;
  const mockProcess: NodeJS.Process = TestMockObjects.getMockProcess();

  before(() => {
    TestMockObjects.setupMockAppConfig();
  });

  after(() => {
    TestMockObjects.clearMockAppConfig();
  });

  it("runs the Query Agent Web Server and handles process when invoked", async () => {
    mockQueryAgentWebServer = TestMockObjects.getMockQueryAgentWebServer();
    await main(mockProcess, mockQueryAgentWebServer);
  });

  it("Catches error thrown when running Query Agent Web Server", async () => {
    const runThrowsError = true;
    mockQueryAgentWebServer = TestMockObjects.getMockQueryAgentWebServer(runThrowsError);
    await main(mockProcess, mockQueryAgentWebServer);
  });

  it("Executes properly when run result is false", async () => {
    const runThrowsError = false;
    const runResult = false;
    mockQueryAgentWebServer = TestMockObjects.getMockQueryAgentWebServer(runThrowsError, runResult);
    await main(mockProcess, mockQueryAgentWebServer);
  });
});

describe("ChangeSummaryExtractor", () => {
  let changeSummaryExtractor: ChangeSummaryExtractor;

  before(() => {
    TestMockObjects.setupMockAppConfig();
    changeSummaryExtractor = new ChangeSummaryExtractor();
  });

  after(() => {
    TestMockObjects.clearMockAppConfig();
  });

  it("Catches errors in its method", async () => {
    // Will throw error when the ChangeSummaryManager tries to extract summaries with a fake access token
    const ret = await changeSummaryExtractor.extractChangeSummary(TestMockObjects.getFakeAccessToken(), TestMockObjects.getMockIModelDb(), "FAKE_CHANGESET_ID");
    expect(ret).equals(undefined);
  });
});

// Basic Code Level Integration Tests
describe("IModelQueryAgentWebServer (#integration)", () => {
  let agentWebServer: QueryAgentWebServer;

  before(async () => {
    (Config.App as any).appendSystemVars();
    QueryAgentConfig.setupConfig();
    agentWebServer = new QueryAgentWebServer();
  });

  after(() => {
    agentWebServer.close();
  });

  it("Web server responds to '/' and '/ping'", async () => {
    const server = agentWebServer.getServer();
    let ret;
    ret = await request(server).get("/");
    expect(ret.status).equals(200);
    ret = await request(server).get("/ping");
    expect(ret.status).equals(200);
  });

  it("Extracts changeset information published to an iModel", async () => {
    const listened = await agentWebServer.run(10);
    expect(listened).equals(true);
  });
});
describe("Main (#integration)", () => {
  before(async () => {
    (Config.App as any).appendSystemVars();
    QueryAgentConfig.setupConfig();
  });

  it("Runs the Query Agent Web Server when invoked", async () => {
    // Use mock process to avoid exiting the test process
    await main(TestMockObjects.getMockProcess(), new QueryAgentWebServer(), 10);
  });
});
describe("IModelQueryAgent Running with Changesets (#integration)", () => {
  let changesetHarness: ChangesetGenerationHarness;
  let agentWebServer: QueryAgentWebServer;

  before(async () => {
    (Config.App as any).appendSystemVars();
    QueryAgentConfig.setupConfig();

    // Set up changeset generation harness and agent web server
    changesetHarness = new ChangesetGenerationHarness(undefined, undefined, QueryAgentConfig.outputDir);
    // initialize iModel in the hub before listening for changesets on it
    await changesetHarness.initialize();
    agentWebServer = new QueryAgentWebServer();
  });

  after(() => {
    Logger.logTrace(QueryAgentConfig.loggingCategory, "Cleaning up test resources, may take some time...");
    agentWebServer.close();
  });

  it("Extracts changeset information published to an iModel", async () => {
    // Listen for changeset we are generating
    const changesetSequence = new TestChangesetSequence(5, 12, 2000);
    const [changesetGenerated, listened] = await Promise.all([changesetHarness.generateChangesets(changesetSequence), agentWebServer.run()]);
    expect(changesetGenerated).equals(true);
    expect(listened).equals(true);
  });
});
