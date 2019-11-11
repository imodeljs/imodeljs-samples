/*---------------------------------------------------------------------------------------------
* $Copyright: (c) 2019 Bentley Systems, Incorporated. All rights reserved. $
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";

import {
  ConfigurableCreateInfo,
  ContentControl,
} from "@bentley/ui-framework";

import SimpleTableComponent from "../../components/Table";

/**
 * Table content
 */
export class TableContent extends ContentControl {
  constructor(info: ConfigurableCreateInfo, options: any) {
    super(info, options);

    if (options.iModelConnection) {
      this.reactElement = <SimpleTableComponent imodel={options.iModelConnection} rulesetId={options.rulesetId} />;
    }
  }
}
