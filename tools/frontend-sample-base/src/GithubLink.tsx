/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";

export interface GithubLinkProps {
  linkTarget: string;
}

export class GithubLink extends React.PureComponent<GithubLinkProps> {
  public render() {
    return (
      <>
        <a href={this.props.linkTarget} target="_blank" rel="noopener noreferrer">
          <img src="GitHub-Mark-32px.png" alt="Github Link" title="View source on Github" />
        </a>
      </>
    );
  }
}
