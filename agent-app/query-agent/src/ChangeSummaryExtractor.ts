/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { QueryAgentConfig } from "./QueryAgentConfig";
import { Logger, DbResult, assert, Id64String } from "@bentley/bentleyjs-core";
import { ChangedValueState, ChangeOpCode } from "@bentley/imodeljs-common";
import { ChangeSummaryManager, ECSqlStatement, ChangeSummary, IModelDb } from "@bentley/imodeljs-backend";
import { AccessToken, AuthorizedClientRequestContext } from "@bentley/imodeljs-clients";
export class ChangeSummaryExtractor {
    public async extractChangeSummary(accessToken: AccessToken, iModelDb: IModelDb, changeSetId: string) {
        try {
            const authLogCtx = new AuthorizedClientRequestContext(accessToken);
            // Extract summary information about the current version of the briefcase/iModel into the change cache
            const changeSummaryIds: Id64String[] = await ChangeSummaryManager.extractChangeSummaries(authLogCtx, iModelDb!, { currentVersionOnly: true });
            Logger.logTrace(QueryAgentConfig.loggingCategory, `Extracted summary information from change set "${changeSetId}"`);

            // Attach a change cache file to the iModel to enable querying the change summary
            ChangeSummaryManager.attachChangeCache(iModelDb!);

            // Find the change summary that was just created
            assert(changeSummaryIds.length === 1);
            const changeSummary: ChangeSummary = ChangeSummaryManager.queryChangeSummary(iModelDb!, changeSummaryIds[0]);

            /*
            * Query the change summary to gather up all the content
            */
            const changeContent = { id: changeSummary.id, changeSet: changeSummary.changeSet, instanceChanges: {} };

            Logger.logTrace(QueryAgentConfig.loggingCategory, `   Description: ${changeSummary.changeSet.description}`);
            Logger.logTrace(QueryAgentConfig.loggingCategory, `   Push Date: ${new Date(changeSummary.changeSet.pushDate).toLocaleString()}`);
            Logger.logTrace(QueryAgentConfig.loggingCategory, `   Author: ${changeSummary.changeSet.userCreated}`);

            changeContent.instanceChanges = iModelDb!.withPreparedStatement<any[]>("SELECT ECInstanceId FROM ecchange.change.InstanceChange WHERE Summary.Id=? ORDER BY ECInstanceId", (stmt: ECSqlStatement): any[] => {
                stmt.bindId(1, changeSummary.id);
                const instanceChanges = new Array<any>();
                while (stmt.step() === DbResult.BE_SQLITE_ROW) {
                    const row = stmt.getRow();

                    const instanceChange: any = ChangeSummaryManager.queryInstanceChange(iModelDb!, row.id);
                    switch (instanceChange.opCode) {
                        case ChangeOpCode.Insert: {
                            // Get the instance after the insert
                            const rows: any[] = iModelDb!.executeQuery(ChangeSummaryManager.buildPropertyValueChangesECSql(iModelDb!, instanceChange, ChangedValueState.AfterInsert));
                            assert(rows.length === 1);
                            instanceChange.after = rows[0];
                            break;
                        }
                        case ChangeOpCode.Update: {
                            // Get the instance before the update
                            let rows: any[] = iModelDb!.executeQuery(ChangeSummaryManager.buildPropertyValueChangesECSql(iModelDb!, instanceChange, ChangedValueState.BeforeUpdate));
                            assert(rows.length === 1);
                            instanceChange.before = rows[0];
                            // Get the instance after the update
                            rows = iModelDb!.executeQuery(ChangeSummaryManager.buildPropertyValueChangesECSql(iModelDb!, instanceChange, ChangedValueState.AfterUpdate));
                            assert(rows.length === 1);
                            instanceChange.after = rows[0];
                            break;
                        }
                        case ChangeOpCode.Delete: {
                            // Get the instance before the delete
                            const rows: any[] = iModelDb!.executeQuery(ChangeSummaryManager.buildPropertyValueChangesECSql(iModelDb!, instanceChange, ChangedValueState.BeforeDelete));
                            assert(rows.length === 1);
                            instanceChange.before = rows[0];
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
