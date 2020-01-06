/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { IModelConnection } from "@bentley/imodeljs-frontend";
import { Orientation } from "@bentley/ui-core";
import { PropertyGrid } from "@bentley/ui-components";
import { PresentationPropertyDataProvider, propertyGridWithUnifiedSelection } from "@bentley/presentation-components";
import ReactResizeDetector from "react-resize-detector";

// create a HOC property grid component that supports unified selection
// tslint:disable-next-line:variable-name
const SimplePropertyGrid = propertyGridWithUnifiedSelection(PropertyGrid);

/** React properties for the property grid component */
export interface Props {
  /** iModel whose contents should be displayed in the property grid */
  imodel: IModelConnection;
  /** ID of the presentation rule set to use for creating the content displayed in the property grid */
  rulesetId: string;
  /** Orientation of the PropertyGrid rows */
  orientation: Orientation;
}

/** Property grid component for the viewer app */
export default class SimplePropertiesComponent extends React.Component<Props> {
  public render() {
    return (
      <ReactResizeDetector handleWidth>
        {(width: number) => {
          // Switch to Vertical if width too small
          const orientation = (width > 340) ? this.props.orientation : Orientation.Vertical;

          return (
            <SimplePropertyGrid
              orientation={orientation}
              dataProvider={new PresentationPropertyDataProvider(this.props.imodel, this.props.rulesetId)}
            />
          );
        }}
      </ReactResizeDetector>
    );
  }
}
