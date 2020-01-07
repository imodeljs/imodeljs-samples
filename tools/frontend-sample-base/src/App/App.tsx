/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { StartupComponent } from "../Startup/Startup";
import { SampleBaseApp } from "../SampleBaseApp";
import { IModelConnection } from "@bentley/imodeljs-frontend";
import { Id64String } from "@bentley/bentleyjs-core";
import "./App.css";

/** React state for App component */
interface AppState {
  imodel?: IModelConnection;
  viewDefinitionId?: Id64String;
}

export class App extends React.Component<{}, AppState> {

  /** Creates an App instance */
  constructor(props?: any, context?: any) {
    super(props, context);
    this.state = {};
  }

  private _onIModelReady = async (imodel: IModelConnection, viewDefinitionId: Id64String) => {
    this.setState({ imodel, viewDefinitionId });
  }

  public render() {
    let ui: React.ReactNode;

    if (!this.state.imodel || !this.state.viewDefinitionId)
      ui = <StartupComponent onIModelReady={this._onIModelReady} />;
    else
      ui = SampleBaseApp.getSampleUI({ imodel: this.state.imodel, viewDefinitionId: this.state.viewDefinitionId });

    return (
      <div>
        {ui}
      </div>
    );
  }
}
