/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Point2d, Point3d, XYAndZ, XAndY } from "@bentley/geometry-core";
import { Decorator, DecorateContext, Marker, MarkerSet, Cluster, IModelApp, BeButtonEvent, BeButton } from "@bentley/imodeljs-frontend";
import { PopupMenu, PopupMenuEntry } from "./PopupMenu";

/**
 * There are four classes that cooperate to produce the markers.
 *
 * SamplePinMarker  - Displays a single pin image at a given world location.  The image is offset upwards so that the
 *                    bottom tip of the pin 'points' at the location.  This class also includes the logic for interacting
 *                    with the marker.  This sample creates a SamplePinMarker for every location that is not clustered.
 *
 * SampleClusterMarker - Displays a circle representing a group of overlapping markers.  As the view is zoomed out, this
 *                       clustering avoids drawing large numbers of markers at the same location.  This sample creates a
 *                       SampleClusterMarker for every group of five or more locations that are close together on screen.
 *
 * SampleMarkerSet - Represents a logical collection of markers.  This sample creates two SampleMarkerSets.  One represents
 *                   a "auto" pattern of locations (random, circle, etc.).  The other represents the locations created by
 *                   the PlaceMarkerTool.
 *
 * MarkerPinDecorator - The object which is registered with the ViewManager and is responsible for displaying all the
 *                      markers and marker clusters.  This sample creates exactly one MarkerPinDecorator.
 */

/** Shows a pin marking the location of a point. */
class SamplePinMarker extends Marker {
  private _markerSet: SampleMarkerSet;
  private static _height = 35;

  /** Create a new SamplePinMarker */
  constructor(location: Point3d, title: string, image: HTMLImageElement, markerSet: SampleMarkerSet) {
    // Use the same height for all the markers, but preserve the aspect ratio from the image
    super(location, new Point2d(image.width * (SamplePinMarker._height / image.height), SamplePinMarker._height));
    this.setImage(image);

    // Keep a pointer back to the marker set
    this._markerSet = markerSet;

    // Add an offset so that the pin 'points' at the location, rather than floating in the middle of it
    this.imageOffset = new Point3d(0, Math.floor(this.size.y * .5));

    // The title will be shown as a tooltip when the user interacts with the marker
    this.title = title;

    // The scale factor adjusts the size of the image so it appears larger when close to the camera eye point.
    // Make size 75% at back of frustum and 200% at front of frustum (if camera is on)
    this.setScaleFactor({ low: .75, high: 2.0 });
  }

  /** Determine whether the point is within this Marker */
  public pick(pt: XAndY): boolean {
    if (undefined === this.imageOffset)
      return super.pick(pt);

    // This method is overridden because we want the marker picked based on the apparent size of the image, which is offset and scaled.
    const pickRect = this.rect.clone();
    const offsetX = (undefined === this._scaleFactor ? this.imageOffset.x : this.imageOffset.x * this._scaleFactor.x);
    const offsetY = (undefined === this._scaleFactor ? this.imageOffset.y : this.imageOffset.y * this._scaleFactor.y);
    pickRect.top -= offsetY;
    pickRect.bottom -= offsetY;
    pickRect.left -= offsetX;
    pickRect.right -= offsetX;
    return pickRect.containsPoint(pt);
  }

  /** This method will be called when the user clicks on a marker */
  public onMouseButton(ev: BeButtonEvent): boolean {
    if (BeButton.Data !== ev.button || !ev.isDown || !ev.viewport || !ev.viewport.view.isSpatialView())
      return true;

    this.showPopupMenu({ x: ev.viewPoint.x, y: ev.viewPoint.y });

    return true; // Don't allow clicks to be sent to active tool
  }

  /** When the user clicks on the marker, we will show a small popup menu */
  private showPopupMenu(cursorPoint: XAndY) {
    const menuEntries: PopupMenuEntry[] = [];

    menuEntries.push({ label: "Center View", onPicked: this._centerMarkerCallback });
    menuEntries.push({ label: "Remove Marker", onPicked: this._removeMarkerCallback });

    const offset = 8;
    PopupMenu.onPopupMenuEvent.emit({
      menuVisible: true,
      menuX: cursorPoint.x - offset,
      menuY: cursorPoint.y - offset,
      entries: menuEntries,
    });
  }

  /** This method will be called when the user clicks on the entry in the popup menu */
  private _removeMarkerCallback = (_entry: PopupMenuEntry) => {
    this._markerSet.removeMarker(this);
  }

