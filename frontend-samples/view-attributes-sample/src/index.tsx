/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import * as ReactDOM from "react-dom";
import "@bentley/icons-generic-webfont/dist/bentley-icons-generic-webfont.css";
import { IModelConnection, IModelAppOptions, IModelApp, Viewport, ViewState3d, Environment } from "@bentley/imodeljs-frontend";
import { ViewportAndNavigation, GithubLink, SampleBaseApp, SampleUIProvider, App, SampleContext } from "@bentley/frontend-sample-base";
import { Id64String } from "@bentley/bentleyjs-core";
import { Toggle } from "@bentley/ui-core";
import "@bentley/frontend-sample-base/src/SampleBase.scss";
import { RenderMode } from "@bentley/imodeljs-common";

// cSpell:ignore imodels

/** This file contains the user interface and main logic that is specific to this sample. */
enum ViewFlag {
  ACS, HiddenEdges, Monochrome, VisibleEdges, Shadows,
}

/** This class implements the interaction between the sample and the iModel.js API.  No user interface. */
class API {

  // Query flag values using the Viewport API.
  public static getViewFlag(vp: Viewport, flag: ViewFlag): boolean {
    switch (flag) {
      case ViewFlag.ACS: return vp.viewFlags.acsTriad;
      case ViewFlag.HiddenEdges: return vp.viewFlags.hiddenEdges;
      case ViewFlag.Monochrome: return vp.viewFlags.monochrome;
      case ViewFlag.Shadows: return vp.viewFlags.shadows;
      case ViewFlag.VisibleEdges: return vp.viewFlags.visibleEdges;
    }

    return false;
  }

  // Modify flag values using the Viewport API.
  public static setViewFlag(vp: Viewport, flag: ViewFlag, on: boolean) {
    switch (flag) {
      case ViewFlag.ACS:
        vp.viewFlags.acsTriad = on;
        break;
      case ViewFlag.HiddenEdges:
        vp.viewFlags.hiddenEdges = on;
        break;
      case ViewFlag.Monochrome:
        vp.viewFlags.monochrome = on;
        break;
      case ViewFlag.Shadows:
        vp.viewFlags.shadows = on;
        break;
      case ViewFlag.VisibleEdges:
        vp.viewFlags.visibleEdges = on;
        break;
    }

    vp.invalidateRenderPlan();
  }

  // Query camera setting using the Viewport API.
  public static isCameraOn(vp: Viewport) {
    return vp.isCameraOn;
  }

  // Modify camera setting using the Viewport API.
  public static setCameraOnOff(vp: Viewport, on: boolean) {
    if (on)
      vp.turnCameraOn();
    else
      (vp.view as ViewState3d).turnCameraOff();

    vp.synchWithView();
  }

  // Query skybox setting using the Viewport API.
  public static isSkyboxOn(vp: Viewport) {
    if (vp.view.is3d()) {
      const displayStyle = vp.view.getDisplayStyle3d();
      return displayStyle.environment.sky.display;
    }

    return false;
  }

  // Modify skybox setting using the Viewport API.
  public static setSkyboxOnOff(vp: Viewport, on: boolean) {
    if (vp.view.is3d()) {
      const style = vp.view.getDisplayStyle3d();
      style.environment = new Environment({ sky: { display: on } });
      vp.invalidateRenderPlan();
    }
  }

  // Query render model setting using the Viewport API.
  public static getRenderModel(vp: Viewport): RenderMode {
    return vp.viewFlags.renderMode;
  }

  // Modify render mode setting using the Viewport API.
  public static setRenderMode(vp: Viewport, mode: RenderMode) {
    vp.view.viewFlags.renderMode = mode;
    vp.invalidateRenderPlan();
  }

}

/*
 * From here down is the implementation of the UI for this sample.
 *********************************************************************************************/

/** React state of the Sample component */
interface SampleState {
  renderMode: RenderMode;
  acs: boolean;
  cameraOn: boolean;
  hiddenEdges: boolean;
  monochrome: boolean;
  shadows: boolean;
  skybox: boolean;
  visibleEdges: boolean;
}

/** A React component that renders the UI specific for this sample */
export class Sample extends React.Component<{}, SampleState> {

  /** Creates a Sample instance */
  constructor(props?: any, context?: any) {
    super(props, context);
    this.state = {
      renderMode: RenderMode.SmoothShade,
      acs: false,
      cameraOn: false,
      hiddenEdges: false,
      monochrome: false,
      shadows: false,
      skybox: false,
      visibleEdges: false,
    };

    IModelApp.viewManager.onViewOpen.addOnce((_vp: Viewport) => {
      this.updateState();
    });
  }

  public static getIModelAppOptions(): IModelAppOptions {
    return {};
  }

  // Update the state of the sample react component by querying the API.
  private updateState() {
    const vp = IModelApp.viewManager.selectedView;

    if (undefined === vp)
      return;

    this.setState({
      renderMode: API.getRenderModel(vp),
      acs: API.getViewFlag(vp, ViewFlag.ACS),
      cameraOn: API.isCameraOn(vp),
      hiddenEdges: API.getViewFlag(vp, ViewFlag.HiddenEdges),
      monochrome: API.getViewFlag(vp, ViewFlag.Monochrome),
      shadows: API.getViewFlag(vp, ViewFlag.Shadows),
      skybox: API.isSkyboxOn(vp),
      visibleEdges: API.getViewFlag(vp, ViewFlag.VisibleEdges),
    });
  }

  // This common function is used to create the react components for each row of the UI.
  private createJSXElementForAttribute(label: string, info: string, element: JSX.Element) {
    return (
      <>
        <span><span style={{ marginRight: "1em" }} className="icon icon-help" title={info}></span>{label}</span>
        {element}
      </>
    );
  }

