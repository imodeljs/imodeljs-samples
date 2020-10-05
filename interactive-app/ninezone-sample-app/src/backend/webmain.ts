/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { IModelJsExpressServer } from "@bentley/express-server";
import { BentleyCloudRpcManager } from "@bentley/imodeljs-common";
import { AppLoggerCategory } from "../common/LoggerCategory";
import { Logger } from "@bentley/bentleyjs-core";
import { IModelHost } from "@bentley/imodeljs-backend";
import { Presentation } from "@bentley/presentation-backend";

import { getSupportedRpcs } from "../common/rpcs";


/**
 * Initializes Web Server backend
 */
// function called when we start the backend webserver
const webMain = async () => {  // tell BentleyCloudRpcManager which RPC interfaces to handle
  try {
    // Initialize iModelHost
    await IModelHost.startup();

    // Initialize Presentation
    Presentation.initialize();
    // Get RPCs supported by this backend
    const rpcs = getSupportedRpcs();

    const rpcConfig = BentleyCloudRpcManager.initializeImpl({ info: { title: "ninezone-sample-app", version: "v1.0" } }, rpcs);

    const port = Number(process.env.PORT || 3001);
    const server = new IModelJsExpressServer(rpcConfig.protocol);
    await server.initialize(port);
    Logger.logInfo(AppLoggerCategory.Backend, `RPC backend for ninezone-sample-app listening on port ${port}`);
  } catch (error) {
    Logger.logError(AppLoggerCategory.Backend, error);
    process.exitCode = 1;
  }
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
webMain();
