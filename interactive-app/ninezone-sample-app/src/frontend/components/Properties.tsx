/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
/* eslint-disable no-duplicate-imports, deprecation/deprecation */
import * as React from "react";
import { useCallback } from "react";
import ReactResizeDetector from "react-resize-detector";
import { IModelConnection } from "@bentley/imodeljs-frontend";
import { PresentationPropertyDataProvider, propertyGridWithUnifiedSelection } from "@bentley/presentation-components";
import { Orientation, useDisposable } from "@bentley/ui-core";
import { PropertyGrid } from "@bentley/ui-components";

// create a HOC property grid component that supports unified selection
// eslint-disable-next-line @typescript-eslint/naming-convention
const SimplePropertyGrid = propertyGridWithUnifiedSelection(PropertyGrid);

/** React properties for the property grid component */
export interface Props {
  /** iModel whose contents should be displayed in the property grid */
  imodel: IModelConnection;
  /** Orientation of the PropertyGrid rows */
  orientation: Orientation;
}

/** Property grid component for the viewer app */
export default function SimplePropertiesComponent(props: Props) { // eslint-disable-line @typescript-eslint/naming-convention
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
