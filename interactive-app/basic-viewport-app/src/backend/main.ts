/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Logger, LogLevel } from "@bentley/bentleyjs-core";
import { IModelJsExpressServer } from "@bentley/express-server";
import { IModelHost } from "@bentley/imodeljs-backend";
import { BentleyCloudRpcManager } from "@bentley/imodeljs-common";

import { getSupportedRpcs } from "../common/rpcs";

// Setup logging immediately to pick up any logging during IModelHost.startup()
Logger.initializeToConsole();
Logger.setLevelDefault(LogLevel.Warning);
Logger.setLevel("basic-viewport-app", LogLevel.Info);

(async () => {
  try {
    // Initialize iModelHost
    await IModelHost.startup();

    // Get RPCs supported by this backend
    const rpcs = getSupportedRpcs();

    // Setup the RPC interfaces and the backend metadata with the BentleyCloudRpcManager
    const rpcConfig = BentleyCloudRpcManager.initializeImpl({ info: { title: "basic-viewport-app", version: "v1.0" } }, rpcs);

    // Initialize Web Server backend
    const port = Number(process.env.PORT || 3001);
    const server = new IModelJsExpressServer(rpcConfig.protocol);
    await server.initialize(port);
    Logger.logInfo("basic-viewport-app", `RPC backend for basic-viewport-app listening on port ${port}`);
  } catch (error) {
    Logger.logError("basic-viewport-app", error);
    process.exitCode = 1;
  }
})(); // tslint:disable-line:no-floating-promises
