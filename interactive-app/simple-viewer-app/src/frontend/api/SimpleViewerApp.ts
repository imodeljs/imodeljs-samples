/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { isElectronRenderer } from "@bentley/bentleyjs-core";
import { BentleyCloudRpcParams, OidcDesktopClientConfiguration } from "@bentley/imodeljs-common";
import { Config, UrlDiscoveryClient, OidcFrontendClientConfiguration, IOidcFrontendClient } from "@bentley/imodeljs-clients";
import { IModelApp, OidcBrowserClient, FrontendRequestContext, OidcDesktopClientRenderer } from "@bentley/imodeljs-frontend";
import { Presentation } from "@bentley/presentation-frontend";
import { UiCore } from "@bentley/ui-core";
import { UiComponents } from "@bentley/ui-components";
import { UseBackend } from "../../common/configuration";
import initLogging from "./logging";
import initRpc from "./rpc";

// initialize logging
initLogging();

export class SimpleViewerApp {

  private static _isReady: Promise<void>;
  private static _oidcClient: IOidcFrontendClient;

  public static get oidcClient() { return this._oidcClient; }

  public static get ready(): Promise<void> { return this._isReady; }

  public static startup() {
    IModelApp.startup();

    // contains various initialization promises which need
    // to be fulfilled before the app is ready
    const initPromises = new Array<Promise<any>>();

    // initialize localization for the app
    initPromises.push(IModelApp.i18n.registerNamespace("SimpleViewer").readFinished);

    // initialize UiCore
    initPromises.push(UiCore.initialize(IModelApp.i18n));

    // initialize UiComponents
    initPromises.push(UiComponents.initialize(IModelApp.i18n));

    // initialize Presentation
    Presentation.initialize({
      activeLocale: IModelApp.i18n.languageList()[0],
    });

    // initialize RPC communication
    initPromises.push(SimpleViewerApp.initializeRpc());

    // initialize OIDC
    initPromises.push(SimpleViewerApp.initializeOidc());

    // the app is ready when all initialization promises are fulfilled
    this._isReady = Promise.all(initPromises).then(() => { });
  }

  private static async initializeRpc(): Promise<void> {
    const rpcParams = await this.getConnectionInfo();
    initRpc(rpcParams);
  }

  private static async initializeOidc() {
    this._oidcClient = this.getOidcClient();
    const requestContext = new FrontendRequestContext();
    await this._oidcClient.initialize(requestContext);

    IModelApp.authorizationClient = this._oidcClient;
  }

  private static getOidcClient(): IOidcFrontendClient {
    const scope = "openid email profile organization imodelhub context-registry-service:read-only product-settings-service urlps-third-party";
    if (isElectronRenderer) {
      const clientId = Config.App.getString("imjs_electron_test_client_id");
      const redirectUri = Config.App.getString("imjs_electron_test_redirect_uri");
      const oidcConfiguration: OidcDesktopClientConfiguration = { clientId, redirectUri, scope: scope + " offline_access" };
      const oidcClient = new OidcDesktopClientRenderer(oidcConfiguration);
      return oidcClient;
    } else {
      const clientId = Config.App.getString("imjs_browser_test_client_id");
      const redirectUri = Config.App.getString("imjs_browser_test_redirect_uri");
      const postSignoutRedirectUri = Config.App.get("imjs_browser_test_post_signout_redirect_uri");
      const oidcConfiguration: OidcFrontendClientConfiguration = { clientId, redirectUri, postSignoutRedirectUri, scope: scope + " imodeljs-router", responseType: "code" };
      const oidcClient = new OidcBrowserClient(oidcConfiguration);
      return oidcClient;
    }
  }

  public static shutdown() {
    this._oidcClient.dispose();
    IModelApp.shutdown();
  }

  private static async getConnectionInfo(): Promise<BentleyCloudRpcParams | undefined> {
    const usedBackend = Config.App.getNumber("imjs_backend", UseBackend.Local);

    if (usedBackend === UseBackend.GeneralPurpose) {
      const urlClient = new UrlDiscoveryClient();
      const requestContext = new FrontendRequestContext();
      const orchestratorUrl = await urlClient.discoverUrl(requestContext, "iModelJsOrchestrator.K8S", undefined);
      return { info: { title: "general-purpose-imodeljs-backend", version: "v1.0" }, uriPrefix: orchestratorUrl };
    }

    if (usedBackend === UseBackend.Local)
      return undefined;

    throw new Error(`Invalid backend "${usedBackend}" specified in configuration`);
  }
}
