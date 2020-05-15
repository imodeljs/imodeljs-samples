/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { useCallback } from "react"; // tslint:disable-line: no-duplicate-imports
import { IModelApp, IModelConnection } from "@bentley/imodeljs-frontend";
import { Orientation, useOptionalDisposable } from "@bentley/ui-core";
import { PropertyGrid } from "@bentley/ui-components";
import {
  IPresentationPropertyDataProvider,
  PresentationPropertyDataProvider,
  propertyGridWithUnifiedSelection,
} from "@bentley/presentation-components";

// create a HOC property grid component that supports unified selection
// tslint:disable-next-line:variable-name
const SimplePropertyGrid = propertyGridWithUnifiedSelection(PropertyGrid);

/** React properties for the property pane component, that accepts an iModel connection with ruleset id */
export interface IModelConnectionProps {
  /** iModel whose contents should be displayed in the property pane */
  imodel: IModelConnection;
}

/** React properties for the property pane component, that accepts a data provider */
export interface DataProviderProps {
  /** Custom property pane data provider. */
  dataProvider: IPresentationPropertyDataProvider;
}

/** React properties for the property pane component */
export type Props = IModelConnectionProps | DataProviderProps;

/** Property grid component for the viewer app */
export default function SimplePropertiesComponent(props: Props) {
  const imodel = (props as IModelConnectionProps).imodel;
  const imodelDataProvider = useOptionalDisposable(useCallback(() => {
    if (imodel)
      return new PresentationPropertyDataProvider({ imodel });
    return undefined;
  }, [imodel]));
  const dataProvider: IPresentationPropertyDataProvider = imodelDataProvider ?? (props as any).dataProvider;
  return (
    <>
      <h3 data-testid="property-pane-component-header">{IModelApp.i18n.translate("SimpleViewer:components.properties")}</h3>
      <div style={{ flex: "1", height: "calc(100% - 50px)" }}>
        <SimplePropertyGrid
          orientation={Orientation.Horizontal}
          dataProvider={dataProvider}
        />
      </div>
    </>
  );
}
