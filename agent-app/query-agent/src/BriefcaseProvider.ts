/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { AuthorizedClientRequestContext, AccessToken } from "@bentley/imodeljs-clients";
import { IModelDb, OpenParams } from "@bentley/imodeljs-backend";
import { IModelVersion } from "@bentley/imodeljs-common";
export class BriefcaseProvider {
  private _iModelDb?: IModelDb;
  public async getBriefcase(accessToken: AccessToken, projectId: string, iModelId: string, changeSetId: string): Promise<IModelDb> {
    const authLogCtx = new AuthorizedClientRequestContext(accessToken);
    if (!this._iModelDb) {
      // Open a new local briefcase of the iModel at the specified version
      this._iModelDb = await IModelDb.open(authLogCtx, projectId, iModelId, OpenParams.pullAndPush(), IModelVersion.asOfChangeSet(changeSetId));
    } else {
      // Update the existing local briefcase of the iModel to the specified version
      await this._iModelDb.pullAndMergeChanges(authLogCtx, IModelVersion.asOfChangeSet(changeSetId));
    }
    return this._iModelDb;
  }
}
