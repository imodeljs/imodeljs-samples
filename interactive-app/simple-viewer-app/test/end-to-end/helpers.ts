/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
import { Config } from "@bentley/imodeljs-clients";
import * as Puppeteer from "puppeteer";

/** Wait for the specified text to appear on the page */
export async function waitForText(page: Puppeteer.Page, text: string, options?: Puppeteer.WaitForSelectorOptions) {
  await page.waitForXPath(`//text()[contains(., '${text}')]`, { visible: true, ...options });
}

/** Find an element in the DOM by specified text */
export async function findByText(element: Puppeteer.Page | Puppeteer.ElementHandle, text: string) {
  const elements = await element.$x(`//text()[contains(., '${text}')]/..`);

  if (elements.length)
    return elements[0];

  throw Error(`Element "${text}" not found!`);
}

/** Sign in to the main page using test credentials */
export async function signIn(page: Puppeteer.Page) {
  await page.waitForSelector(".components-signin-button");
  await page.click(".components-signin-button");

  await fillInSignin(page);
}

/** Fill in sign in form with test credentials and submit */
export async function fillInSignin(page: Puppeteer.Page) {
  await page.waitForSelector("#submitLogon");

  await page.type("#EmailAddress", Config.App.getString("imjs_test_regular_user_name"));
  await page.type("#Password", Config.App.getString("imjs_test_regular_user_password"));

  await page.click("#submitLogon");

  // Try to catch failed logins
  try {
    await page.waitForSelector("#messageControlDiv", { visible: true, timeout: 1000 }).then(() => { throw new Error(`Failed login to ${page.url()} for ${Config.App.getString("imjs_test_regular_user_name")} using ${Config.App.getString("IMJS_BUDDI_RESOLVE_URL_USING_REGION")}`); });
  } catch (e) {
    // Ignore Timeout errors
    if (!e.name.includes("Timeout")) {
      throw e;
    }
  }
}
