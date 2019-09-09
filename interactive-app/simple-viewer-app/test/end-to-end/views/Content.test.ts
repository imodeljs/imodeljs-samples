/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import * as Puppeteer from "puppeteer";
import { expect } from "chai";
import { page } from "../setupTests";
import { signIn, findByText } from "../helpers";
import { Config } from "@bentley/imodeljs-clients";

async function openIModel() {
  // Wait for "Open iModel" button to appear
  await page.waitForSelector(".button-open-imodel");

  // Set up a promise for alert popup
  const dialogPromise = new Promise((response) => page.on("dialog", response));

  // Open iModel
  await page.click(".button-open-imodel");

  // If there's an alert with an error message, catch it earlier than 5 mins
  await Promise.race([
    dialogPromise.then((dialog) => { throw new Error((dialog as Puppeteer.Dialog).message()); }),
    page.waitFor(5000),
  ]);

  // Wait for at least one node to show up in the tree
  await page.waitForSelector(`[data-testid="tree-node"]`, {timeout: 300000}); // 5 min. timeout, IModel may take a long time to load
}

async function findNode(text: string) {
  const selector = `//div[contains(@data-testid, "tree-node") and contains(., "${text}")]`;

  // Wait for Node to render
  await page.waitForXPath(selector, { visible: true });

  // Find Node
  const elementHandles = await page.$x(selector);
  if (!elementHandles[0])
    throw Error(`Node "${text}" not found!`);

  return elementHandles[0];
}

async function findAndExpandNode(text: string) {
  const nodeHandle = await findNode(text);

  // Expand it
  const expansionHandle = await nodeHandle.$(`[data-testid="tree-node-expansion-toggle"]`);
  if (!expansionHandle)
    throw Error(`Expansion handle for node "${text}" not found!`);
  await expansionHandle.click();
}

describe("Content view", () => {

  it("renders after loading iModel", async () => {
    await signIn(page);
    await openIModel();

    // Make sure that iModel canvas has appeared
    await page.waitForSelector("canvas");

    // Make sure that property pane is rendered
    await page.waitForSelector(".components-property-grid");

    // Make sure that table is rendered
    await page.waitForSelector(".components-table");

    // Make sure that toolbar is rendered
    await page.waitForSelector(".toolbar");
  });

  it("loads table and property data after clicking on a tree node", async () => {
    await signIn(page);
    await openIModel();

    // Make sure that neither table nor property pane renders before data is loaded
    expect(async () => page.$(".components-table .components-table-cell")).to.throw;
    expect(async () => page.$(".components-property-grid .components-property-category-block")).to.throw;

    // Expand nodes
    await findAndExpandNode(Config.App.getString("imjs_test_project"));
    await findAndExpandNode("BisCore.DictionaryModel");
    await findAndExpandNode("Line Style");

    // Find and select 'lc1' node
    const nodeHandle = await findNode("lc1");
    await nodeHandle.hover(); // Ensure that mouse is over the node
    await nodeHandle.click();

    // Wait for table to load
    await page.waitForSelector(".components-table .components-table-cell");

    // Limit search to table
    const tableHandle = await page.$(".components-table");
    expect(tableHandle, "Table wrapper not found!").to.exist;
    // Find "lc1" in table
    await findByText(tableHandle!, "lc1");

    // Expand properties
    await page.waitFor(".uicore-expandable-blocks-block .title");
    const expanderHandle = await page.$$(".uicore-expandable-blocks-block .title");
    expect(expanderHandle[0], "Property Pane block not found!").to.exist;
    await expanderHandle[0]!.click();

    // Limit search to properties
    const propertiesHandle = await page.$(".components-property-grid-wrapper");
    expect(propertiesHandle, "Property Pane wrapper not found!").to.exist;
    // Find "lc1" in properties
    await findByText(propertiesHandle!, "lc1");
  });

});
