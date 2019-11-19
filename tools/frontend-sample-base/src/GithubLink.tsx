/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";

export interface GithubLinkProps {
  linkTarget: string
}

export class GithubLink extends React.PureComponent<GithubLinkProps> {
  public render() {
    return (
      <>
        <a href={this.props.linkTarget} target="_blank">
            <img src="GitHub-Mark-32px.png" alt="Github Link" title="View source on Github"/>
        </a>
      </>
    );
  }
}

