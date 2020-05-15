/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { BriefcaseDb, BriefcaseManager } from "@bentley/imodeljs-backend";
import { BriefcaseProps, IModelVersion, SyncMode } from "@bentley/imodeljs-common";
import { AccessToken, AuthorizedClientRequestContext } from "@bentley/itwin-client";

export class BriefcaseProvider {
  private _iModelDb?: BriefcaseDb;
  public async getBriefcase(accessToken: AccessToken, projectId: string, iModelId: string, changeSetId: string): Promise<BriefcaseDb> {
    const authLogCtx = new AuthorizedClientRequestContext(accessToken);
    if (!this._iModelDb) {
      // Downloads and opens a new local briefcase of the iModel at the specified version
      const briefcaseProps: BriefcaseProps = await BriefcaseManager.download(authLogCtx, projectId, iModelId, { syncMode: SyncMode.PullAndPush }, IModelVersion.asOfChangeSet(changeSetId));
      authLogCtx.enter();
      this._iModelDb = await BriefcaseDb.open(authLogCtx, briefcaseProps.key);
    } else {
      // Update the existing local briefcase of the iModel to the specified version
      await this._iModelDb.pullAndMergeChanges(authLogCtx, IModelVersion.asOfChangeSet(changeSetId));
    }
    return this._iModelDb;
  }
}
