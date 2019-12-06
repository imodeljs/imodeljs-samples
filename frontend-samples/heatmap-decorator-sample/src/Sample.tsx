/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { IModelApp, Viewport, StandardViewId, IModelConnection } from "@bentley/imodeljs-frontend";
import { Toggle } from "@bentley/ui-core";
import "@bentley/icons-generic-webfont/dist/bentley-icons-generic-webfont.css";
import { Range2d } from "@bentley/geometry-core";
import HeatmapDecorator from "./HeatmapDecorator";
import { BasePointGenerator, RandomPointGenerator, CirclePointGenerator, CrossPointGenerator } from "./PointGenerators";
import { ColorDef } from "@bentley/imodeljs-common";
import { ViewportAndNavigation, GithubLink } from "@bentley/frontend-sample-base";
import { Id64String } from "@bentley/bentleyjs-core";
import "@bentley/frontend-sample-base/src/SampleBase.scss";

// cSpell:ignore imodels

/** This file contains the user interface and main logic that is specific to this sample. */

enum PointMode {
  Random = "1",
  Circle = "2",
  Cross = "3",
}

/** React state of the Sample component */
interface SampleState {
  range?: Range2d;
  height?: number;
  showDecorator: boolean;
  pointGenerator: BasePointGenerator;
  pointCount: number;
  spreadFactor: number;
}

/** A React component that renders the UI specific for this sample */
export class Sample extends React.Component<{}, SampleState> {
  private _heatmapDecorator?: HeatmapDecorator;

  /** Creates an Sample instance */
  constructor(props?: any, context?: any) {
    super(props, context);
    this.state = {
      pointGenerator: new RandomPointGenerator(),
      showDecorator: true,
      range: undefined,
      pointCount: 25,
      spreadFactor: 10,
    };

    IModelApp.viewManager.onViewOpen.addOnce((vp: Viewport) => {
      // To make the heatmap look better, we want a top view, with a white background, etc.
      vp.setStandardRotation(StandardViewId.Top);

      const range = vp.view.computeFitRange();
      const height = range.zHigh;
      const aspect = vp.viewRect.aspect;
      range.expandInPlace(1);

      vp.view.lookAtVolume(range, aspect);
      vp.synchWithView(false);

      const style = vp.displayStyle.clone();
      style.backgroundColor = ColorDef.white.clone();
      vp.displayStyle = style;

      /* Grab the range of the contents of the view.  We'll use this to size the heatmap. */
      const range2d = Range2d.createFrom(range);
      this.setState({ range: range2d, height, showDecorator: true }, () => this.setupHeatmapDecorator());
    });
  }

  private setupHeatmapDecorator() {
    const points = this.state.pointGenerator.generatePoints(this.state.pointCount, this.state.range!);
    this._heatmapDecorator = new HeatmapDecorator(points, this.state.range!, this.state.spreadFactor, this.state.height!);

    IModelApp.viewManager.addDecorator(this._heatmapDecorator);
  }

  private teardownHeatmapDecorator() {
    if (undefined === this._heatmapDecorator)
      return;

    IModelApp.viewManager.dropDecorator(this._heatmapDecorator);
    this._heatmapDecorator = undefined;
  }

  private updateHeatmapPoints() {
    if (undefined === this._heatmapDecorator)
      return;

    const points = this.state.pointGenerator.generatePoints(this.state.pointCount, this.state.range!);
    this._heatmapDecorator.setPoints(points);
  }

  private _onChangePointMode = (event: React.ChangeEvent<HTMLSelectElement>) => {
    let pointGenerator: BasePointGenerator;

    switch (event.target.value) {
      case PointMode.Circle: { pointGenerator = new CirclePointGenerator(); break; }
      case PointMode.Cross: { pointGenerator = new CrossPointGenerator(); break; }
      default:
      case PointMode.Random: { pointGenerator = new RandomPointGenerator(); break; }
    }

    this.setState({ pointGenerator }, () => this.updateHeatmapPoints());
  }

  /** Selector for mode of input points */
  private _pointModeSelector = () => {
    return (
      <select onChange={this._onChangePointMode}>
        <option value={PointMode.Random}> Random </option>
        <option value={PointMode.Circle}> Circle </option>
        <option value={PointMode.Cross}> Cross </option>
      </select>
    );
  }

  private _onChangePointCount = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ pointCount: Number(event.target.value) }, () => {
      if (undefined !== this._heatmapDecorator)
        this.updateHeatmapPoints();
    });
  }

  private _onChangeSpreadFactor = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ spreadFactor: Number(event.target.value) }, () => {
      if (undefined !== this._heatmapDecorator)
        this._heatmapDecorator.setSpreadFactor(this.state.spreadFactor);
    });
  }

  private _onChangeShowHeatmap = (checked: boolean) => {
    if (checked) {
      this.setState({ showDecorator: true }, () => this.setupHeatmapDecorator());
    } else {
      this.setState({ showDecorator: false }, () => this.teardownHeatmapDecorator());
    }
  }

  /** The sample's render method */
  public render() {
    return (
      <>
        { /* This is the ui specific for this sample.*/}
        <div className="sample-ui">
          <div className="sample-instructions">
            <span>Use the options below to control the heatmap visualization.</span>
            <GithubLink linkTarget="https://github.com/imodeljs/imodeljs-samples/tree/master/frontend-samples/heatmap-decorator-sample" />
          </div>
          <hr></hr>
          <div className="sample-options-2col">
            <span>Show Heatmap</span>
            <Toggle isOn={this.state.showDecorator} onChange={this._onChangeShowHeatmap} />
            <span>Mode</span>
            {this._pointModeSelector()}
            <span>Point Count</span>
            <input type="range" min="1" max="500" value={this.state.pointCount} onChange={this._onChangePointCount}></input>
            <span>Spread Factor</span>
            <input type="range" min="1" max="100" value={this.state.spreadFactor} onChange={this._onChangeSpreadFactor}></input>
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
export class SampleContainer extends React.Component<SampleProps> {

  /** The sample's render method */
  public render() {
    // ID of the presentation ruleset used by all of the controls; the ruleset
    // can be found at `assets/presentation_rules/Default.PresentationRuleSet.xml`
    const rulesetId = "Default";
    return (
      <>
        <ViewportAndNavigation imodel={this.props.imodel} viewDefinitionId={this.props.viewDefinitionId} rulesetId={rulesetId} />,
      <Sample />;
      </>
    );
  }
}
