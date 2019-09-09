/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
import * as path from "path";
import { RpcInterfaceDefinition, ElectronRpcManager } from "@bentley/imodeljs-common";
import { IModelJsElectronManager } from "@bentley/electron-manager";
/**
 * Initializes Electron backend
 */
export default function initialize(rpcs: RpcInterfaceDefinition[]) {
(async () => { // tslint:disable-line:no-floating-promises
  const manager = new IModelJsElectronManager(path.join(__dirname, "..", "..", "webresources"));
  await manager.initialize({
    width: 1280,
    height: 800,
    webPreferences: {
      experimentalFeatures: true, // Needed for CSS Grid support
    },
    autoHideMenuBar: true,
    show: false,
  });
  // tell ElectronRpcManager which RPC interfaces to handle
  ElectronRpcManager.initializeImpl({}, rpcs);
  if (manager.mainWindow) {
    manager.mainWindow.show();
  }
  }) ();
}
