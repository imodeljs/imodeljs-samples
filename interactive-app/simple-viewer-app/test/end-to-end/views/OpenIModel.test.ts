/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { page } from "../setupTests";
import { signIn } from "../helpers";

describe("Open iModel view", () => {

  it("renders after sign in", async () => {
    await signIn(page);
    await page.waitForSelector(".button-open-imodel", {timeout: 5000});
  });

});
