/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { IModelJsElectronManager, StandardElectronManager, WebpackDevServerElectronManager } from "@bentley/electron-manager";
import { ElectronRpcManager, RpcInterfaceDefinition } from "@bentley/imodeljs-common";
import * as path from "path";
/**
 * Initializes Electron backend
 */
export default async function initialize(rpcs: RpcInterfaceDefinition[]) {
  let manager: StandardElectronManager;
  if (process.env.NODE_ENV === "development")
    manager = new WebpackDevServerElectronManager(3000); // port should match the port of the local dev server
  else
    manager = new IModelJsElectronManager(path.join(__dirname, "..", "..", "..", "build"));

  await manager.initialize({
    width: 1280,
    height: 800,
    webPreferences: {
      experimentalFeatures: true, // Needed for CSS Grid support
      nodeIntegration: true,
    },
    autoHideMenuBar: true,
    show: false,
  });
  // tell ElectronRpcManager which RPC interfaces to handle
  ElectronRpcManager.initializeImpl({}, rpcs);
  if (manager.mainWindow) {
    manager.mainWindow.show();
  }
}
