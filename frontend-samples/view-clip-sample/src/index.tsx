/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import * as ReactDOM from "react-dom";
import "@bentley/icons-generic-webfont/dist/bentley-icons-generic-webfont.css";
import { EditManipulator, IModelApp, IModelAppOptions, IModelConnection,  ScreenViewport, ViewClipClearTool, ViewClipDecorationProvider, Viewport } from "@bentley/imodeljs-frontend";
import { App, GithubLink, SampleBaseApp, SampleContext, SampleUIProvider, ViewportAndNavigation } from "@bentley/frontend-sample-base";
import { Id64String } from "@bentley/bentleyjs-core";
import "@bentley/frontend-sample-base/src/SampleBase.scss";
import { Button, ButtonType, Toggle } from "@bentley/ui-core";
import { ClipMaskXYZRangePlanes, ClipPlane, ClipPrimitive, ClipShape, ClipVector, ConvexClipPlaneSet, Plane3dByOriginAndUnitNormal, Point3d, Range3d, Vector3d } from "@bentley/geometry-core";

/** This file contains the user interface and main logic that is specific to this sample. */

// The Props and State for this sample component
interface SampleComponentProps {
  imodel: IModelConnection;
}
interface SampleState {
  showClipBlock: boolean;
  clipPlane: string;
}

/** A React component that renders the UI specific for this sample */
export class Sample extends React.Component<SampleComponentProps, SampleState> {
  /** Creates an Sample instance */
  constructor(props?: any, context?: any) {
    super(props, context);
    this.state = {
      showClipBlock: false,
      clipPlane: "None",
    };
  }

  /* Method for clearing all clips in the viewport */
  private _clearClips(vp: ScreenViewport) {
    // Run the ViewClipClearTool and hide the decorators
    IModelApp.tools.run(ViewClipClearTool.toolId);
    ViewClipDecorationProvider.create().toggleDecoration(vp);
  }

  /* Method for adding decorators to the veiwport */
  private _addDecorators(vp: ScreenViewport) {
    // Create a clip decorator. Selecting the clip decoration to immediately show the handles is the default.
    const vcdp: ViewClipDecorationProvider = ViewClipDecorationProvider.create();
    // Default behavior is to hide the decorators on deselect. We want to keep the decorators showing in this example.
    vcdp.clearDecorationOnDeselect = false;
    vcdp.showDecoration(vp);
    // The decorators require the SelectTool being active.
    IModelApp.toolAdmin.startDefaultTool();
  }

  /* Method for adding a new clip range around the model's extents */
  private _addExtentsClipRange = (vp: ScreenViewport) => {
    // Get the displayed extents of the model.
    const range: Range3d = this.props.imodel.displayedExtents;
    // Create a block for the ClipVector.
    const block: ClipShape = ClipShape.createBlock(range, range.isAlmostZeroZ ? ClipMaskXYZRangePlanes.XAndY : ClipMaskXYZRangePlanes.All, false, false);
    // Create the ClipVector
    const clip: ClipVector = ClipVector.createEmpty();
    // Add the block to the Clipvector and set it in the ScreenViewport.
    clip.appendReference(block);
    vp.view.setViewClip(clip);
    vp.setupFromView();
    this._addDecorators(vp);
  }

  /* Turn on/off the clip range */
  private _onToggleRangeClip = async (showClipRange: boolean) => {
    this.setState({ showClipBlock: showClipRange, clipPlane: "None" });
    const vp = IModelApp.viewManager.selectedView;
    if (undefined === vp) {
      return false;
    }
    // Clear any other clips before adding the clip range
    this._clearClips(vp);
    if (showClipRange) {
      if (!vp.view.getViewClip())
        this._addExtentsClipRange(vp);
    } else {
      this._clearClips(vp);
    }
    return true;
  }

  /* Method for getting a normal vector. */
  private _getPlaneInwardNormal(orientation: EditManipulator.RotationType, viewport: Viewport): Vector3d | undefined {
    const matrix = EditManipulator.HandleUtils.getRotation(orientation, viewport);
    if (undefined === matrix)
      return undefined;
    return matrix.getColumn(2).negate();
  }

  private setViewClipFromClipPlaneSet(vp: ScreenViewport, planeSet: ConvexClipPlaneSet) {
    const prim = ClipPrimitive.createCapture(planeSet);
    const clip = ClipVector.createEmpty();
    clip.appendReference(prim);
    vp.view.setViewClip(clip);
    vp.setupFromView();
    this._addDecorators(vp);
    return true;
  }

