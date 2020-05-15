/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { useCallback } from "react"; // tslint:disable-line: no-duplicate-imports
import { IModelConnection } from "@bentley/imodeljs-frontend";
import { PresentationTableDataProvider, tableWithUnifiedSelection } from "@bentley/presentation-components";
import { useDisposable } from "@bentley/ui-core";
import { Table } from "@bentley/ui-components";

const RULESET_TABLE = require("./Table.ruleset.json"); // tslint:disable-line: no-var-requires

// create a HOC table component that supports unified selection
// tslint:disable-next-line:variable-name
const SimpleTable = tableWithUnifiedSelection(Table);

/** React properties for the table component */
export interface Props {
  /** iModel whose contents should be displayed in the table */
  imodel: IModelConnection;
}

/** Table component for the viewer app */
export default function SimpleTableComponent(props: Props) {
  const dataProvider = useDisposable(useCallback(() => new PresentationTableDataProvider({ imodel: props.imodel, ruleset: RULESET_TABLE }), [props.imodel]));
  return (
    <SimpleTable dataProvider={dataProvider} />
  );
}
