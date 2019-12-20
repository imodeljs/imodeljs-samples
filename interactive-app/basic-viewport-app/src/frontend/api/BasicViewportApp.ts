/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
import { OidcFrontendClientConfiguration, IOidcFrontendClient } from "@bentley/imodeljs-clients";
import { IModelApp, OidcBrowserClient, FrontendRequestContext } from "@bentley/imodeljs-frontend";
import { BentleyCloudRpcManager, BentleyCloudRpcParams } from "@bentley/imodeljs-common";
import { UiCore } from "@bentley/ui-core";
import { UiComponents } from "@bentley/ui-components";
import getSupportedRpcs from "../../common/rpcs";

// Boiler plate code
export class BasicViewportApp {

  private static _isReady: Promise<void>;
  private static _oidcClient: IOidcFrontendClient;

  public static get oidcClient() { return this._oidcClient; }

  public static get ready(): Promise<void> { return this._isReady; }

  public static startup() {
    IModelApp.startup();

    // contains various initialization promises which need
    // to be fulfilled before the app is ready
    const initPromises = new Array<Promise<any>>();

    // initialize UiCore
    initPromises.push(UiCore.initialize(IModelApp.i18n));

    // initialize UiComponents
    initPromises.push(UiComponents.initialize(IModelApp.i18n));

    // initialize RPC communication
    initPromises.push(BasicViewportApp.initializeRpc());

    // initialize OIDC
    initPromises.push(BasicViewportApp.initializeOidc());

    // the app is ready when all initialization promises are fulfilled
    this._isReady = Promise.all(initPromises).then(() => { });
  }

  private static async initializeRpc(): Promise<void> {
    const rpcInterfaces = getSupportedRpcs();
    // initialize RPC for web apps
    const rpcParams: BentleyCloudRpcParams = { info: { title: "basic-viewport-app", version: "v1.0" }, uriPrefix: "http://localhost:3001" };
    BentleyCloudRpcManager.initializeClient(rpcParams, rpcInterfaces);
  }

  private static async initializeOidc() {
    const clientId = "imodeljs-spa-samples-2686";
    const redirectUri = "http://localhost:3000/signin-callback";
    const scope = "openid email profile organization imodelhub context-registry-service:read-only product-settings-service";
    const responseType = "code";
    const oidcConfig: OidcFrontendClientConfiguration = { clientId, redirectUri, scope, responseType };

    this._oidcClient = new OidcBrowserClient(oidcConfig);

    const requestContext = new FrontendRequestContext();
    await this._oidcClient.initialize(requestContext);

    IModelApp.authorizationClient = this._oidcClient;
  }

  public static shutdown() {
    this._oidcClient.dispose();
    IModelApp.shutdown();
  }
}
