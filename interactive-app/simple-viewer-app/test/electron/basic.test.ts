/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
import { Application } from "spectron";
import { assert } from "chai";
import * as path from "path";
import * as app from "electron";

describe("Application launch", () => {
  let testApp: Application;
  beforeEach(async () => {
    testApp = new Application({
      path: app as any,
      args: [path.join(__dirname, "..", "..", "lib/backend/main.js")],
    });
    return testApp.start();
  });

  afterEach(async () => {
    if (testApp && testApp.isRunning()) {
      return testApp.stop();
    } else {
      return testApp;
    }
  });

  it("shows an initial window", async () => {
    return testApp.client.getWindowCount().then((count) => {
      assert.equal(count, 1);
      // Please note that getWindowCount() will return 2 if `dev tools` are opened.
      // assert.equal(count, 2)
    });
  });

  it("sign page", async () => {
    testApp.client.waitForExist(".components-signin-offline").then((t) => {
      assert.isTrue(t);
    }).waitForExist(".components-signin-button").then((t) => {
      assert.isTrue(t);
    });
  });
});
