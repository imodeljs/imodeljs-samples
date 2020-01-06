/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
// A workaround to react-testing-library {dom-testing-library {wait-for-expect}} breaking somewhere,
// because somewhere (most likely in jsdom) window.Date becomes undefined.
// Similar issue mentioned in https://github.com/vuejs/vue-test-utils/issues/936
require('jsdom-global')();
window.Date = Date;

// Global setup for chai and snapshot testing to avoid doing it in each test file
const chai = require("chai");
const chaiJestSnapshot = require("chai-jest-snapshot");

chai.use(chaiJestSnapshot);

beforeEach(function () {
  const sourceFilePath = this.currentTest.file.replace("lib\\test", "src\\test").replace(/\.(jsx?|tsx?)$/, "");
  const snapPath = sourceFilePath + ".snap";

  chaiJestSnapshot.setFilename(snapPath);
  chaiJestSnapshot.setTestName(this.currentTest.fullTitle());
});

// This is required by the iModel.js I18n module (specifically the i18next package).
global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
