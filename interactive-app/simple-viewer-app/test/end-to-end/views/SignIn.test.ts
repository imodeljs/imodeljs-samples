/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import { page } from "../setupTests";

describe("Sign in view", () => {

  it("renders initially", async () => {
    await page.waitForSelector(".components-signin-button");

    // Verify that welcome message exists
    await page.waitForSelector(".components-signin-prompt");

    // Verify that "Register" link exists
    await page.waitForSelector(".components-signin-register a");
  });

});
