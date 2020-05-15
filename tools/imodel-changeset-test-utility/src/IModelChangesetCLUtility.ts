/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { RequestHost } from "@bentley/backend-itwin-client";
import { ChangesetGenerationHarness } from "./ChangesetGenerationHarness";
import { TestChangesetSequence } from "./TestChangesetSequence";
import { ChangesetGenerationConfig } from "./ChangesetGenerationConfig";

class ProcessHandler {
  constructor(private _process: NodeJS.Process) { }
  public exitSuccessfully() { this._process.exit(); }
  public exitWithError() { this._process.exit(1); }
}
/** Main entry point for Command Line Utility */
export const main = async (_process: NodeJS.Process, harness?: ChangesetGenerationHarness): Promise<void> => {

  // Initialize basic settings for all backend HTTP requests
  await RequestHost.initialize();

  if (!harness)
    harness = new ChangesetGenerationHarness();
  const processHandler = new ProcessHandler(_process);
  // Generate changeset sequence
  const changesetSequence: TestChangesetSequence = new TestChangesetSequence(ChangesetGenerationConfig.numChangesets, ChangesetGenerationConfig.numCreatedPerChangeset,
    ChangesetGenerationConfig.changesetPushDelay);
  let success = false;
  try {
    success = await harness.generateChangesets(changesetSequence);
  } catch { }
  if (success)
    processHandler.exitSuccessfully();
  processHandler.exitWithError();
};

// Invoke main if IModelChangesetCLUtility.js is being run directly
if (require.main === module) {
  // tslint:disable-next-line:no-floating-promises
  main(process);
}
