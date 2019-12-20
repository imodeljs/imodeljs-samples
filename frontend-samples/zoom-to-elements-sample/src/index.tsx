/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import * as ReactDOM from "react-dom";
import { StartupComponent, SampleBaseApp } from "@bentley/frontend-sample-base";
import { SampleContainer, Sample } from "./Sample";
import { IModelConnection, IModelAppOptions } from "@bentley/imodeljs-frontend";
import { Id64String } from "@bentley/bentleyjs-core";
import "./index.css";

// initialize the application
const opts: IModelAppOptions = Sample.getIModelAppOptions();
SampleBaseApp.startup(opts);

// tslint:disable-next-line:no-floating-promises
SampleBaseApp.ready.then(() =>  {

  // when initialization is complete, render
  ReactDOM.render(
    <App />,
    document.getElementById("root") as HTMLElement,
  );
});

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
    this.setState ({imodel, viewDefinitionId});
  }

  public render() {
    let ui: React.ReactNode;

    if (! this.state.imodel || ! this.state.viewDefinitionId)
      ui = <StartupComponent onIModelReady={this._onIModelReady}/>;
    else
      ui = <SampleContainer imodel={this.state.imodel} viewDefinitionId={this.state.viewDefinitionId}/>;

    return (
      <div>
        {ui}
      </div>
        );
    }
  }
