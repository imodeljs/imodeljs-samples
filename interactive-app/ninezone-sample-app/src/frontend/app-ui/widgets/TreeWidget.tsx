/*---------------------------------------------------------------------------------------------
* $Copyright: (c) 2019 Bentley Systems, Incorporated. All rights reserved. $
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";

import {
  WidgetControl,
  ConfigurableCreateInfo,
} from "@bentley/ui-framework";

import SimpleTreeComponent from "../../components/Tree";

/** A widget control for displaying the Tree React component */
export class TreeWidget extends WidgetControl {
  constructor(info: ConfigurableCreateInfo, options: any) {
    super(info, options);

    if (options.iModelConnection) {
      this.reactElement = <SimpleTreeComponent imodel={options.iModelConnection} rulesetId={options.rulesetId} />;
    }
  }
}
