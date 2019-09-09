/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { QueryAgent } from "./QueryAgent";
import { QueryAgentConfig } from "./QueryAgentConfig";
import * as bodyParser from "body-parser";
import * as express from "express";
import * as http from "http";

/** Container class for web server and the iModelJS backend run in the QueryAgent */
export class QueryAgentWebServer {
  private _server: http.Server;
  private _agent: QueryAgent;
  public constructor(webServer: express.Express = express(), agent: QueryAgent = new QueryAgent()) {
    this._agent = agent;
    // Enable CORS for all apis
    webServer.all("/*", (_req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Authorization, X-Requested-With");
      next();
    });

    webServer.use(bodyParser.text());

    webServer.get("/ping", (_request, response) => response.status(200).send("Success"));

    webServer.get("/", async (_request, response) => {
      response.status(200).send(`iModel-query-agent: See console for the output created by the sample`);
    });

    webServer.set("port", QueryAgentConfig.port);
    // tslint:disable-next-line:no-console
    this._server = webServer.listen(webServer.get("port"), () => console.log("iModel Query Agent listening on http://localhost:" + webServer.get("port")))
      .on("error", (e: any) => this._handlePortError(QueryAgentConfig.port, e));

  }
  private _handlePortError = (port: number, error: Error) => {
    // tslint:disable-next-line:no-console
    console.log(`Error: Unable to connect to port # ${port}. Make sure nothing else is listening on this port or try a different one... ${error}\n\n`);
    throw error;
  }
  public getServer(): http.Server {
    return this._server!;
  }
  public async run(listenTime?: number): Promise<boolean> {
    // Initialize the iModelJS backend sitting behind this web server
    try {
      await this._agent.listenForAndHandleChangesets(listenTime || QueryAgentConfig.listenTime);
    } catch (error) {
      this.close();
      return false;
    }
    return true;
  }
  public close(): void {
    try {
      this._server!.close();
    } catch (error) {
    }
  }
}
