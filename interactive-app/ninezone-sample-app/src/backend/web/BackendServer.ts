/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Logger } from "@bentley/bentleyjs-core";
import { IModelJsExpressServer } from "@bentley/express-server";
import { BentleyCloudRpcManager, RpcInterfaceDefinition } from "@bentley/imodeljs-common";
import { AppLoggerCategory } from "../../common/LoggerCategory";

/**
 * Initializes Web Server backend
 */
export default async function initialize(rpcs: RpcInterfaceDefinition[]) {
  // tell BentleyCloudRpcManager which RPC interfaces to handle
  const rpcConfig = BentleyCloudRpcManager.initializeImpl({ info: { title: "ninezone-sample-app", version: "v1.0" } }, rpcs);

  const port = Number(process.env.PORT || 3001);
  const server = new IModelJsExpressServer(rpcConfig.protocol);
  await server.initialize(port);
  Logger.logInfo(AppLoggerCategory.Backend, `RPC backend for ninezone-sample-app listening on port ${port}`);
}
