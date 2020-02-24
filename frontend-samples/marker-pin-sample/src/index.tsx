/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import * as ReactDOM from "react-dom";
import "@bentley/icons-generic-webfont/dist/bentley-icons-generic-webfont.css";
import { Range2d, Point3d } from "@bentley/geometry-core";
import { IModelConnection, IModelAppOptions, IModelApp, StandardViewId, Viewport, imageElementFromUrl } from "@bentley/imodeljs-frontend";
import { ViewportAndNavigation, GithubLink, SampleUIProvider, SampleContext, SampleBaseApp, App, PointSelector } from "@bentley/frontend-sample-base";
import { Id64String } from "@bentley/bentleyjs-core";
import { Button, ButtonType, Toggle } from "@bentley/ui-core";
import { I18NNamespace } from "@bentley/imodeljs-i18n";
import "@bentley/frontend-sample-base/src/SampleBase.scss";
import { MarkerPinDecorator } from "./MarkerPinDecorator";
import { PlaceMarkerTool } from "./PlaceMarkerTool";
import { PopupMenu } from "./PopupMenu";
import { RadioCard, RadioCardEntry } from "./RadioCard/RadioCard";

/** This file contains the user interface and main logic that is specific to this sample. */

interface ManualPinSelection {
  name: string;
  image: string;
}

/** React state of the Sample component */
interface SampleState {
  range?: Range2d;
  showDecorator: boolean;
  manualPin: ManualPinSelection;
}

/** A React component that renders the UI specific for this sample */
export class Sample extends React.Component<{}, SampleState> {
  private _height?: number;
  private _markerDecorator?: MarkerPinDecorator;
  private static _images: Map<string, HTMLImageElement>;
  public static sampleNamespace: I18NNamespace;

  /** Creates a Sample instance */
  constructor(props?: any, context?: any) {
    super(props, context);
    this.state = {
      showDecorator: true,
      range: undefined,
      manualPin: Sample.getManualPinSelections()[0],
    };

    IModelApp.viewManager.onViewOpen.addOnce((vp: Viewport) => {
      // The markers look better from a top view.
      vp.setStandardRotation(StandardViewId.Top);

      const range = vp.view.computeFitRange();
      this._height = range.zHigh;

      const aspect = vp.viewRect.aspect;
      range.expandInPlace(1);

      vp.view.lookAtVolume(range, aspect);
      vp.synchWithView(false);

      /* Grab the range of the contents of the view.  We'll use this to position the markers. */
      const range2d = Range2d.createFrom(range);
      this.setState({ range: range2d, showDecorator: true });
    });
  }

  /** This method is called as the app initializes.  This gives us a chance to supply options to
   * be passed to IModelApp.startup.
   */
  public static getIModelAppOptions(): IModelAppOptions {
    return {};
  }

  public static async initialize() {
    this.sampleNamespace = IModelApp.i18n.registerNamespace("Sample");

    PlaceMarkerTool.register(this.sampleNamespace);

    this._images = new Map();
    this._images.set("Google_Maps_pin.svg", await imageElementFromUrl(".\\Google_Maps_pin.svg"));
    this._images.set("pin_celery.svg", await imageElementFromUrl(".\\pin_celery.svg"));
    this._images.set("pin_poloblue.svg", await imageElementFromUrl(".\\pin_poloblue.svg"));
  }

  /** One time initialization of the MarkerDecorator. */
  private async setupDecorator(points: Point3d[]): Promise<void> {
    // If we failed to load the image, there is no point in registering the decorator
    if (!Sample._images.has("Google_Maps_pin.svg"))
      return;

    this._markerDecorator = new MarkerPinDecorator();

    if (undefined !== this._markerDecorator) {
      this._markerDecorator.setPoints(points, Sample._images.get("Google_Maps_pin.svg")!);
      this.showDecorations();
    }
  }

  /** Register our decorator so it is called to draw decorations */
  private showDecorations() {
    if (this._markerDecorator)
      IModelApp.viewManager.addDecorator(this._markerDecorator);
  }

