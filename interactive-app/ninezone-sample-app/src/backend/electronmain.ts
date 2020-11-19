/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as path from "path";
import { Logger, LogLevel } from "@bentley/bentleyjs-core";
import { ElectronManagerOptions, IModelJsElectronManager, WebpackDevServerElectronManager } from "@bentley/electron-manager";
import { IModelHost } from "@bentley/imodeljs-backend";
import { ElectronRpcManager } from "@bentley/imodeljs-common";
import { Presentation } from "@bentley/presentation-backend";
import { AppLoggerCategory } from "../common/LoggerCategory";
import { getSupportedRpcs } from "../common/rpcs";

// Setup logging immediately to pick up any logging during IModelHost.startup()
Logger.initializeToConsole();
Logger.setLevelDefault(LogLevel.Warning);
Logger.setLevel(AppLoggerCategory.Backend, LogLevel.Trace);

/**
 * Initializes Electron backend
 */
const electronMain = async () => {

  // Initialize iModelHost
  await IModelHost.startup();

  // Initialize Presentation
  Presentation.initialize();

  // Get RPCs supported by this backend
  const rpcs = getSupportedRpcs();

  // tell ElectronRpcManager which RPC interfaces to handle
  ElectronRpcManager.initializeImpl({}, rpcs);

  const opts: ElectronManagerOptions = {
    webResourcesPath: path.join(__dirname, "..", "..", "..", "build"),
  };
  const manager = (process.env.NODE_ENV === "development") ? new WebpackDevServerElectronManager(opts) : new IModelJsElectronManager(opts);
  await manager.initialize({
    width: 1280,
    height: 800,
    autoHideMenuBar: true,
    show: false,
  });

  if (manager.mainWindow) {
    manager.mainWindow.show();
  }

};

try {// execute this immediately when we load
  electronMain(); // eslint-disable-line @typescript-eslint/no-floating-promises
} catch (error) {
  Logger.logError(AppLoggerCategory.Backend, error);
  process.exitCode = 1;
}
