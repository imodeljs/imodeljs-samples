/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import * as Puppeteer from "puppeteer";
export let browser: Puppeteer.Browser;

before(async () => {
  browser = await Puppeteer.launch();
});

after(async () => {
  await browser.close();
});

export let page: Puppeteer.Page;

beforeEach(async () => {
  page = await browser.newPage();
  await page.setViewport({ height: 1080, width: 1920 });
  await page.goto("http://localhost:3000");
  await page.setCacheEnabled(false);
  await page.target().createCDPSession().then((session) => session.send("Network.clearBrowserCookies"));
});

afterEach(async () => {
  await page.close();
});
