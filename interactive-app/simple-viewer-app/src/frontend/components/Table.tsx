/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { useCallback } from "react"; // tslint:disable-line: no-duplicate-imports
import { IModelConnection } from "@bentley/imodeljs-frontend";
import { useOptionalDisposable } from "@bentley/ui-core";
import { Table } from "@bentley/ui-components";
import {
  IPresentationTableDataProvider,
  PresentationTableDataProvider,
  tableWithUnifiedSelection,
} from "@bentley/presentation-components";
const RULESET_TABLE = require("./Table.ruleset.json"); // tslint:disable-line: no-var-requires

// create a HOC table component that supports unified selection
// tslint:disable-next-line:variable-name
const SimpleTable = tableWithUnifiedSelection(Table);

/** React properties for the table component, that accepts an iModel connection with ruleset id */
export interface IModelConnectionProps {
  /** iModel whose contents should be displayed in the table */
  imodel: IModelConnection;
}

/** React properties for the table component, that accepts a data provider */
export interface DataProviderProps {
  /** Custom property pane data provider. */
  dataProvider: IPresentationTableDataProvider;
}

/** React properties for the table component */
export type Props = IModelConnectionProps | DataProviderProps;

/** Table component for the viewer app */
export default function SimpleTableComponent(props: Props) {
  const imodel = (props as IModelConnectionProps).imodel;
  const imodelDataProvider = useOptionalDisposable(useCallback(() => {
    if (imodel)
      return new PresentationTableDataProvider({ imodel, ruleset: RULESET_TABLE });
    return undefined;
  }, [imodel]));
  const dataProvider: IPresentationTableDataProvider = imodelDataProvider ?? ((props as any).dataProvider).dataProvider;
  return (
    <div style={{ height: "100%" }}>
      <SimpleTable dataProvider={dataProvider} />
    </div>
  );
}
