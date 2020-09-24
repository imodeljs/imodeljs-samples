/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
/* eslint-disable @typescript-eslint/naming-convention */

import * as path from "path";
import { Config } from "@bentley/bentleyjs-core";
import { AgentAuthorizationClientConfiguration } from "@bentley/backend-itwin-client";

/**
 * Configuration for Query Agent: uses provided command if necessary first, second it will attempt to look
 * for the npm config generated environment variable, third it will use hard coded values.
 */
export class QueryAgentConfig {
  public static setupConfig() {
    Config.App.merge({

      // -----------------------------------------------------------------------------------------------------------
      // Client registration details (REQUIRED)
      // Must set these variables before testing - create a client registration using
      // the developer registration procedure here - https://git.io/fx8YP.
      // Note: These can be set in the environment also - e.g., "set ims_agent_client_id=agent_test_client"
      // -----------------------------------------------------------------------------------------------------------
      // imjs_agent_client_id: "Set this to client id",
      // imjs_agent_client_secret: "Set this to the client secret",

      // -----------------------------------------------------------------------------------------------------------
      // Test iModel (REQUIRED)
      // Must set these variables before testing - create a new project and iModel with the
      // developer registration procedure here - https://git.io/fx8YP
      // Note: This can be set in the environment also - e.g., "set imjs_agent_imodel_name=MyiModel"
      // -----------------------------------------------------------------------------------------------------------
      // imjs_agent_imodel_name: "Set this to the name of the sample iModel",

      // -----------------------------------------------------------------------------------------------------------
      // Other application settings (NOT REQUIRED)
      // Note: These can be set in the environment also - e.g., "set agent_app_port=3000"
      // -----------------------------------------------------------------------------------------------------------
      // imjs_agent_project_name: "Set this to the name of the sample project", // In most cases, this will match the test iModel name
      agent_app_port: process.env.AGENT_APP_PORT || 3000,
      agent_app_listen_time: process.env.AGENT_APP_LISTEN_TIME || 40000,
      imjs_buddi_resolve_url_using_region: process.env.IMJS_BUDDI_RESOLVE_URL_USING_REGION,
      imjs_default_relying_party_uri: "https://connect-wsg20.bentley.com",
    });
  }

  public static get iModelName(): string {
    return Config.App.getString("imjs_agent_imodel_name");
  }

  public static get projectName(): string {
    return Config.App.getString("imjs_agent_project_name", QueryAgentConfig.iModelName);
  }

  public static get oidcAgentClientConfiguration(): AgentAuthorizationClientConfiguration {
    return {
      clientId: Config.App.getString("imjs_agent_client_id"),
      clientSecret: Config.App.getString("imjs_agent_client_secret"),
      scope: "urlps-third-party context-registry-service:read-only imodelhub",
    };
  }

  public static get outputDir(): string {
    return path.join(__dirname, "output");
  }

  public static get changeSummaryDir(): string {
    return path.join(QueryAgentConfig.outputDir, "changeSummaries");
  }

  public static get port(): number {
    return Config.App.getNumber("agent_app_port");
  }

  public static get listenTime(): number {
    return Config.App.getNumber("agent_app_listen_time");
  }

  public static get loggingCategory(): string {
    return "imodel-query-agent";
  }
}
