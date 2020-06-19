/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { ClientRequestContext, Config, isElectronRenderer } from "@bentley/bentleyjs-core";
import { BrowserAuthorizationCallbackHandler, BrowserAuthorizationClient, BrowserAuthorizationClientConfiguration } from "@bentley/frontend-authorization-client";
import { BentleyCloudRpcParams, DesktopAuthorizationClientConfiguration } from "@bentley/imodeljs-common";
import { DesktopAuthorizationClient, FrontendRequestContext, IModelApp } from "@bentley/imodeljs-frontend";
import { UrlDiscoveryClient } from "@bentley/itwin-client";
import { Presentation } from "@bentley/presentation-frontend";
import { UiComponents } from "@bentley/ui-components";
import { initRpc } from "./rpc";

/**
 * List of possible backends that simple-viewer-app can use
 */
export enum UseBackend {
  /** Use local simple-viewer-app backend */
  Local = 0,

  /** Use deployed general-purpose backend */
  GeneralPurpose = 1,
}

export class SimpleViewerApp {

  public static get oidcClient() { return IModelApp.authorizationClient!; }

  public static async startup() {
    await IModelApp.startup({ applicationVersion: "1.0.0" });

    // initialize OIDC
    await SimpleViewerApp.initializeOidc();

    // contains various initialization promises which need
    // to be fulfilled before the app is ready
    const initPromises = new Array<Promise<any>>();

    // initialize RPC communication
    initPromises.push(SimpleViewerApp.initializeRpc());

    // initialize localization for the app
    initPromises.push(IModelApp.i18n.registerNamespace("SimpleViewer").readFinished);

    // initialize UiComponents
    initPromises.push(UiComponents.initialize(IModelApp.i18n));

    // initialize Presentation
    initPromises.push(Presentation.initialize({
      activeLocale: IModelApp.i18n.languageList()[0],
    }).then(() => {
      Presentation.selection.scopes.activeScope = "functional-element";
    }));

    // the app is ready when all initialization promises are fulfilled
    await Promise.all(initPromises);
  }

  private static async initializeRpc(): Promise<void> {
    const rpcParams = await this.getConnectionInfo();
    initRpc(rpcParams);
  }

  private static async initializeOidc(): Promise<void> {
    const scope = Config.App.getString("imjs_browser_test_scope");
    if (isElectronRenderer) {
      const clientId = Config.App.getString("imjs_electron_test_client_id");
      const redirectUri = Config.App.getString("imjs_electron_test_redirect_uri");
      const oidcConfiguration: DesktopAuthorizationClientConfiguration = { clientId, redirectUri, scope: scope + " offline_access" };
      const desktopClient = new DesktopAuthorizationClient(oidcConfiguration);
      await desktopClient.initialize(new ClientRequestContext());
      IModelApp.authorizationClient = desktopClient;
    } else {
      const clientId = Config.App.getString("imjs_browser_test_client_id");
      const redirectUri = Config.App.getString("imjs_browser_test_redirect_uri");
      const postSignoutRedirectUri = Config.App.get("imjs_browser_test_post_signout_redirect_uri");
      const oidcConfiguration: BrowserAuthorizationClientConfiguration = { clientId, redirectUri, postSignoutRedirectUri, scope: scope + " imodeljs-router", responseType: "code" };
      await BrowserAuthorizationCallbackHandler.handleSigninCallback(oidcConfiguration.redirectUri);
      IModelApp.authorizationClient = new BrowserAuthorizationClient(oidcConfiguration);
      try {
        await (SimpleViewerApp.oidcClient as BrowserAuthorizationClient).signInSilent(new ClientRequestContext());
      } catch (err) { }
    }
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
