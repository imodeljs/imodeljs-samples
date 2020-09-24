/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { IModelApp, IModelConnection } from "@bentley/imodeljs-frontend";
import { FillCentered, Orientation, useOptionalDisposable } from "@bentley/ui-core";
import {
  IPresentationPropertyDataProvider,
  PresentationPropertyDataProvider,
  usePropertyDataProviderWithUnifiedSelection,
} from "@bentley/presentation-components";
import { VirtualizedPropertyGridWithDataProvider } from "@bentley/ui-components";

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
export default function SimplePropertiesComponent(props: Props) { // eslint-disable-line @typescript-eslint/naming-convention
  const imodel = (props as IModelConnectionProps).imodel;
  const imodelDataProvider = useOptionalDisposable(React.useCallback(() => {
    if (imodel)
      return new PresentationPropertyDataProvider({ imodel });
    return undefined;
  }, [imodel]));
  const dataProvider: IPresentationPropertyDataProvider = imodelDataProvider ?? (props as any).dataProvider;
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
    <>
      <h3 data-testid="property-pane-component-header">{IModelApp.i18n.translate("SimpleViewer:components.properties")}</h3>
      <div style={{ flex: "1", height: "calc(100% - 50px)" }}>
        {content}
      </div>
    </>
  );
}
