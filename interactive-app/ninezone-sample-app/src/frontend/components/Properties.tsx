/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
/* eslint-disable no-duplicate-imports */
import * as React from "react";
import { useCallback } from "react";
import ReactResizeDetector from "react-resize-detector";
import { IModelConnection } from "@bentley/imodeljs-frontend";
import { PresentationPropertyDataProvider, propertyGridWithUnifiedSelection, usePropertyDataProviderWithUnifiedSelection } from "@bentley/presentation-components";
import { FillCentered, Orientation, useDisposable } from "@bentley/ui-core";
import { PropertyGrid, VirtualizedPropertyGridWithDataProvider } from "@bentley/ui-components";

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
  const { isOverLimit } = usePropertyDataProviderWithUnifiedSelection({ dataProvider });
  let content: JSX.Element;
  if (isOverLimit) {
    content = (<FillCentered>{"Too many elements."}</FillCentered>);
  } else {
    content = (<VirtualizedPropertyGridWithDataProvider
      dataProvider={dataProvider}
      isPropertyHoverEnabled={true}
      orientation={Orientation.Horizontal}
      horizontalOrientationMinWidth={500}
    />);
  }

  return (
    <ReactResizeDetector handleWidth>
      {(width: number) => {
        // Switch to Vertical if width too small
        const orientation = (width > 340) ? props.orientation : Orientation.Vertical;

        return (
          content
        );
      }}
    </ReactResizeDetector>
  );
}