  // Handle changes to the render mode.
  private _onChangeRenderMode = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const vp = IModelApp.viewManager.selectedView;

    if (undefined === vp)
      return;

    let renderMode: RenderMode;

    switch (event.target.value) {
      case "HiddenLine": { renderMode = RenderMode.HiddenLine; break; }
      default:
      case "SmoothShade": { renderMode = RenderMode.SmoothShade; break; }
      case "SolidFill": { renderMode = RenderMode.SolidFill; break; }
      case "Wireframe": { renderMode = RenderMode.Wireframe; break; }
    }

    API.setRenderMode(vp, renderMode);
    this.updateState();
  }

  // Create the react components for the render mode row.
  private createRenderModePicker(label: string, info: string) {
    const element =
      <select style={{ width: "fit-content" }} onChange={this._onChangeRenderMode}>
        <option value={"HiddenLine"}> Hidden Line </option>
        <option selected={true} value={"SmoothShade"}> Smooth Shade </option>
        <option value={"SolidFill"}> Solid Fill </option>
        <option value={"Wireframe"}> Wireframe </option>
      </select>;

    return this.createJSXElementForAttribute(label, info, element);
  }

  // Handle changes to the skybox toggle.
  private _onChangeSkyboxToggle = (checked: boolean) => {
    const vp = IModelApp.viewManager.selectedView;

    if (undefined === vp)
      return;

    API.setSkyboxOnOff(vp, checked);
  }

  // Create the react components for the skybox toggle row.
  private createSkyboxToggle(label: string, info: string) {
    const element = <Toggle isOn={this.state.skybox} onChange={(checked: boolean) => this._onChangeSkyboxToggle(checked)} />;
    return this.createJSXElementForAttribute(label, info, element);
  }

  // Handle changes to the camera toggle.
  private _onChangeCameraToggle = (checked: boolean) => {
    const vp = IModelApp.viewManager.selectedView;

    if (undefined === vp)
      return;

    API.setCameraOnOff(vp, checked);
  }

  // Create the react components for the camera toggle row.
  private createCameraToggle(label: string, info: string) {
    const element = <Toggle isOn={this.state.cameraOn} onChange={(checked: boolean) => this._onChangeCameraToggle(checked)} />;
    return this.createJSXElementForAttribute(label, info, element);
  }

  // Handle changes to a view flag toggle.
  private _onChangeViewFlagToggle = (flag: ViewFlag, checked: boolean) => {
    const vp = IModelApp.viewManager.selectedView;

    if (undefined === vp)
      return;

    API.setViewFlag(vp, flag, checked);
    this.updateState();
  }

  // Create the react components for a view flag row.
  private createViewFlagToggle(flag: ViewFlag, label: string, info: string) {
    let flagValue: boolean;

    switch (flag) {
      case ViewFlag.ACS: flagValue = this.state.acs; break;
      case ViewFlag.HiddenEdges: flagValue = this.state.hiddenEdges; break;
      case ViewFlag.Monochrome: flagValue = this.state.monochrome; break;
      case ViewFlag.Shadows: flagValue = this.state.shadows; break;
      case ViewFlag.VisibleEdges: flagValue = this.state.visibleEdges; break;
    }

    const element = <Toggle isOn={flagValue} onChange={(checked: boolean) => this._onChangeViewFlagToggle(flag, checked)} />;
    return this.createJSXElementForAttribute(label, info, element);
  }

  /** The sample's render method */
  public render() {
    return (
      <>
        { /* This is the ui specific for this sample.*/}
        <div className="sample-ui">
          <div>
            <span>Use the controls below to change the view attributes.</span>
            <GithubLink linkTarget="https://github.com/imodeljs/imodeljs-samples/tree/master/frontend-samples/view-attributes-sample" />
          </div>
          <hr></hr>
          <div className="sample-options-2col" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {this.createRenderModePicker("Render Mode", "Controls the render mode.")}
            {this.createViewFlagToggle(ViewFlag.ACS, "ACS", "Turn on to see a visualization of the active coordinate system.")}
            {this.createCameraToggle("Camera", "Turn on for perspective view.  Turn off for orthographic view.")}
            {this.createViewFlagToggle(ViewFlag.HiddenEdges, "Hidden Edges", "Turn on to see hidden edges.  Does not apply to wireframe.  For smooth shade render mode, does not apply when visible edges are off.")}
            {this.createViewFlagToggle(ViewFlag.Monochrome, "Monochrome", "Turn on to disable colors.")}
            {this.createViewFlagToggle(ViewFlag.Shadows, "Shadows", "Turn on to see shadows.")}
            {this.createSkyboxToggle("Sky box", "Turn on to see the sky box.")}
            {this.createViewFlagToggle(ViewFlag.VisibleEdges, "Visible Edges", "Turn off to disable visible edges.  Only applies to smooth shade render mode.")}
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
    // ID of the presentation ruleset used by all of the controls; the ruleset
    // can be found at `assets/presentation_rules/Default.PresentationRuleSet.xml`
    const rulesetId = "Default";
    return (
      <>
        <ViewportAndNavigation imodel={this.props.imodel} viewDefinitionId={this.props.viewDefinitionId} rulesetId={rulesetId} />
        <Sample />
      </>
    );
  }
}

// initialize the application
const uiProvider: SampleUIProvider = { getSampleUI: (context: SampleContext) => < SampleContainer imodel={context.imodel} viewDefinitionId={context.viewDefinitionId} /> };
SampleBaseApp.startup(uiProvider, Sample.getIModelAppOptions());

// tslint:disable-next-line:no-floating-promises
SampleBaseApp.ready.then(() => {

  // when initialization is complete, render
  ReactDOM.render(
    <App />,
    document.getElementById("root") as HTMLElement,
  );
});
