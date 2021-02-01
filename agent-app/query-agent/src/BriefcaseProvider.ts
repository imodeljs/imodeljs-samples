/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { BriefcaseDb, BriefcaseManager } from "@bentley/imodeljs-backend";
import { IModelVersion, LocalBriefcaseProps } from "@bentley/imodeljs-common";
import { AuthorizedClientRequestContext } from "@bentley/itwin-client";

export class BriefcaseProvider {
  private _iModelDb?: BriefcaseDb;
  public async getBriefcase(requestContext: AuthorizedClientRequestContext, projectId: string, iModelId: string, changeSetId: string): Promise<BriefcaseDb> {
    requestContext.enter();

    if (!this._iModelDb) {
      // Downloads and opens a new local briefcase of the iModel at the specified version
      const briefcaseProps: LocalBriefcaseProps = await BriefcaseManager.downloadBriefcase(requestContext, { contextId: projectId, iModelId, asOf: IModelVersion.asOfChangeSet(changeSetId).toJSON() });
      requestContext.enter();
      this._iModelDb = await BriefcaseDb.open(requestContext, { fileName: briefcaseProps.fileName, readonly: false });
    } else {
      // Update the existing local briefcase of the iModel to the specified version
      await this._iModelDb.pullAndMergeChanges(requestContext, IModelVersion.asOfChangeSet(changeSetId));
    }
    return this._iModelDb;
  }
}
