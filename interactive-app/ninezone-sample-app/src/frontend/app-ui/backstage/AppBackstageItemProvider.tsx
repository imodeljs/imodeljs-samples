/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { IModelApp } from "@bentley/imodeljs-frontend";
import { BackstageItemType, BackstageItem, BackstageStageLauncher, BackstageActionItem } from "@bentley/ui-framework";

// TEMP - get from ui-framework when available
export class BackstageItemsUtilities {
  public static createStageLauncher = (frontstageId: string, groupPriority: number, itemPriority: number, label: string, subtitle?: string, tooltip?: string, iconSpec?: string): BackstageStageLauncher => ({
    groupPriority,
    icon: iconSpec,
    isEnabled: true,
    isVisible: true,
    id: frontstageId,
    itemPriority,
    type: BackstageItemType.StageLauncher,
    label,
    stageId: frontstageId,
    subtitle,
    tooltip,
  })

  public static createActionItem = (itemId: string, groupPriority: number, itemPriority: number, execute: () => void, label: string, subtitle?: string, tooltip?: string, iconSpec?: string): BackstageActionItem => ({
    execute,
    groupPriority,
    icon: iconSpec,
    isEnabled: true,
    isVisible: true,
    id: itemId,
    itemPriority,
    type: BackstageItemType.ActionItem,
    label,
    subtitle,
    tooltip,
  })
}

export class AppBackstageItemProvider {
  /** id of provider */
  public readonly id = "ninezone-sample-app.AppBackstageItemProvider";

  private _backstageItems: ReadonlyArray<BackstageItem> | undefined = undefined;

  public get backstageItems(): ReadonlyArray<BackstageItem> {
    if (!this._backstageItems) {
      this._backstageItems = [
        BackstageItemsUtilities.createStageLauncher("SampleFrontstage", 100, 10,
          IModelApp.i18n.translate("NineZoneSample:backstage.sampleFrontstage"), undefined, undefined, "icon-placeholder"),
        BackstageItemsUtilities.createStageLauncher("SampleFrontstage2", 100, 20,
          IModelApp.i18n.translate("NineZoneSample:backstage.sampleFrontstage2"), undefined, undefined, "icon-placeholder"),
      ];
    }
    return this._backstageItems;
  }
}
