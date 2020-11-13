/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { UserInfo } from "@bentley/itwin-client";
import { BackstageComposer, UserProfileBackstageItem } from "@bentley/ui-framework";
import * as React from "react";
import { connect } from "react-redux";
import { RootState } from "../../app/NineZoneSampleApp";
import { AppBackstageItemProvider } from "./AppBackstageItemProvider";

function mapStateToProps(state: RootState) {
  const frameworkState = state.frameworkState;

  if (!frameworkState)
    return undefined;

  return { userInfo: frameworkState.sessionState.userInfo };
}

interface AppBackstageComposerProps {
  /** AccessToken from sign-in */
  userInfo: UserInfo | undefined;
}

export class AppBackstageComposerComponent extends React.PureComponent<AppBackstageComposerProps> {
  private _itemsProvider = new AppBackstageItemProvider();
  public render() {
    return (
      <BackstageComposer
        header={this.props.userInfo && <UserProfileBackstageItem userInfo={this.props.userInfo} />}
        items={[...this._itemsProvider.backstageItems]}
      />
    );
  }
}

export const AppBackstageComposer = connect(mapStateToProps)(AppBackstageComposerComponent); // eslint-disable-line @typescript-eslint/naming-convention
