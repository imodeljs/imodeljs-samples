/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { FrameworkReducer, FrameworkState } from "@bentley/ui-framework";
import { combineReducers, createStore, Store } from "redux";

// React-redux interface stuff
export interface RootState {
  frameworkState?: FrameworkState;
}

export type AppStore = Store<RootState>;

/**
 * Centralized state management class using  Redux actions, reducers and store.
 */
export class AppState {
  private _store: AppStore;
  private _rootReducer: any;

  constructor() {
    // this is the rootReducer for the sample application.
    this._rootReducer = combineReducers<RootState>({
      frameworkState: FrameworkReducer,
    } as any);

    // create the Redux Store.
    this._store = createStore(this._rootReducer,
      (window as any).__REDUX_DEVTOOLS_EXTENSION__ && (window as any).__REDUX_DEVTOOLS_EXTENSION__());
  }

  public get store(): Store<RootState> {
    return this._store;
  }

}
