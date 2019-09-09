/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
import { QueryAgentWebServer } from "./QueryAgentWebServer";
import { QueryAgentConfig } from "./QueryAgentConfig";
import { RequestHost } from "@bentley/imodeljs-clients-backend";
import { Logger } from "@bentley/bentleyjs-core";

class ProcessHandler {
    constructor(private _process: NodeJS.Process) {}
    public exitSuccessfully() { this._process.exit(); }
    public exitWithError() { this._process.exit(1); }
}
// Create Query Agent Web Server
export const main = async (_process: NodeJS.Process, queryAgentWebServer?: QueryAgentWebServer, listenTime?: number,
    ): Promise<void> => {
    const processHandler: ProcessHandler = new ProcessHandler(_process);
    // Initialize basic settings for all backend HTTP requests
    await RequestHost.initialize();
    if (!queryAgentWebServer)
        queryAgentWebServer = new QueryAgentWebServer();
    let success = false;
    try {
        success = await queryAgentWebServer.run(listenTime);
    } catch (error) {
        Logger.logTrace(QueryAgentConfig.loggingCategory, `Query Agent Web Server exiting with error: ${error}`);
        queryAgentWebServer.close();
        processHandler.exitWithError();
    }

    queryAgentWebServer.close();
    if (success) {
        Logger.logTrace(QueryAgentConfig.loggingCategory, "Query Agent Web Server finished executing successfully.");
        processHandler.exitSuccessfully();
    }
    Logger.logTrace(QueryAgentConfig.loggingCategory, "Query Agent Web Server finished executing unsuccessfully.");
    processHandler.exitWithError();
};
// Invoke main if Main.js is being run directly
if (require.main === module) {
    // tslint:disable-next-line:no-floating-promises
    main(process);
}
