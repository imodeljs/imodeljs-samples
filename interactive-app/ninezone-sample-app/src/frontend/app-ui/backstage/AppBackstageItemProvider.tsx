/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import { IModelApp } from "@bentley/imodeljs-frontend";
import { BackstageItem, BackstageItemUtilities } from "@bentley/ui-abstract";

export class AppBackstageItemProvider {
  /** id of provider */
  public readonly id = "ninezone-sample-app.AppBackstageItemProvider";

  private _backstageItems: ReadonlyArray<BackstageItem> | undefined = undefined;

  public get backstageItems(): ReadonlyArray<BackstageItem> {
    if (!this._backstageItems) {
      this._backstageItems = [
        BackstageItemUtilities.createStageLauncher("SampleFrontstage", 100, 10,
          IModelApp.i18n.translate("NineZoneSample:backstage.sampleFrontstage"), undefined, "icon-placeholder"),
        BackstageItemUtilities.createStageLauncher("SampleFrontstage2", 100, 20,
          IModelApp.i18n.translate("NineZoneSample:backstage.sampleFrontstage2"), undefined, "icon-placeholder"),
      ];
    }
    return this._backstageItems;
  }
}
