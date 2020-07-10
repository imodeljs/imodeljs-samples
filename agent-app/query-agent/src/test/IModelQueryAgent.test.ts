/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { expect } from "chai";
import * as path from "path";
import { readdirSync } from 'fs';

import { Config, Logger, LogLevel } from "@bentley/bentleyjs-core";
import { AuthorizedClientRequestContext, AccessToken } from "@bentley/itwin-client";
import { ChangesetGenerationHarness, TestChangesetSequence, HubUtility, ChangesetGenerationConfig } from "imodel-changeset-test-utility";

import { QueryAgent } from "../QueryAgent";
import { QueryAgentConfig } from "../QueryAgentConfig";
import { TestMockObjects } from "./TestMockObjects";
import { ChangeSummaryExtractor } from "../ChangeSummaryExtractor";
import { IModelHost, AuthorizedBackendRequestContext } from "@bentley/imodeljs-backend";

// Unit Tests
describe("QueryAgent", () => {
  let agent: QueryAgent;
  before(() => {
    TestMockObjects.setupMockAppConfig();
  });

  after(() => {
    TestMockObjects.clearMockAppConfig();
    IModelHost.authorizationClient = undefined;
  });

  it("Extracts changeset information published to an iModel", async () => {
    IModelHost.authorizationClient = TestMockObjects.getMockOidcAgentClient();
    agent = new QueryAgent(TestMockObjects.getMockHubClient(), TestMockObjects.getMockContextRegistryClient(), TestMockObjects.getMockBriefcaseProvider(),
      TestMockObjects.getMockChangeSummaryExtractor());
    await agent.listenForAndHandleChangesets(10);
    await agent.listenForAndHandleChangesets(10);
  });

  it("Throws error when async initialization fails", async () => {
    const throwError = true;
    IModelHost.authorizationClient = TestMockObjects.getMockOidcAgentClient(throwError);
    agent = new QueryAgent(TestMockObjects.getMockHubClient(), TestMockObjects.getMockContextRegistryClient(), TestMockObjects.getMockBriefcaseProvider(),
      TestMockObjects.getMockChangeSummaryExtractor());
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

  it("Uses the project name if the iModel name is not defined", () => {
    TestMockObjects.clearMockAppConfigProjectName();
    expect(QueryAgentConfig.projectName).equals(QueryAgentConfig.iModelName);

    TestMockObjects.setupMockAppConfig(); // If all the configuration variables don't exist at clean up, an error gets thrown.
  });

  it("Uses __dirname/output as default output directory", () => {
    expect(QueryAgentConfig.outputDir).equals(path.join(__dirname, "../", "output"));
  });
});

describe("QueryAgent", () => {
  let agent: QueryAgent;

  before(async () => {
    TestMockObjects.setupMockAppConfig();
    IModelHost.authorizationClient = TestMockObjects.getMockOidcAgentClient();
    agent = new QueryAgent(TestMockObjects.getMockHubClient(), TestMockObjects.getMockContextRegistryClient(), TestMockObjects.getMockBriefcaseProvider(),
      TestMockObjects.getMockChangeSummaryExtractor());
    await agent.initialize();
  });

  after(() => {
    TestMockObjects.clearMockAppConfig();
    IModelHost.authorizationClient = undefined;
  });

  it("Extracts changeset information published to an iModel", async () => {
    await agent.run(10);
  });

  it("Returns false when listen for changesets routine throws error", async () => {
    const throwError = true;
    IModelHost.authorizationClient = TestMockObjects.getMockOidcAgentClient(throwError);
    const localAgent: QueryAgent = new QueryAgent(TestMockObjects.getMockHubClient(), TestMockObjects.getMockContextRegistryClient(), TestMockObjects.getMockBriefcaseProvider(),
      TestMockObjects.getMockChangeSummaryExtractor());
    await localAgent.initialize();
    await localAgent.run(10);
    // The should pass if it doesn't throw...
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
    IModelHost.authorizationClient = TestMockObjects.getMockOidcAgentClient();
    const requestContext = await AuthorizedBackendRequestContext.create();
    const ret = await changeSummaryExtractor.extractChangeSummary(requestContext, TestMockObjects.getMockIModelDb(), "FAKE_CHANGESET_ID");
    expect(ret).equals(undefined);
  });
});

// Basic Code Level Integration Tests
describe("IModelQueryAgent Running with Changesets (#integration)", () => {
  let changesetHarness: ChangesetGenerationHarness;
  let requestContext: AuthorizedClientRequestContext;
  let agent: QueryAgent;
  let hubUtility: HubUtility = new HubUtility();
  let accessToken: AccessToken;

  before(async () => {
    (Config.App as any).appendSystemVars();
    QueryAgentConfig.setupConfig();

    Logger.initializeToConsole();
    Logger.setLevelDefault(LogLevel.Trace);
    Logger.setLevel(QueryAgentConfig.loggingCategory, LogLevel.Trace);

    accessToken = await hubUtility.login();
    requestContext = new AuthorizedClientRequestContext(accessToken!);

    agent = new QueryAgent();
    await agent.initialize()

    // Set up changeset generation harness and agent web server
    changesetHarness = new ChangesetGenerationHarness(undefined, undefined, QueryAgentConfig.outputDir);
    // initialize iModel in the hub before listening for changesets on it
    await changesetHarness.initialize();
  });

  after(async () => {
    Logger.logTrace(QueryAgentConfig.loggingCategory, "Cleaning up test resources, may take some time...");
    if (requestContext) {
      // Purge briefcases that are close to reaching the aquire limit
      await hubUtility.purgeAcquiredBriefcases(requestContext, ChangesetGenerationConfig.projectName, ChangesetGenerationConfig.iModelName);
    }
  });

  it("Extracts changeset information published to an iModel", async () => {
    // numChangesets must be even so all created changesets are included in a version.
    const numChangeSets = 4;
    const changesetSequence = new TestChangesetSequence(numChangeSets, 5, 2000);

    // Listen for changeset we are generating. 
    const promise = agent.run(25000);
    const changesetGenerated = await changesetHarness.generateChangesets(changesetSequence);
    expect(changesetGenerated).to.be.true;

    // Wait for agent to finish listening
    await promise;
    const items = readdirSync(path.join(QueryAgentConfig.outputDir, "changeSummaries"));
    expect(items.length).to.equal(numChangeSets);
  });
});
