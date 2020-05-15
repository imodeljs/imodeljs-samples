/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { ConfigurableCreateInfo, WidgetControl } from "@bentley/ui-framework";
import * as React from "react";
import SimpleTableComponent from "../../components/Table";

/** A widget control for displaying the Table React component */
export class TableWidget extends WidgetControl {
  constructor(info: ConfigurableCreateInfo, options: any) {
    super(info, options);

    if (options.iModelConnection) {
      this.reactNode = <SimpleTableComponent imodel={options.iModelConnection} />;
    }
  }
}