  /** This method will be called when the user clicks on the entry in the popup menu */
  private _centerMarkerCallback = (_entry: PopupMenuEntry) => {
    const vp = IModelApp.viewManager.selectedView;

    if (undefined !== vp) {
      // This approach doesn't animate.  An imodel.js bug?
      // vp.view.setCenter(this.worldLocation);
      // vp.synchWithView({ animateFrustumChange: true });

      // This approach doesn't work well with camera turned on
      vp.zoom(this.worldLocation, 1.0, { animateFrustumChange: true });
    }
  }
}

/** Marker to show as a stand-in for a cluster of overlapping markers. */
class SampleClusterMarker extends Marker {
  private static _radius = 13;

  /** Create a new cluster marker */
  constructor(location: XYAndZ, size: XAndY, cluster: Cluster<SamplePinMarker>) {
    super(location, size);

    /* The cluster will be drawn as a circle with the pin marker image above it.  Drawing the marker image
    *  identifies that the cluster represents markers from our marker set.
    */

    // Display the count of markers in this cluster
    this.label = cluster.markers.length.toLocaleString();
    this.labelColor = "black";
    this.labelFont = "bold 14px san-serif";

    // Display the pin image offset above the circle
    if (undefined !== cluster.markers[0].image) {
      this.imageOffset = new Point3d(0, Math.floor(this.size.y * .5) + SampleClusterMarker._radius);
      this.setImage(cluster.markers[0].image);
    }

    // Concatenate the tooltips from the markers to create the tooltip for the cluster
    const maxLen = 10;
    let title = "";
    cluster.markers.forEach((marker, index: number) => {
      if (index < maxLen) {
        if (title !== "")
          title += "<br>";
        title += marker.title;
      }
    });
    if (cluster.markers.length > maxLen)
      title += "<br>...";

    const div = document.createElement("div");
    div.innerHTML = title;
    this.title = div;
  }

  /** Show the cluster as a white circle with a thick outline */
  public drawFunc(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.strokeStyle = "#372528";
    ctx.fillStyle = "white";
    ctx.lineWidth = 5;
    ctx.arc(0, 0, SampleClusterMarker._radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

/** A MarkerSet to hold pin locations. This class supplies to `getClusterMarker` method to create SampleClusterMarker. */
class SampleMarkerSet extends MarkerSet<SamplePinMarker> {
  public minimumClusterSize = 5;

  // This method is called from within the MarkerSet base class based on the proximity of the markers and the minimumClusterSize
  protected getClusterMarker(cluster: Cluster<SamplePinMarker>): Marker { return SampleClusterMarker.makeFrom(cluster.markers[0], cluster); }

  /** Create a SamplePinMarker for each input point. */
  public setPoints(points: Point3d[], image: HTMLImageElement): void {
    this.markers.clear();

    let index = 1;
    for (const point of points) {
      this.markers.add(new SamplePinMarker(point, "Marker " + index++, image, this));
    }
  }

  /** Drop one particular marker from the set. */
  public removeMarker(marker: SamplePinMarker) {
    this.markers.delete(marker);

    // When the markers change we notify the viewmanager to remove the existing decorations
    const vp = IModelApp.viewManager.selectedView;
    if (undefined !== vp)
      vp.invalidateDecorations();
  }
}

/** A MarkerPinDecorator can be registered with ViewManager.addDecorator.  Once registered, the decorate method will be called
 *  with a supplied DecorateContext.  The Decorator will call the MarkerSet to create the decorations.
 */
export class MarkerPinDecorator implements Decorator {
  private _autoMarkerSet = new SampleMarkerSet();
  private _manualMarkerSet = new SampleMarkerSet();

  /* Remove all existing markers from the "auto" markerset and create new ones for the given points. */
  public setPoints(points: Point3d[], pinImage: HTMLImageElement): void {
    this._autoMarkerSet.setPoints(points, pinImage);

    // When the markers change we notify the viewmanager to remove the existing decorations
    const vp = IModelApp.viewManager.selectedView;
    if (undefined !== vp)
      vp.invalidateDecorations();
  }

  /* Adds a single new marker to the "manual" markerset */
  public addPoint(point: Point3d, pinImage: HTMLImageElement): void {
    this._manualMarkerSet.markers.add(new SamplePinMarker(point, "Manual", pinImage, this._manualMarkerSet));

    // When the markers change we notify the viewmanager to remove the existing decorations
    const vp = IModelApp.viewManager.selectedView;
    if (undefined !== vp)
      vp.invalidateDecorations();
  }

  /* Implement this method to add Decorations into the supplied DecorateContext. */
  public decorate(context: DecorateContext): void {

    /* This method is called for every rendering frame.  We will reuse our marker sets since the locations and images
       for the markers don't typically change. */
    if (context.viewport.view.isSpatialView()) {
      this._autoMarkerSet.addDecoration(context);
      this._manualMarkerSet.addDecoration(context);
    }
  }
}
