/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { useCallback } from "react"; // tslint:disable-line: no-duplicate-imports
import ReactResizeDetector from "react-resize-detector";
import { IModelConnection } from "@bentley/imodeljs-frontend";
import { PresentationPropertyDataProvider, propertyGridWithUnifiedSelection } from "@bentley/presentation-components";
import { Orientation, useDisposable } from "@bentley/ui-core";
import { PropertyGrid } from "@bentley/ui-components";

// create a HOC property grid component that supports unified selection
// tslint:disable-next-line:variable-name
const SimplePropertyGrid = propertyGridWithUnifiedSelection(PropertyGrid);

/** React properties for the property grid component */
export interface Props {
  /** iModel whose contents should be displayed in the property grid */
  imodel: IModelConnection;
  /** Orientation of the PropertyGrid rows */
  orientation: Orientation;
}

/** Property grid component for the viewer app */
export default function SimplePropertiesComponent(props: Props) {
  const dataProvider = useDisposable(useCallback(() => new PresentationPropertyDataProvider({ imodel: props.imodel }), [props.imodel]));
  return (
    <ReactResizeDetector handleWidth>
      {(width: number) => {
        // Switch to Vertical if width too small
        const orientation = (width > 340) ? props.orientation : Orientation.Vertical;

        return (
          <SimplePropertyGrid
            orientation={orientation}
            dataProvider={dataProvider}
          />
        );
      }}
    </ReactResizeDetector>
  );
}
