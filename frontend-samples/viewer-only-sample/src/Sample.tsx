/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import "@bentley/icons-generic-webfont/dist/bentley-icons-generic-webfont.css";
import { IModelConnection } from "@bentley/imodeljs-frontend";
import { ViewportAndNavigation, GithubLink } from "@bentley/frontend-sample-base";
import { Id64String } from "@bentley/bentleyjs-core";
import "@bentley/frontend-sample-base/src/SampleBase.scss";

// cSpell:ignore imodels

/** This file contains the user interface that is specific for this sample. */

/** React state of the Sample component */
interface SampleState {
  _placeholder: boolean; // This is here because lint doesn't like empty interfaces
}

/** A component the renders the UI for the sample */
export class Sample extends React.Component<{}, SampleState> {

  /** Creates a Sample instance */
  constructor(props?: any, context?: any) {
    super(props, context);
    }

  /** The sample's render method */
  public render() {
    return (
      <>
      <div className="sample-ui">
        <div>
          <span>Use the toolbar at the right to navigate the model.</span>
          <GithubLink linkTarget="https://github.com/imodeljs/imodeljs-samples/tree/master/frontend-samples/viewer-only-sample"/>
        </div>
      </div>
      </>
      );
    }
  }

/*
 * From here down is boiler plate.  You don't need to touch this when creating a new sample.
 *********************************************************************************************/

/** React props for Sample component */
interface SampleProps {
  imodel: IModelConnection;
  viewDefinitionId: Id64String;
}

/** A component the renders the UI for the sample */
export class SampleContainer extends React.Component<SampleProps> {

  /** The sample's render method */
  public render() {
    return (
      <>
      <ViewportAndNavigation imodel={this.props.imodel} viewDefinitionId={this.props.viewDefinitionId} />,
      <Sample/>;
      </>
    );
  }
}