  /* Method for setting a plane as the view clip */
  private _setClipPlane(vp: ScreenViewport, clipPlane: string) {
    let rotationType: EditManipulator.RotationType;
    switch (clipPlane) {
      case "0": rotationType = EditManipulator.RotationType.Top; break;
      case "1": rotationType = EditManipulator.RotationType.Front; break;
      case "2": rotationType = EditManipulator.RotationType.Left; break;
      case "None": {
        this._clearClips(vp);
        return true;
      } default: rotationType = EditManipulator.RotationType.Top; break;
    }

    // Get the center point of the displayed extents as a starting point for the clip plane
    const point: Point3d = this.props.imodel.displayedExtents.center;
    const normal: Vector3d | undefined = this._getPlaneInwardNormal(rotationType, vp);
    const plane: Plane3dByOriginAndUnitNormal | undefined = Plane3dByOriginAndUnitNormal.create(point, normal!);
    if (undefined === plane)
      return false;
    let planeSet: ConvexClipPlaneSet | undefined;

    if (undefined === planeSet)
      planeSet = ConvexClipPlaneSet.createEmpty();
    planeSet.addPlaneToConvexSet(ClipPlane.createPlane(plane));
    return this.setViewClipFromClipPlaneSet(vp, planeSet);
  }

  /* Handler for plane select */
  private _onPlaneSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    this.setState({ showClipBlock: false, clipPlane: event.target.value });
    const vp = IModelApp.viewManager.selectedView;
    if (undefined === vp) {
      return false;
    }
    return this._setClipPlane(vp, event.target.value);
  }

  /* Method for flipping (negating) the current clip plane. */
  private _handleFlipButton = () => {
    const vp = IModelApp.viewManager.selectedView;
    if (undefined === vp) {
      return false;
    }
    // Get the existing clip
    const existingClip = vp.view.getViewClip();
    let planeSet: ConvexClipPlaneSet | undefined;
    if (undefined !== existingClip && 1 === existingClip.clips.length) {
      const existingPrim = existingClip.clips[0];
      if (!(existingPrim instanceof ClipShape)) {
        const existingPlaneSets = existingPrim.fetchClipPlanesRef();
        if (undefined !== existingPlaneSets && 1 === existingPlaneSets.convexSets.length) {
          planeSet = existingPlaneSets.convexSets[0];
          // Negate the planeSet
          planeSet.negateAllPlanes();
          // This method calls setViewClip. Note that editing the existing clip was not sufficient. The existing clip was edited then passed back to setViewClip.
          return this.setViewClipFromClipPlaneSet(vp, planeSet);
        }
      }
    }
    return true;
  }

  /** The sample's render method */
  public render() {
    return (
      <>
        <div className="sample-ui">
          <div className="sample-instructions">
            <span>Use the options below to control the view clip.</span>
            <GithubLink linkTarget="https://github.com/imodeljs/imodeljs-samples/tree/master/frontend-samples/view-clip-sample" />
          </div>
          <hr></hr>
          <div className="sample-options-3col even-3col">
            <span>Clip Range</span>
            <Toggle isOn={this.state.showClipBlock} onChange={this._onToggleRangeClip} />
            <span />
            <span>Clip Plane</span>
            <select onChange={this._onPlaneSelectChange} value={this.state.clipPlane}>
              <option value={"None"}> None </option>
              <option value={EditManipulator.RotationType.Left}> X </option>
              <option value={EditManipulator.RotationType.Front}> Y </option>
              <option value={EditManipulator.RotationType.Top}> Z </option>
            </select>
            <Button buttonType={ButtonType.Primary} onClick={() => this._handleFlipButton()} disabled={this.state.clipPlane === "None"}>Flip</Button>
          </div>
        </div>
      </>
    );
  }

  /*
   * From here down is boiler plate common to all front-end samples.
   *********************************************************************************************/
  public static getIModelAppOptions(): IModelAppOptions {
    return {};
  }
}

/** React props for Sample component */
interface SampleProps {
  imodel: IModelConnection;
  viewDefinitionId: Id64String;
}

/** A React component that renders the UI for the sample */
export class SampleContainer extends React.PureComponent<SampleProps> {

  /** The sample's render method */
  public render() {
    return (
      <>
        <ViewportAndNavigation imodel={this.props.imodel} viewDefinitionId={this.props.viewDefinitionId} />,
        <Sample imodel={this.props.imodel} />;
      </>
    );
  }
}

(async () => {
  // initialize the application
  const uiProvider: SampleUIProvider = { getSampleUI: (context: SampleContext) => < SampleContainer imodel={context.imodel} viewDefinitionId={context.viewDefinitionId} /> };
  await SampleBaseApp.startup(uiProvider, Sample.getIModelAppOptions());

  // when initialization is complete, render
  ReactDOM.render(
    <App />,
    document.getElementById("root") as HTMLElement,
  );
})(); // tslint:disable-line:no-floating-promises
