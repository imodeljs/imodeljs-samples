/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Point3d, Range2d } from "@bentley/geometry-core";
import * as React from "react";
import { BasePointGenerator, CirclePointGenerator, CrossPointGenerator, RandomPointGenerator } from "./PointGenerators";

export enum PointMode {
  Random = "1",
  Circle = "2",
  Cross = "3",
}

/** React state of the PointSelector component */
export interface PointSelectorProps {
  onPointsChanged(points: Point3d[]): void;
  range?: Range2d;
}

/** React state of the PointSelector */
export interface PointSelectorState {
  pointGenerator: BasePointGenerator;
  pointCount: number;
}

/** A component that renders a point mode selector and a point count range input. */
export class PointSelector extends React.Component<PointSelectorProps, PointSelectorState> {

  /** Creates a PointSelector instance */
  constructor(props?: any, context?: any) {
    super(props, context);
    this.state = {
      pointGenerator: new RandomPointGenerator(),
      pointCount: 10,
    };
  }

  public getPoints(): Point3d[] {
    if (undefined === this.props.range)
      return [];

    return this.state.pointGenerator.generatePoints(this.state.pointCount, this.props.range);
  }

  private notifyChange(): void {
    if (undefined === this.props.range)
      return;

    this.props.onPointsChanged(this.getPoints());
  }

  private _onChangePointMode = (event: React.ChangeEvent<HTMLSelectElement>) => {
    let pointGenerator: BasePointGenerator;

    switch (event.target.value) {
      case PointMode.Circle: { pointGenerator = new CirclePointGenerator(); break; }
      case PointMode.Cross: { pointGenerator = new CrossPointGenerator(); break; }
      default:
      case PointMode.Random: { pointGenerator = new RandomPointGenerator(); break; }
    }

    this.setState({ pointGenerator }, () => this.notifyChange());
  }

  private _onChangePointCount = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ pointCount: Number(event.target.value) }, () => this.notifyChange());
  }

  public componentDidUpdate(prevProps: PointSelectorProps) {
    if (undefined !== this.props.range && this.props.range !== prevProps.range) {
      this.notifyChange();
    }
  }

  /** The component's render method */
  public render() {
    return (
      <>
        <span>Points</span>
        <select onChange={this._onChangePointMode}>
          <option value={PointMode.Random}> Random </option>
          <option value={PointMode.Circle}> Circle </option>
          <option value={PointMode.Cross}> Cross </option>
        </select>
        <span>Point Count</span>
        <input type="range" min="1" max="500" value={this.state.pointCount} onChange={this._onChangePointCount}></input>
      </>
    );
  }
}
