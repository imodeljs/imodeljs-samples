/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { ClientRequestContext, Config } from "@bentley/bentleyjs-core";
import { BrowserAuthorizationCallbackHandler, BrowserAuthorizationClient, BrowserAuthorizationClientConfiguration } from "@bentley/frontend-authorization-client";
import { BentleyCloudRpcManager, BentleyCloudRpcParams } from "@bentley/imodeljs-common";
import { FrontendRequestContext, IModelApp } from "@bentley/imodeljs-frontend";
import { UrlDiscoveryClient } from "@bentley/itwin-client";
import { UiComponents } from "@bentley/ui-components";
import { getSupportedRpcs } from "../../common/rpcs";

/**
 * List of possible backends that basic-viewport-app can use
 */
export enum UseBackend {
  /** Use local basic-viewport-app backend */
  Local = 0,

  /** Use deployed general-purpose backend */
  GeneralPurpose = 1,
}

// Boiler plate code
export class BasicViewportApp {

  public static get oidcClient() { return IModelApp.authorizationClient as BrowserAuthorizationClient; }

  public static async startup() {
    await IModelApp.startup({ applicationVersion: "1.0.0" });

    // initialize OIDC
    await BasicViewportApp.initializeOidc();

    // contains various initialization promises which need
    // to be fulfilled before the app is ready
    const initPromises = new Array<Promise<any>>();

    // initialize RPC communication
    initPromises.push(BasicViewportApp.initializeRpc());

    // initialize UiComponents
    initPromises.push(UiComponents.initialize(IModelApp.i18n));

    // the app is ready when all initialization promises are fulfilled
    await Promise.all(initPromises);
  }

  private static async initializeRpc(): Promise<void> {
    let rpcParams = await this.getConnectionInfo();
    const rpcInterfaces = getSupportedRpcs();
    // Initialize the local backend if UseBackend.GeneralPurpose is not set.
    if (!rpcParams)
      rpcParams = { info: { title: "basic-viewport-app", version: "v1.0" }, uriPrefix: "http://localhost:3001" };
    BentleyCloudRpcManager.initializeClient(rpcParams, rpcInterfaces);
  }

  private static async initializeOidc() {
    const clientId = Config.App.getString("imjs_browser_test_client_id");
    const redirectUri = Config.App.getString("imjs_browser_test_redirect_uri");
    const scope = Config.App.getString("imjs_browser_test_scope");
    const responseType = "code";
    const oidcConfig: BrowserAuthorizationClientConfiguration = { clientId, redirectUri, scope, responseType };

    await BrowserAuthorizationCallbackHandler.handleSigninCallback(oidcConfig.redirectUri);
    IModelApp.authorizationClient = new BrowserAuthorizationClient(oidcConfig);

    try {
      await BasicViewportApp.oidcClient.signInSilent(new ClientRequestContext());
    } catch (err) { }
  }

  private static async getConnectionInfo(): Promise<BentleyCloudRpcParams | undefined> {
    const usedBackend = Config.App.getNumber("imjs_backend", UseBackend.Local);

    if (usedBackend === UseBackend.GeneralPurpose) {
      const urlClient = new UrlDiscoveryClient();
      const requestContext = new FrontendRequestContext();
      const orchestratorUrl = await urlClient.discoverUrl(requestContext, "iModelJsOrchestrator.K8S", undefined);
      return { info: { title: "general-purpose-imodeljs-backend", version: "v2.0" }, uriPrefix: orchestratorUrl };
    }

    if (usedBackend === UseBackend.Local)
      return undefined;

    throw new Error(`Invalid backend "${usedBackend}" specified in configuration`);
  }
}
