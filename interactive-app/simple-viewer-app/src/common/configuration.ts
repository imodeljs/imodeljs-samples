/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
import { Config } from "@bentley/imodeljs-clients";

/**
 * List of possible backends that simple-viewer-app can use
 */
export enum UseBackend {
  /** Use local simple-viewer-app backend */
  Local = 0,

  /** Use deployed Navigator backend */
  Navigator = 1,
}

/**
 * Setup configuration for the application
 *
 * **Note:** this part of configuration is in addition to the unique configuration stored in
 * the config file at `src/common/config.json`.
 */
export default function setupEnv() {
  Config.App.merge({
    // -----------------------------------------------------------------------------------------------------------
    // Client registration (RECOMMENDED but OPTIONAL)
    // Must set these variables before deployment, but the supplied defaults can be used for testing on localhost.
    // Create a client registration using the procedure here - https://git.io/fx8YP (Developer registration). For the purpose
    // of running this sample on localhost, ensure your registration includes http://localhost:3000/signin-callback as a
    // valid redirect URI.
    // -----------------------------------------------------------------------------------------------------------
    imjs_browser_test_client_id: "imodeljs-spa-test-2686",
    // Set this to the registered clientId
    // Note: "imodeljs-spa-test-2686" is setup to work with the (default) localhost redirect URI below

    imjs_browser_test_redirect_uri: "http://localhost:3000/signin-callback",
    // Set this to be the registered redirect URI
    // Note: "http://localhost:3000/signin-callback" is setup to work with the (default) clientId above

    imjs_browser_test_scope: "openid email profile organization imodelhub context-registry-service",
    // Set this to be the scopes of services the application needs to access
    // Note: The default value set above ensures the minimal working of the application
  });
}
