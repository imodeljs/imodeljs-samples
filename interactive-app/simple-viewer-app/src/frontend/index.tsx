/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import * as ReactDOM from "react-dom";

import { Logger, LogLevel } from "@bentley/bentleyjs-core";

import { SimpleViewerApp } from "./api/SimpleViewerApp";
import App from "./components/App";
import "./index.css";
import setupEnv, { AppLoggerCategory } from "../common/configuration";

// setup environment
setupEnv();

// initialize logging to the console
Logger.initializeToConsole();
Logger.setLevelDefault(LogLevel.Warning); // Set all logging to a default of Warning
Logger.setLevel(AppLoggerCategory.Frontend, LogLevel.Info); // Override the above default and set only App level logging to Info.

// initialize the application
SimpleViewerApp.startup();

// tslint:disable-next-line:no-floating-promises
SimpleViewerApp.ready.then(() => {
  // when initialization is complete, render
  ReactDOM.render(
    <App />,
    document.getElementById("root") as HTMLElement,
  );
});
