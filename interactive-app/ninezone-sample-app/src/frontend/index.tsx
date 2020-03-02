/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import * as ReactDOM from "react-dom";

import { Logger, LogLevel } from "@bentley/bentleyjs-core";

import { NineZoneSampleApp } from "./app/NineZoneSampleApp";
import App from "./components/App";
import "./index.scss";
import setupEnv, { AppLoggerCategory } from "../common/configuration";
import { AppUi } from "./app-ui/AppUi";

// setup environment
setupEnv();

// initialize logging
Logger.initializeToConsole();
Logger.setLevelDefault(LogLevel.Warning);
Logger.setLevel(AppLoggerCategory.Frontend, LogLevel.Info);

// Start the app.
NineZoneSampleApp.startup();

// tslint:disable-next-line:no-floating-promises
NineZoneSampleApp.ready.then(() => {

  // Initialize the AppUi & ConfigurableUiManager
  AppUi.initialize();

  // when initialization is complete, render
  ReactDOM.render(
    <App />,
    document.getElementById("root") as HTMLElement,
  );
});
