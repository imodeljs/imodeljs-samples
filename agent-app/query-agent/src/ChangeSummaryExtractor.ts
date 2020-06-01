/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { assert, DbResult, Id64String, Logger } from "@bentley/bentleyjs-core";
import { BriefcaseDb, ChangeSummary, ChangeSummaryManager, ECSqlStatement } from "@bentley/imodeljs-backend";
import { ChangedValueState, ChangeOpCode } from "@bentley/imodeljs-common";
import { AuthorizedClientRequestContext } from "@bentley/itwin-client";

import { QueryAgentConfig } from "./QueryAgentConfig";

export class ChangeSummaryExtractor {
  public async extractChangeSummary(requestContext: AuthorizedClientRequestContext, iModelDb: BriefcaseDb, changeSetId: string) {
    requestContext.enter();

    try {
      // Extract summary information about the current version of the briefcase/iModel into the change cache
      const changeSummaryIds: Id64String[] = await ChangeSummaryManager.extractChangeSummaries(requestContext, iModelDb, { currentVersionOnly: true });
      Logger.logTrace(QueryAgentConfig.loggingCategory, `Extracted summary information from change set "${changeSetId}"`);

      // Attach a change cache file to the iModel to enable querying the change summary
      ChangeSummaryManager.attachChangeCache(iModelDb);

      // Find the change summary that was just created
      assert(changeSummaryIds.length === 1);
      const changeSummary: ChangeSummary = ChangeSummaryManager.queryChangeSummary(iModelDb, changeSummaryIds[0]);

      // Query the change summary to gather up all the content
      const changeContent = { id: changeSummary.id, changeSet: changeSummary.changeSet, instanceChanges: {} };

      Logger.logTrace(QueryAgentConfig.loggingCategory, `   Description: ${changeSummary.changeSet.description}`);
      Logger.logTrace(QueryAgentConfig.loggingCategory, `   Push Date: ${new Date(changeSummary.changeSet.pushDate).toLocaleString()}`);
      Logger.logTrace(QueryAgentConfig.loggingCategory, `   Author: ${changeSummary.changeSet.userCreated}`);

      const sql = "SELECT ECInstanceId FROM ecchange.change.InstanceChange WHERE Summary.Id=? ORDER BY ECInstanceId";
      changeContent.instanceChanges = await iModelDb.withPreparedStatement<Promise<any[]>>(sql, async (stmt: ECSqlStatement): Promise<any[]> => {
        stmt.bindId(1, changeSummary.id);
        const instanceChanges = new Array<any>();
        while (stmt.step() === DbResult.BE_SQLITE_ROW) {
          const row = stmt.getRow();

          const instanceChange: any = ChangeSummaryManager.queryInstanceChange(iModelDb, row.id);
          switch (instanceChange.opCode) {
            case ChangeOpCode.Insert: {
              // Get the instance after the insert
              const after = await iModelDb.query(ChangeSummaryManager.buildPropertyValueChangesECSql(iModelDb, instanceChange, ChangedValueState.AfterInsert)).next();
              instanceChange.after = after;
              break;
            }
            case ChangeOpCode.Update: {
              // Get the instance before the update
              const before = await iModelDb.query(ChangeSummaryManager.buildPropertyValueChangesECSql(iModelDb, instanceChange, ChangedValueState.BeforeUpdate)).next();
              instanceChange.before = before;
              // Get the instance after the update
              const after = await iModelDb.query(ChangeSummaryManager.buildPropertyValueChangesECSql(iModelDb, instanceChange, ChangedValueState.AfterUpdate)).next();
              instanceChange.after = after;
              break;
            }
            case ChangeOpCode.Delete: {
              // Get the instance before the delete
              const before = await iModelDb.query(ChangeSummaryManager.buildPropertyValueChangesECSql(iModelDb, instanceChange, ChangedValueState.BeforeDelete)).next();
              instanceChange.before = before;
              break;
            }
          }
          instanceChanges.push(instanceChange);
        }
        return instanceChanges;
      });

      // Detach change cache file for further extraction
      ChangeSummaryManager.detachChangeCache(iModelDb);
      return changeContent;
    } catch (error) {
      Logger.logError(QueryAgentConfig.loggingCategory, `Error while extracting changeset summary ${changeSetId}: ${error}`);
    }
    return undefined;
  }
}
