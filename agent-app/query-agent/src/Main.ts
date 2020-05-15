/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { QueryAgentConfig } from "./QueryAgentConfig";
import { Logger, LogLevel } from "@bentley/bentleyjs-core";
import { QueryAgent } from "./QueryAgent";

QueryAgentConfig.setupConfig();

Logger.initializeToConsole();
Logger.setLevelDefault(LogLevel.Error);
Logger.setLevel(QueryAgentConfig.loggingCategory, LogLevel.Trace);

(async () => {
  try {
    const agent = new QueryAgent();
    await agent.initialize();
    await agent.run(QueryAgentConfig.listenTime);
    Logger.logTrace(QueryAgentConfig.loggingCategory, "Query Agent Web Server finished executing successfully.");
  } catch (error) {
    Logger.logError(QueryAgentConfig.loggingCategory, error);
    Logger.logTrace(QueryAgentConfig.loggingCategory, "Query Agent Web Server finished executing unsuccessfully.");
    process.exitCode = 1;
  }
})(); // tslint:disable-line:no-floating-promises
