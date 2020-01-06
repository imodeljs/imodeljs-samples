/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import * as ReactDOM from "react-dom";
import { BasicViewportApp } from "./api/BasicViewportApp";
import App from "./components/App";
import "./index.css";

// initialize the application
BasicViewportApp.startup();

// tslint:disable-next-line:no-floating-promises
BasicViewportApp.ready.then(() => {
  // when initialization is complete, render
  ReactDOM.render(
    <App />,
    document.getElementById("root") as HTMLElement,
  );
});
