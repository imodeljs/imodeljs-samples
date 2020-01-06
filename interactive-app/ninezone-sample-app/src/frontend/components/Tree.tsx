/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { IModelConnection } from "@bentley/imodeljs-frontend";
import { Tree } from "@bentley/ui-components";
import { PresentationTreeDataProvider, treeWithUnifiedSelection } from "@bentley/presentation-components";

// create a HOC tree component that supports unified selection
// tslint:disable-next-line:variable-name
const SimpleTree = treeWithUnifiedSelection(Tree);

/** React properties for the tree component */
export interface Props {
  /** iModel whose contents should be displayed in the tree */
  imodel: IModelConnection;
  /** ID of the presentation rule set to use for creating the hierarchy in the tree */
  rulesetId: string;
}

/** Tree component for the viewer app */
export default class SimpleTreeComponent extends React.Component<Props> {
  public render() {
    return (
      <SimpleTree dataProvider={new PresentationTreeDataProvider(this.props.imodel, this.props.rulesetId)} />
    );
  }
}
