/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import * as ReactDOM from "react-dom";
import { SimpleViewerApp } from "./api/SimpleViewerApp";
import App from "./components/App";
import "./index.css";
import setupEnv from "../common/configuration";

// setup environment
setupEnv();

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
