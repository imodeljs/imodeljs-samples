/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";

import {
  WidgetControl,
  ConfigurableCreateInfo,
} from "@bentley/ui-framework";

import { Orientation } from "@bentley/ui-core";
import SimplePropertiesComponent from "../../components/Properties";

/** A widget control for displaying the PropertyGrid React component */
export class PropertyGridWidget extends WidgetControl {
  constructor(info: ConfigurableCreateInfo, options: any) {
    super(info, options);

    if (options.iModelConnection) {
      const orientation = Orientation.Vertical;
      this.reactElement = <SimplePropertiesComponent imodel={options.iModelConnection} rulesetId={options.rulesetId} orientation={orientation} />;
    }
  }
}
