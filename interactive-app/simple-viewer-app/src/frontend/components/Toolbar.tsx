/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import { FitViewTool, IModelApp, PanViewTool, RotateViewTool, SelectionTool, ZoomViewTool } from "@bentley/imodeljs-frontend";
import * as React from "react";
import "./Components.scss";

/* eslint-disable react/jsx-key */

/** Toolbar containing simple navigation tools */
const toolbar = () => {
  return (
    <div className="toolbar">
      <button title={SelectionTool.flyover} onClick={select}><span className="icon icon-cursor"></span></button>
      <button title={FitViewTool.flyover} onClick={fitView}><span className="icon icon-fit-to-view"></span></button>
      <button title={RotateViewTool.flyover} onClick={rotate}><span className="icon icon-gyroscope"></span></button>
      <button title={PanViewTool.flyover} onClick={pan}><span className="icon icon-hand-2"></span></button>
      <button title={ZoomViewTool.flyover} onClick={zoom}><span className="icon icon-zoom"></span></button>
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

export default toolbar;
