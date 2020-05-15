/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { expect } from "chai";
import { Config } from "@bentley/bentleyjs-core";
import { AuthorizedClientRequestContext, AccessToken } from "@bentley/itwin-client";
import { ChangesetGenerationHarness } from "../ChangesetGenerationHarness";
import { TestChangesetSequence } from "../TestChangesetSequence";
import { TestMockObjects } from "./TestMockObjects";
import { ChangesetGenerator } from "../ChangesetGenerator";
import { main } from "../IModelChangesetCLUtility";
import { ChangesetGenerationConfig } from "../ChangesetGenerationConfig";
import { HubUtility } from "../HubUtility";

describe("TestChangesetSequence", () => {
  const changesetCount = 10;
  const numCreatedPerChangeset = 10;

  before(() => {
    TestMockObjects.setupMockAppConfig();
  });

  after(() => {
    TestMockObjects.clearMockAppConfig();
  });

  it("Has elements deleted and updated per changeset as each half of the elements inserted", async () => {
    const sequence: TestChangesetSequence = new TestChangesetSequence(changesetCount, numCreatedPerChangeset);
    expect(sequence.elementsUpdatedPerChangeset).equals(numCreatedPerChangeset / 2, "updated = inserted / 2");
    expect(sequence.elementsDeletedPerChangeset).equals(numCreatedPerChangeset / 2, "deleted = inserted / 2");
  });
  it("Has a changeset push delay", async () => {
    const changesetPushDelay = 100;
    const sequence: TestChangesetSequence = new TestChangesetSequence(changesetCount, numCreatedPerChangeset, changesetPushDelay);
    expect(sequence.changesetPushDelay).equals(changesetPushDelay, "Has changeset push delay");
  });
});

describe("ChangesetGenerator", () => {

  before(() => {
    TestMockObjects.setupMockAppConfig();
  });

  after(() => {
    TestMockObjects.clearMockAppConfig();
  });

  it("Pushed test changesets and pauses", async () => {
    const changesetGenerator: ChangesetGenerator = new ChangesetGenerator(TestMockObjects.getMockAccessToken(), TestMockObjects.getMockHubUtility(), TestMockObjects.getFakePhysicalModelId(),
      TestMockObjects.getFakeCategoryId(), TestMockObjects.getFakeCodeSpecId(), TestMockObjects.getMockIModelDbHandler());
    const projectId = TestMockObjects.getFakeProjectId();
    const changesetSequence = new TestChangesetSequence(10, 10, 1);
    const iModelId = TestMockObjects.getFakeIModelId();
    expect(await changesetGenerator.pushTestChangeSetsAndVersions(projectId, iModelId, changesetSequence)).equals(true);
  });
});

describe("ChangesetGenerationHarness", () => {

  before(() => {
    TestMockObjects.setupMockAppConfig();
  });

  after(() => {
    TestMockObjects.clearMockAppConfig();
  });

  it("Is Configured with project and harness Config objects", async () => {
    const harness: ChangesetGenerationHarness = new ChangesetGenerationHarness();
    expect(harness);
  });

  it("Generates Changeset Sequences", async () => {
    const harness: ChangesetGenerationHarness = new ChangesetGenerationHarness(TestMockObjects.getMockHubUtility(), TestMockObjects.getMockIModelDbHandler());
    expect(harness);
    const changesetSequence = new TestChangesetSequence(10, 10, 1);
    expect(await harness.generateChangesets(changesetSequence)).equals(true);
  });
});

describe("IModelChangesetCLUtility", () => {
  const mockProcess: NodeJS.Process = TestMockObjects.getMockProcess();

  before(() => {
    TestMockObjects.setupMockAppConfig();
  });

  after(() => {
    TestMockObjects.clearMockAppConfig();
  });

  it("runs the Query Agent Web Server and handles process when invoked", async () => {
    await main(mockProcess, TestMockObjects.getMockChangesetGenerationHarness());
  });
  it("Catches error thrown when running Query Agent Web Server", async () => {
    const throwsError = true;
    await main(mockProcess, TestMockObjects.getMockChangesetGenerationHarness(throwsError));
  });
});

ChangesetGenerationConfig.setupConfig();
/** Basic Integration test for change set creation and pushing into IModelHub. */
describe("ChangesetGenerationHarnessIntegration (#integration)", () => {
  let hubUtility: HubUtility = new HubUtility();
  let accessToken: AccessToken;
  let requestContext: AuthorizedClientRequestContext;

  before(async () => {
    (Config.App as any).appendSystemVars();
    ChangesetGenerationConfig.setupConfig();
    accessToken = await hubUtility.login();
    requestContext = new AuthorizedClientRequestContext(accessToken!);
  });

  after(async () => {
    if (requestContext) {
      // Purge briefcases that are close to reaching the aquire limit
      await hubUtility.purgeAcquiredBriefcases(requestContext, ChangesetGenerationConfig.projectName, ChangesetGenerationConfig.iModelName);
    }
  });

  it("Generates configured changeset sequence", async () => {
    const harness: ChangesetGenerationHarness = new ChangesetGenerationHarness();
    const changesetSequence: TestChangesetSequence = new TestChangesetSequence(5, 20, 10);
    expect(await harness.generateChangesets(changesetSequence)).equals(true);
  });
});
