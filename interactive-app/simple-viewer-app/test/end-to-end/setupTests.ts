/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import * as Puppeteer from "puppeteer";
export let browser: Puppeteer.Browser;

before(async () => {
  browser = await Puppeteer.launch({ headless: false });
});

after(async () => {
  await browser.close();
});

export let page: Puppeteer.Page;

beforeEach(async () => {
  const context = await browser.createIncognitoBrowserContext();
  page = await context.newPage();
  await page.setViewport({ height: 1080, width: 1920 });
  await page.goto("http://localhost:3000");
});

afterEach(async () => {
  await page.close();
});
