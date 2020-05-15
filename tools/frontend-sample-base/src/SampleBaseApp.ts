/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { ClientRequestContext, Config, Id64String } from "@bentley/bentleyjs-core";
import { BrowserAuthorizationCallbackHandler, BrowserAuthorizationClient, BrowserAuthorizationClientConfiguration } from "@bentley/frontend-authorization-client";
import { BentleyCloudRpcManager, BentleyCloudRpcParams, IModelReadRpcInterface, IModelTileRpcInterface } from "@bentley/imodeljs-common";
import { FrontendRequestContext, IModelApp, IModelAppOptions, IModelConnection, TileAdmin } from "@bentley/imodeljs-frontend";
import { UrlDiscoveryClient } from "@bentley/itwin-client";
import { PresentationRpcInterface } from "@bentley/presentation-common";
import { Presentation } from "@bentley/presentation-frontend";
import { UiComponents } from "@bentley/ui-components";
import { SampleBaseNotificationManager } from "./Notifications/NotificationManager";

// Boiler plate code
export interface SampleContext {
  imodel: IModelConnection;
  viewDefinitionId: Id64String;
}

export interface SampleUIProvider {
  getSampleUI(parentState: SampleContext): React.ReactNode;
}

export class SampleBaseApp {
  private static _sampleUIProvider: SampleUIProvider;

  public static get oidcClient() { return IModelApp.authorizationClient as BrowserAuthorizationClient; }

  public static getSampleUI(context: SampleContext): React.ReactNode { return this._sampleUIProvider.getSampleUI(context); }

  public static async startup(uiProvider: SampleUIProvider, optsIn?: IModelAppOptions) {

    this._sampleUIProvider = uiProvider;

    let opts: IModelAppOptions = {};
    if (optsIn)
      opts = optsIn;

    opts.tileAdmin = TileAdmin.create({ useProjectExtents: false });

    if (!opts.notifications)
      opts.notifications = new SampleBaseNotificationManager();

    await IModelApp.startup(opts);

    // initialize OIDC
    await SampleBaseApp.initializeOidc();

    // contains various initialization promises which need
    // to be fulfilled before the app is ready
    const initPromises = new Array<Promise<any>>();

    // initialize RPC communication
    initPromises.push(SampleBaseApp.initializeRpc());

    // initialize UiComponents
    initPromises.push(UiComponents.initialize(IModelApp.i18n));

    // initialize Presentation
    initPromises.push(Presentation.initialize({
      activeLocale: IModelApp.i18n.languageList()[0],
    }));

    // the app is ready when all initialization promises are fulfilled
    await Promise.all(initPromises);
  }

  private static async initializeRpc(): Promise<void> {
    const rpcInterfaces = [IModelReadRpcInterface, IModelTileRpcInterface, PresentationRpcInterface];

    // initialize RPC for web apps
    let rpcParams: BentleyCloudRpcParams;

    const urlClient = new UrlDiscoveryClient();
    const requestContext = new FrontendRequestContext();
    const orchestratorUrl = await urlClient.discoverUrl(requestContext, "iModelJsOrchestrator.K8S", undefined);
    rpcParams = { info: { title: "general-purpose-imodeljs-backend", version: "v2.0" }, uriPrefix: orchestratorUrl };

    BentleyCloudRpcManager.initializeClient(rpcParams, rpcInterfaces);
  }

  private static async initializeOidc() {
    // Gather configuration out of the environment
    const clientId = Config.App.get("imjs_frontend_sample_client_id", "imodeljs-spa-samples-2686");
    const redirectUri = Config.App.get("imjs_frontend_sample_redirect_uri", "http://localhost:3000/signin-callback.html");
    const scope = Config.App.get("imjs_frontend_sample_scope", "openid email profile organization imodelhub context-registry-service:read-only product-settings-service general-purpose-imodeljs-backend imodeljs-router");
    const responseType = "code";
    const oidcConfig: BrowserAuthorizationClientConfiguration = { clientId, redirectUri, scope, responseType };

    await BrowserAuthorizationCallbackHandler.handleSigninCallback(oidcConfig.redirectUri);

    // Setup the IModelApp authorization client
    IModelApp.authorizationClient = new BrowserAuthorizationClient(oidcConfig);

    try {
      await SampleBaseApp.oidcClient.signInSilent(new ClientRequestContext());
    } catch (err) { }
  }
}
