/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
import { IModelHost } from "@bentley/imodeljs-backend";
import getSupportedRpcs from "../common/rpcs";
import { RpcInterfaceDefinition } from "@bentley/imodeljs-common";

// initialize imodeljs-backend
IModelHost.startup();

// tslint:disable-next-line:no-floating-promises
(async () => {
  // get platform-specific initialization function
  let init: (rpcs: RpcInterfaceDefinition[]) => void;
  init = (await import("./BackendServer")).default;
  // get RPCs supported by this backend
  const rpcs = getSupportedRpcs();
  // do initialize
  init(rpcs);
})();
