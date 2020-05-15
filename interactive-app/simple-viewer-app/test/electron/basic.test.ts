/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Application } from "spectron";
import { assert } from "chai";
import * as path from "path";
import * as app from "electron";

describe("Application", () => {
  let testApp: Application;
  before(async () => {
    testApp = new Application({
      path: app as any,
      args: [path.join(__dirname, "..", "..", "lib/backend/main.js")],
      requireName: "electronRequire",
    });
    return testApp.start();
  });

  after(async () => {
    if (testApp && testApp.isRunning()) {
      return testApp.stop();
    } else {
      return testApp;
    }
  });

  it("opens window", () => {
    testApp.client.waitUntilWindowLoaded();
    return testApp.client.getWindowCount().then((count) => {
      // Only one window should open, note that if
      // dev tools are open window count will equal 2
      assert.equal(count, 1);
    });
  });

  it("opens sign-in page", async () => {
    return testApp.client
      .waitForExist(".components-signin-prompt", 55000);
  });
});
