/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Point3d, Range2d, Range3d } from "@bentley/geometry-core";

/** For the purposes of the frontend samples, we provide three methods to generate
 * a collection of points.  Those are 'random', 'circle', and 'cross'.  This file contains
 * a PointGenerator class for each of those methods.
 */

/** Base class for point generators */
export abstract class BasePointGenerator {
  public abstract generatePoints(numPoints: number, range: Range2d): Point3d[];
}

/** Create an array of points arranged in a circle */
export class CirclePointGenerator extends BasePointGenerator {
  public generatePoints(numPoints: number, range: Range2d): Point3d[] {
    const points: Point3d[] = [];
    const radius: number = range.xLength() < range.yLength() ? range.xLength() * (2 / 5) : range.yLength() * (2 / 5);
    const range3d = Range3d.createRange2d(range);
    const midPt = range3d.center;

    for (let i = 0; i < numPoints; i++) {
      const angle = (2 * Math.PI) * (i / numPoints);
      const circlePt = new Point3d(radius * Math.cos(angle), radius * Math.sin(angle), 0.0);
      const point = circlePt.plus(midPt);
      point.z = (i + 1) / numPoints;

      points.push(point);
    }

    return points;
  }
}

/** Create an array of points arranged in an X */
export class CrossPointGenerator extends BasePointGenerator {

  private generateFractions(count: number): number[] {
    // Examples:
    // 1 === count: 1/2
    // 2 === count: 1/4, 3/4
    // 3 === count: 1/6, 3/6, 5/6
    // 4 === count: 1/8, 3/8, 5/8, 7/8
    return Array.from({ length: count }, (_el, i) => 1 / (2 * count) + i / count);
  }

  public generatePoints(numPoints: number, range: Range2d): Point3d[] {
    const points: Point3d[] = [];
    const range3d = Range3d.createRange2d(range);

    // Add half the points on the diagonal from lower left to upper right
    const count1 = Math.floor(numPoints / 2);
    const fractions1 = this.generateFractions(count1);

    for (const fraction of fractions1) {
      const point = range3d.fractionToPoint(fraction, fraction, 0);
      point.z = 1.0;
      points.push(point);
    }

    // Add the other half on the diagonal from upper left to the lower right
    const count2 = numPoints - count1;
    const fractions2 = this.generateFractions(count2);

    for (const fraction of fractions2) {
      const point = range3d.fractionToPoint(fraction, 1 - fraction, 0);
      point.z = 1.0;
      points.push(point);
    }

    return points;
  }
}

/** This is an extremely basic pseudo-random number generator.  We can't use
 * Math.random because it does not accept a seed, and we want the heatmap to
 * have consistent points within each session.  The lack of uniformity produced by
 * this simple algorithm is not important for the purposes of this sample.  There
 * are much better algorithms but this one is very concise.
 */
class BasicPRNG {
  private _startingSeed: number;
  private _seed: number;

  constructor(seed: number) {
    this._startingSeed = this._seed = seed;
  }

  public reset(): void {
    this._seed = this._startingSeed;
  }

  public random(): number {
    const x = Math.sin(this._seed++) * 10000;
    return x - Math.floor(x);
  }
}

/** Create an array of points arranged randomly within the range */
export class RandomPointGenerator extends BasePointGenerator {
  private _rng: BasicPRNG;

  constructor() {
    super();
    this._rng = new BasicPRNG(Math.random() * 10000);
  }

  public generatePoints(numPoints: number, range: Range2d): Point3d[] {
    const points: Point3d[] = [];
    const range3d = Range3d.createRange2d(range);

    for (let i = 0; i < numPoints; i++) {
      const point = range3d.fractionToPoint(this._rng.random(), this._rng.random(), 0);
      point.z = this._rng.random();
      points.push(point);
    }

    this._rng.reset();
    return points;
  }
}
