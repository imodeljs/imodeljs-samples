/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";

import {
  ConfigurableCreateInfo,
  StatusBarWidgetControl,
  ActivityCenterField,
  MessageCenterField,
  ToolAssistanceField,
  StatusBarWidgetControlArgs,
} from "@bentley/ui-framework";

/**
 * Status Bar example widget
 */
export class AppStatusBarWidget extends StatusBarWidgetControl {
  constructor(info: ConfigurableCreateInfo, options: any) {
    super(info, options);
  }

  public getReactNode(controlArgs: StatusBarWidgetControlArgs): React.ReactNode {
    const { isInFooterMode, onOpenWidget, openWidget, toastTargetRef } = controlArgs;

    return (
      <>
        <ToolAssistanceField isInFooterMode={isInFooterMode} onOpenWidget={onOpenWidget} openWidget={openWidget} />
        <MessageCenterField isInFooterMode={isInFooterMode} onOpenWidget={onOpenWidget} openWidget={openWidget} targetRef={toastTargetRef} />
        <ActivityCenterField isInFooterMode={isInFooterMode} onOpenWidget={onOpenWidget} openWidget={openWidget} />
      </>
    );
  }
}
