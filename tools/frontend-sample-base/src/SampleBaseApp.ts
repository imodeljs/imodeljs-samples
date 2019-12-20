/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
import { OidcFrontendClientConfiguration, IOidcFrontendClient, UrlDiscoveryClient, Config } from "@bentley/imodeljs-clients";
import { IModelApp, OidcBrowserClient, FrontendRequestContext, IModelAppOptions } from "@bentley/imodeljs-frontend";
import { BentleyCloudRpcManager, BentleyCloudRpcParams, IModelReadRpcInterface, IModelTileRpcInterface } from "@bentley/imodeljs-common";
import { PresentationRpcInterface } from "@bentley/presentation-common";
import { UiCore } from "@bentley/ui-core";
import { UiComponents } from "@bentley/ui-components";
import { SampleBaseNotificationManager } from "./Notifications/NotificationManager";
import { Presentation } from "@bentley/presentation-frontend";

// Boiler plate code
export class SampleBaseApp {

  private static _isReady: Promise<void>;
  private static _oidcClient: IOidcFrontendClient;

  public static get oidcClient() { return this._oidcClient; }

  public static get ready(): Promise<void> { return this._isReady; }

  public static startup(optsIn?: IModelAppOptions) {
    let opts: IModelAppOptions = {};
    if (optsIn)
      opts = optsIn;

    if (!opts.notifications)
      opts.notifications = new SampleBaseNotificationManager();

    IModelApp.startup(opts);

    // contains various initialization promises which need
    // to be fulfilled before the app is ready
    const initPromises = new Array<Promise<any>>();

    // initialize UiCore
    initPromises.push(UiCore.initialize(IModelApp.i18n));

    // initialize UiComponents
    initPromises.push(UiComponents.initialize(IModelApp.i18n));

    // initialize Presentation
    Presentation.initialize({
      activeLocale: IModelApp.i18n.languageList()[0],
    });

    // initialize RPC communication
    initPromises.push(SampleBaseApp.initializeRpc());

    // initialize OIDC
    initPromises.push(SampleBaseApp.initializeOidc());

    // the app is ready when all initialization promises are fulfilled
    this._isReady = Promise.all(initPromises).then(() => { });
  }

  private static async initializeRpc(): Promise<void> {
    const rpcInterfaces = [IModelReadRpcInterface, IModelTileRpcInterface, PresentationRpcInterface];

    // initialize RPC for web apps
    let rpcParams: BentleyCloudRpcParams;

    const urlClient = new UrlDiscoveryClient();
    const requestContext = new FrontendRequestContext();
    const orchestratorUrl = await urlClient.discoverUrl(requestContext, "iModelJsOrchestrator.SF", undefined);
    rpcParams = { info: { title: "navigator-backend", version: "v1.0" }, uriPrefix: orchestratorUrl };

    BentleyCloudRpcManager.initializeClient(rpcParams, rpcInterfaces);
  }

  private static async initializeOidc() {
    const clientId = Config.App.get("imjs_frontend_sample_client_id");
    const redirectUri = Config.App.get("imjs_frontend_sample_redirect_uri");
    const scope = Config.App.get("imjs_frontend_sample_scope");
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
