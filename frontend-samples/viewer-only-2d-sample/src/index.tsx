/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Id64String } from "@bentley/bentleyjs-core";
import { App, GithubLink, SampleBaseApp, SampleContext, SampleUIProvider, ViewportAndNavigation } from "@bentley/frontend-sample-base";
import "@bentley/frontend-sample-base/src/SampleBase.scss";
import "@bentley/icons-generic-webfont/dist/bentley-icons-generic-webfont.css";
import { ModelProps } from "@bentley/imodeljs-common";
import { IModelApp, IModelAppOptions, IModelConnection } from "@bentley/imodeljs-frontend";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { ViewCreator2d } from "./ViewCreator2d";

/** This file contains the user interface and main logic that is specific to this sample. */

// The Props and State for this sample component
interface SampleComponentProps {
  imodel: IModelConnection;
}

interface SampleState {
  models?: ModelProps[];
}

/** A React component that renders the UI specific for this sample */
export class Sample extends React.Component<SampleComponentProps, SampleState> {

  private _viewCreator: ViewCreator2d;

  /** Creates a Sample instance */
  constructor(props?: any, context?: any) {
    super(props, context);
    this.state = {};
    this._viewCreator = new ViewCreator2d(this.props.imodel);
  }

  public async componentDidMount() {
    // Get all 2D models once view opens.
    const models = await this.props.imodel.models.queryProps({from: "BisCore.GeometricModel2d"});
    if (models)
      this.setState({ models });
    else
      alert("No 2D models found in iModel!");
  }

  public static getIModelAppOptions(): IModelAppOptions {
    return {};
  }

  /** Create a UI component with all 2D models listed */
  private _modelSelector = () => {

    const sheetViews: JSX.Element[] = [];
    const drawingViews: JSX.Element[] = [];

    // Sort drawing and sheet options into separate groups.
    if (this.state.models)
      this.state.models.forEach((model: ModelProps, index) => {
        if (ViewCreator2d.drawingModelClasses.includes(model.classFullName))
          drawingViews.push(<option key={index} value={index}>{model.name}</option>);
        else if (ViewCreator2d.sheetModelClasses.includes(model.classFullName))
          sheetViews.push(<option key={index} value={index}>{model.name}</option>);
      });

    // Display drawing and sheet options in separate sections.
    return (
      <div style={{marginTop: "20px"}}>
      <span>Pick model to view it: </span>
      <select onChange={this._handleSelection}>
      <option value="none" selected disabled hidden>-- none selected --</option>
      {(drawingViews.length > 0) ? <optgroup label="Drawings"/>  : null};
      {drawingViews};
      {(sheetViews.length > 0) ? <optgroup label="Sheets"/> : null};
      {sheetViews};
      </select>
      </div>
    );
  }

  /** When model selected in above list, get its view and switch to it.  */
  private _handleSelection = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const index = Number.parseInt(event.target.selectedOptions[0].value, undefined);
    const vp = IModelApp.viewManager.selectedView;

    if (vp) {
      const vpAspect = vp.vpDiv.clientHeight / vp.vpDiv.clientWidth;
      const targetView = await this._viewCreator.getViewForModel(this.state.models![index], vpAspect);

      if (targetView && vp) vp.changeView(targetView);
      else alert("Invalid View Detected!");
    }
  }

  /** The sample's render method */
  public render() {

    // create list when 2D models found in iModel.
    const modelSelector = this.state.models ? this._modelSelector() : null;

    return (
      <>
        { /* This is the ui specific for this sample.*/}
        <div className="sample-ui">
          <div>
            <span>The picker below shows a list of 2D models in this iModel.</span>
            <GithubLink linkTarget="https://github.com/imodeljs/imodeljs-samples/tree/master/frontend-samples/viewer-only-sample" />
            <hr/>
            {modelSelector}
          </div>
        </div>
      </>
    );
  }
}

/*
 * From here down is boiler plate common to all front-end samples.
 *********************************************************************************************/
/** React props for Sample container */
interface SampleProps {
  imodel: IModelConnection;
  viewDefinitionId: Id64String;
}

/** A React component that renders the UI for the sample */
export class SampleContainer extends React.Component<SampleProps> {

  /** The sample's render method */
  public render() {
    return (
      <>
        <ViewportAndNavigation imodel={this.props.imodel} viewDefinitionId={this.props.viewDefinitionId} />
        <Sample imodel={this.props.imodel} />
      </>
    );
  }
}

(async () => {
  // initialize the application
  const uiProvider: SampleUIProvider = { getSampleUI: (context: SampleContext) => {
    return < SampleContainer imodel={context.imodel} viewDefinitionId={context.viewDefinitionId} />;
  }};
  await SampleBaseApp.startup(uiProvider, Sample.getIModelAppOptions());

  // when initialization is complete, render
  ReactDOM.render(
    <App />,
    document.getElementById("root") as HTMLElement,
  );
})(); // tslint:disable-line:no-floating-promises
