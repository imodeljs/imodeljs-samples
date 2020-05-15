/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { useCallback } from "react"; // tslint:disable-line: no-duplicate-imports
import { IModelApp, IModelConnection } from "@bentley/imodeljs-frontend";
import { useOptionalDisposable } from "@bentley/ui-core";
import { ControlledTree, SelectionMode, usePagedTreeNodeLoader, useTreeModelSource, useVisibleTreeNodes } from "@bentley/ui-components";
import { IPresentationTreeDataProvider, PresentationTreeDataProvider, useUnifiedSelectionTreeEventHandler } from "@bentley/presentation-components";
const RULESET_TREE = require("./Tree.ruleset.json"); // tslint:disable-line: no-var-requires

/** React properties for the tree component, that accepts an iModel connection with ruleset id */
export interface IModelConnectionProps {
  /** iModel whose contents should be displayed in the tree */
  imodel: IModelConnection;
}

/** React properties for the tree component, that accepts a data provider */
export interface DataProviderProps {
  /** Custom tree data provider. */
  dataProvider: IPresentationTreeDataProvider;
}

/** React properties for the tree component */
export type Props = IModelConnectionProps | DataProviderProps;

/** Tree component for the viewer app */
export default function SimpleTreeComponent(props: Props) {
  const imodel = (props as IModelConnectionProps).imodel;
  const imodelDataProvider = useOptionalDisposable(useCallback(() => {
    if (imodel)
      return new PresentationTreeDataProvider({ imodel, ruleset: RULESET_TREE });
    return undefined;
  }, [imodel]));
  const dataProvider = imodelDataProvider ?? (props as DataProviderProps).dataProvider;
  const modelSource = useTreeModelSource(dataProvider);
  const nodeLoader = usePagedTreeNodeLoader(dataProvider, 20, modelSource);
  const eventsHandler = useUnifiedSelectionTreeEventHandler({ nodeLoader, collapsedChildrenDisposalEnabled: true });
  return (
    <>
      <h3 data-testid="tree-component-header">{IModelApp.i18n.translate("SimpleViewer:components.tree")}</h3>
      <div style={{ flex: "1" }}>
        <ControlledTree
          nodeLoader={nodeLoader}
          visibleNodes={useVisibleTreeNodes(modelSource)}
          treeEvents={eventsHandler}
          selectionMode={SelectionMode.Extended}
          iconsEnabled={true}
        />
      </div>
    </>
  );
}
