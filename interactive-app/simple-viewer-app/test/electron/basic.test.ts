/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Config } from "@bentley/imodeljs-clients";
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
      .waitForExist(".components-signin-prompt", 55000)
      .element(".components-signin-button").click()
      .waitForExist(".form-signin", 55000);
  });

  it("can sign-in to bentley ims", async () => {
    return testApp.client
      .setValue("#EmailAddress", Config.App.getString("imjs_test_regular_user_name")) // 1st sign in page
      .setValue("#Password", Config.App.getString("imjs_test_regular_user_password"))
      .element("#submitLogon").click()
      .waitForExist(".button-open-imodel", 55000); // Passes when open iModel button appears
  });
});
