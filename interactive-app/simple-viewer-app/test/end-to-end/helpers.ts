/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Config } from "@bentley/bentleyjs-core";
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
  const userName = Config.App.getString("imjs_test_regular_user_name");
  const pw = Config.App.getString("imjs_test_regular_user_password");

  await page.waitForSelector(".components-signin-button");
  await page.click(".components-signin-button");

  await page.waitForNavigation({
    // Need to wait for 'load' here due to slower connections. With a fast connection,
    // the redirect happens so quickly it doesn't hit the 500 ms threshold that puppeteer expects for an idle network, "networkidle2".
    waitUntil: "load",
  });

  if (-1 !== page.url().indexOf("/IMS/Account/Login"))
    await fillInSignin(page, userName, pw);
  else
    await newSignin(page, userName, pw);
}

/** Fill in sign in form with test credentials and submit */
async function fillInSignin(page: Puppeteer.Page, userName: string, pw: string) {
  await page.waitForSelector("#submitLogon");

  await page.type("#EmailAddress", userName);
  await page.type("#Password", pw);

  await page.click("#submitLogon");

  // Try to catch failed logins
  try {
    const errorSelectors = ["#messageControlDiv", ".consent-buttons"];
    const jsHandle = await page.waitForFunction((selectors) => {
      for (const selector of selectors) {
        if (document.querySelector(selector) !== null) {
          return selector;
        }
      }
      return false;
    }, { timeout: 2000 }, errorSelectors);
    const selector = await jsHandle.jsonValue();

    // If .consent-buttons is found. Click the consent button
    if (selector === errorSelectors[1]) {
      await page.click("#connect-main > div > div > form > div.consent-buttons > div.consent-buttons-nowrap > button.bwc-button-primary");
    } else if (selector === errorSelectors[0]) {
      // #messageControlDiv found. Throw failed login error.
      throw new Error(`Failed login to ${page.url()} for ${Config.App.getString("imjs_test_regular_user_name")}`);
    }
  } catch (e) {
    // Ignore Timeout errors
    if (!e.name.includes("Timeout")) {
      throw e;
    }
  }
}

async function newSignin(page: Puppeteer.Page, userName: string, pw: string) {
  await page.waitForSelector("#identifierInput");
  await page.type("#identifierInput", userName);
  await page.waitForSelector(".allow");
  await page.$eval(".allow", (button: any) => button.click());
  await page.waitForSelector("#password");
  await page.type("#password", pw);
  await page.$eval(".allow", (button: any) => button.click());
}
