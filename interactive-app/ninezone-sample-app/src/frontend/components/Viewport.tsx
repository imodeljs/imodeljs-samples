/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { ViewportComponent, ViewportProps } from "@bentley/ui-components";
import { viewWithUnifiedSelection } from "@bentley/presentation-components";

// create a HOC viewport component that supports unified selection
// tslint:disable-next-line:variable-name
const SimpleViewport = viewWithUnifiedSelection(ViewportComponent);

/** React properties for the viewport component */
export interface SimpleViewportComponentProps extends ViewportProps {
  /** ID of the presentation rule set to use for unified selection */
  rulesetId: string;
}

/** Viewport component for the viewer app */
export default class SimpleViewportComponent extends React.Component<SimpleViewportComponentProps> {
  public render() {
    return (
      <SimpleViewport
        viewportRef={this.props.viewportRef}
        imodel={this.props.imodel}
        viewDefinitionId={this.props.viewDefinitionId}
        viewState={this.props.viewState}
        ruleset={this.props.rulesetId}
      />
    );
  }
}
