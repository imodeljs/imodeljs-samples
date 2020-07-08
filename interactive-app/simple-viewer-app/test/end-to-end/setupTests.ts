/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import * as Puppeteer from "puppeteer";
import * as os from "os";

export let page: Puppeteer.Page;
export let browser: Puppeteer.Browser;

beforeEach(async () => {
  let launchOptions: Puppeteer.LaunchOptions = { dumpio: true }; // , headless: false };
  if (os.platform() === "linux") {
    launchOptions = {
      args: ["--no-sandbox"], // , "--disable-setuid-sandbox"],
    };
  }
  browser = await Puppeteer.launch(launchOptions);
  page = await browser.newPage();
  await page.setViewport({ height: 1080, width: 1920 });
  await page.goto("http://localhost:3000", { timeout: 0, waitUntil: "domcontentloaded" });
});

afterEach(async () => {
  await page.close();
  await browser.close();
});
