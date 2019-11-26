/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import * as ReactDOM from "react-dom";

import { Logger, LogLevel } from "@bentley/bentleyjs-core";

import { NineZoneSampleApp } from "./app/NineZoneSampleApp";
import App from "./components/App";
import setupEnv from "../common/configuration";
import { AppUi } from "./app-ui/AppUi";

import "./index.scss";

// setup environment
setupEnv();

// initialize logging
Logger.initializeToConsole();
Logger.setLevelDefault(LogLevel.Warning);

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
