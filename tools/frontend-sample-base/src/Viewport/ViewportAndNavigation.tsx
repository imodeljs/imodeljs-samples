/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import {
  IModelApp, IModelConnection,
  ZoomViewTool, PanViewTool, RotateViewTool, SelectionTool, FitViewTool,
} from "@bentley/imodeljs-frontend";

import { Id64String } from "@bentley/bentleyjs-core";
import { ViewportComponent } from "@bentley/ui-components";
import "./Toolbar.scss";

/** React props for [[ViewportAndNavigationComponents]] component */
export interface ViewportAndNavigationProps {
  imodel: IModelConnection;
  viewDefinitionId: Id64String;
}

/** Renders viewport, toolbar, and associated elements */
export class ViewportAndNavigation extends React.PureComponent<ViewportAndNavigationProps> {
  public render() {
    return (
      <>
        <ViewportComponent
          style={{ height: "1200px" }}
          imodel={this.props.imodel}
          viewDefinitionId={this.props.viewDefinitionId} />
        {toolbar()}
      </>
    );
  }
}

/** Toolbar containing simple navigation tools */
const toolbar = () => {
  return (
    <div className="toolbar">
      <a href="#" title={SelectionTool.flyover} onClick={select}><span className="icon icon-cursor"></span></a>
      <a href="#" title={FitViewTool.flyover} onClick={fitView}><span className="icon icon-fit-to-view"></span></a>
      <a href="#" title={RotateViewTool.flyover} onClick={rotate}><span className="icon icon-gyroscope"></span></a>
      <a href="#" title={PanViewTool.flyover} onClick={pan}><span className="icon icon-hand-2"></span></a>
      <a href="#" title={ZoomViewTool.flyover} onClick={zoom}><span className="icon icon-zoom"></span></a>
    </div>
  );
};

/**
 * See the https://imodeljs.github.io/iModelJs-docs-output/learning/frontend/tools/
 * for more details and available tools.
 */

const select = () => {
  IModelApp.tools.run(SelectionTool.toolId);
};

const fitView = () => {
  IModelApp.tools.run(FitViewTool.toolId, IModelApp.viewManager.selectedView);
};

const rotate = () => {
  IModelApp.tools.run(RotateViewTool.toolId, IModelApp.viewManager.selectedView);
};

const pan = () => {
  IModelApp.tools.run(PanViewTool.toolId, IModelApp.viewManager.selectedView);
};

const zoom = () => {
  IModelApp.tools.run(ZoomViewTool.toolId, IModelApp.viewManager.selectedView);
};
