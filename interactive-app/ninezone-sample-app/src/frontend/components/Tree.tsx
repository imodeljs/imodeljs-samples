/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { IModelConnection } from "@bentley/imodeljs-frontend";
import { usePresentationTreeNodeLoader, useUnifiedSelectionTreeEventHandler } from "@bentley/presentation-components";
import { ControlledTree, SelectionMode, useVisibleTreeNodes } from "@bentley/ui-components";
import * as React from "react";
const RULESET_TREE = require("./Tree.ruleset.json"); // eslint-disable-line @typescript-eslint/no-var-requires

/** React properties for the tree component */
export interface Props {
  /** iModel whose contents should be displayed in the tree */
  imodel: IModelConnection;
}

/** Tree component for the viewer app */
export default function SimpleTreeComponent(props: Props) { // eslint-disable-line @typescript-eslint/naming-convention
  const nodeLoader = usePresentationTreeNodeLoader({ imodel: props.imodel, ruleset: RULESET_TREE, pagingSize: 20 });
  return (
    <ControlledTree
      nodeLoader={nodeLoader}
      visibleNodes={useVisibleTreeNodes(nodeLoader.modelSource)}
      treeEvents={useUnifiedSelectionTreeEventHandler({ nodeLoader })}
      selectionMode={SelectionMode.Extended}
    />
  );
}
