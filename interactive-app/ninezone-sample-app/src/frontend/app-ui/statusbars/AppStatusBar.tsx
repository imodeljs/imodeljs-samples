/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { ActivityCenterField, MessageCenterField, StatusBarWidgetControl, StatusBarWidgetControlArgs, ToolAssistanceField } from "@bentley/ui-framework";
import * as React from "react";

/**
 * Status Bar example widget
 */
export class AppStatusBarWidget extends StatusBarWidgetControl {
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
