/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
if (window.location.href.indexOf("electron://") != 0) {
  if (process.env.NODE_ENV === "test") {
    window.electronRequire = require;
  } else {
    window.nodeRequire = require;
  }
  delete window.require;
  delete window.exports;
  delete window.module;
}