  /** Un-register our decorator so it is no longer called to draw decorations */
  private teardownDecorator() {
    if (undefined === this._markerDecorator)
      return;

    IModelApp.viewManager.dropDecorator(this._markerDecorator);
  }

  /** This callback will be executed when the user interacts with the PointSelector
   * UI component.  It is also called once when the component initializes.
   */
  private _onPointsChanged = async (points: Point3d[]): Promise<void> => {

    for (const point of points)
      point.z = this._height!;

    if (undefined === this._markerDecorator) {
      return this.setupDecorator(points);
    }

    this._markerDecorator.setPoints(points, Sample._images.get("Google_Maps_pin.svg")!);
  }

  /** Called when the user changes the showMarkers toggle. */
  private _onChangeShowMarkers = (checked: boolean) => {
    if (checked) {
      this.setState({ showDecorator: true }, () => this.showDecorations());
    } else {
      this.setState({ showDecorator: false }, () => this.teardownDecorator());
    }
  }

  /** A static array of pin images. */
  private static getManualPinSelections(): ManualPinSelection[] {
    return (
      [{ image: "Google_Maps_pin.svg", name: "Google Pin" },
      { image: "pin_celery.svg", name: "Celery Pin" },
      { image: "pin_poloblue.svg", name: "Polo blue Pin" }]);
  }

  /** Creates the array which populates the RadioCard UI component */
  private getMarkerList(): RadioCardEntry[] {
    return (Sample.getManualPinSelections().map((entry: ManualPinSelection) => ({ image: entry.image, value: entry.name })));
  }

  /** Called when the user clicks a new option in the RadioCard UI component */
  private _onManualPinChange = (name: string) => {
    const manualPin = Sample.getManualPinSelections().find((entry: ManualPinSelection) => entry.name === name)!;
    this.setState({ manualPin });
  }

  /** This callback will be executed by the PlaceMarkerTool when it is time to create a new marker */
  private _manuallyAddMarker = (point: Point3d) => {
    this._markerDecorator?.addPoint(point, Sample._images.get(this.state.manualPin.image)!);
  }

  /** This callback will be executed when the user clicks the UI button.  It will start the tool which
   * handles further user input.
   */
  private _onStartPlaceMarkerTool = () => {
    IModelApp.tools.run(PlaceMarkerTool.toolId, this._manuallyAddMarker);
  }

  /** The sample's render method */
  public render() {
    return (
      <>
        <PopupMenu />
        <div className="sample-ui">
          <div className="sample-instructions">
            <span>Use the options below to control the marker pins.  Click a marker to open a menu of options.</span>
            <GithubLink linkTarget="https://github.com/imodeljs/imodeljs-samples/tree/master/frontend-samples/marker-pin-sample" />
          </div>
          <hr></hr>
          <div className="sample-options-2col">
            <span>Show Markers</span>
            <Toggle isOn={this.state.showDecorator} onChange={this._onChangeShowMarkers} />
          </div>
          <hr></hr>
          <div className="sample-heading">
            <span>Auto-generate locations</span>
          </div>
          <div className="sample-options-2col">
            <PointSelector onPointsChanged={this._onPointsChanged} range={this.state.range} />
          </div>
          <hr></hr>
          <div className="sample-heading">
            <span>Manual placement</span>
          </div>
          <div style={{ textAlign: "center" }}>
            <RadioCard entries={this.getMarkerList()} selected={this.state.manualPin.name} onChange={this._onManualPinChange} />
            <Button buttonType={ButtonType.Primary} onClick={this._onStartPlaceMarkerTool} title="Click here and then click the view to place a new marker">Place Marker</Button>
          </div>
        </div>
      </>
    );
  }
}

/*
* From here down is boiler plate common to all front-end samples.
*********************************************************************************************/

/** React props for Sample component */
interface SampleProps {
  imodel: IModelConnection;
  viewDefinitionId: Id64String;
}

/** A React component that renders the UI for the sample */
export class SampleContainer extends React.PureComponent<SampleProps> {

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
SampleBaseApp.ready.then(async () => {

  // any initialization specific to this sample
  await Sample.initialize();

  // when initialization is complete, render
  ReactDOM.render(
    <App />,
    document.getElementById("root") as HTMLElement,
  );
});
