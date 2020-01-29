/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import { page } from "../setupTests";
import { signIn } from "../helpers";

describe("Open iModel view", () => {

  it("renders after sign in", async () => {
    await signIn(page);
    await page.waitForSelector(".button-open-imodel", { timeout: 5000 });
  });

});
