/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import * as ReactDOM from "react-dom";
import { Logger, LogLevel } from "@bentley/bentleyjs-core";
import { AppLoggerCategory } from "../common/LoggerCategory";
import { SimpleViewerApp } from "./api/SimpleViewerApp";
import App from "./components/App";
import "./index.css";

// Setup logging immediately to pick up any logging during SimpleViewerApp.startup()
Logger.initializeToConsole();
Logger.setLevelDefault(LogLevel.Warning); // Set all logging to a default of Warning
Logger.setLevel(AppLoggerCategory.Frontend, LogLevel.Info); // Override the above default and set only App level logging to Info.

(async () => {
  // initialize the application
  await SimpleViewerApp.startup();

  ReactDOM.render(
    <App />,
    document.getElementById("root") as HTMLElement,
  );
})(); // tslint:disable-line:no-floating-promises
