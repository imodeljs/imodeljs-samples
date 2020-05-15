/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import { FitViewTool, IModelApp, PanViewTool, RotateViewTool, SelectionTool, ZoomViewTool } from "@bentley/imodeljs-frontend";
import * as React from "react";
import "./Components.scss";

/* eslint-disable jsx-a11y/anchor-is-valid */

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
 * See the https://imodeljs.org/learning/frontend/tools/
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

export default toolbar;
