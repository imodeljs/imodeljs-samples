/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Config, Id64, Id64String, OpenMode } from "@bentley/bentleyjs-core";
import { ContextRegistryClient, Project } from "@bentley/context-registry-client";
import { IModelQuery } from "@bentley/imodelhub-client";
import { AuthorizedFrontendRequestContext, DrawingViewState, FrontendRequestContext, IModelApp, IModelConnection, RemoteBriefcaseConnection, SpatialViewState } from "@bentley/imodeljs-frontend";
import { SignIn } from "@bentley/ui-components";
import { Button, ButtonSize, ButtonType, Spinner, SpinnerSize } from "@bentley/ui-core";
import * as React from "react";
import { SampleBaseApp } from "../SampleBaseApp";

// cSpell:ignore imodels

/** React state of the StartupComponent */
export interface StartupProps {
  onIModelReady(iModel: IModelConnection, viewDefinitionId: Id64String): void;
}

/** React state of the StartupComponent */
export interface StartupState {
  user: {
    isAuthorized: boolean;
    isLoading?: boolean;
  };
  imodel?: IModelConnection;
  viewDefinitionId?: Id64String;
}

/** A component that renders the open IModel button and handles the signin logic */
export class StartupComponent extends React.Component<StartupProps, StartupState> {

  /** Creates an StartupComponent instance */
  constructor(props?: any, context?: any) {
    super(props, context);
    this.state = {
      user: {
        isLoading: false,
        isAuthorized: SampleBaseApp.oidcClient.isAuthorized,
      },
    };
  }

  public componentDidMount() {
    // Initialize authorization state, and add listener to changes
    SampleBaseApp.oidcClient.onUserStateChanged.addListener(this._onUserStateChanged);
    if (SampleBaseApp.oidcClient.isAuthorized)
      this.setState((prev) => ({ user: { ...prev.user, isLoading: false } }));
  }

  public componentWillUnmount() {
    // unsubscribe from user state changes
    SampleBaseApp.oidcClient.onUserStateChanged.removeListener(this._onUserStateChanged);
  }

  private _onStartSignin = async () => {
    this.setState((prev) => ({ user: { ...prev.user, isLoading: true } }));
    await SampleBaseApp.oidcClient.signIn(new FrontendRequestContext());
  }

  private _onUserStateChanged = () => {
    this.setState((prev) => ({ user: { ...prev.user, isLoading: false, isAuthorized: SampleBaseApp.oidcClient.isAuthorized } }));
  }

  /** Pick the first available spatial view definition in the imodel */
  private async getFirstViewDefinitionId(imodel: IModelConnection): Promise<Id64String> {
    // Return default view definition (if any)
    const defaultViewId = await imodel.views.queryDefaultViewId();
    if (Id64.isValid(defaultViewId))
      return defaultViewId;

    // Return first spatial view definition (if any)
    const spatialViews: IModelConnection.ViewSpec[] = await imodel.views.getViewList({ from: SpatialViewState.classFullName });
    if (spatialViews.length > 0)
      return spatialViews[0].id!;

    // Return first drawing view definition (if any)
    const drawingViews: IModelConnection.ViewSpec[] = await imodel.views.getViewList({ from: DrawingViewState.classFullName });
    if (drawingViews.length > 0)
      return drawingViews[0].id!;

    throw new Error("No valid view definitions in imodel");
  }

  /** Handle iModel open event */
  private _onIModelSelected = async (imodel: IModelConnection | undefined) => {
    if (!imodel) {
      // reset the state when imodel is closed
      this.setState({ imodel: undefined, viewDefinitionId: undefined });
      return;
    }
    try {
      // attempt to get a view definition
      const viewDefinitionId = await this.getFirstViewDefinitionId(imodel);
      this.setState({ imodel, viewDefinitionId });

      if (viewDefinitionId)
        this.props.onIModelReady(imodel, viewDefinitionId);
    } catch (e) {
      // if failed, close the imodel and reset the state
      await imodel.close();
      this.setState({ imodel: undefined, viewDefinitionId: undefined });
      alert(e.message);
    }
  }

  /** The component's render method */
  public render() {
    let ui: React.ReactNode;

    if (this.state.user.isLoading) {
      // if user is currently being loaded, just tell that
      ui = `signing-in...`;
    } else if (!this.state.user.isAuthorized) {
      // if user doesn't have and access token, show sign in page
      ui = (<SignIn onSignIn={this._onStartSignin} />);
    } else if (!this.state.imodel || !this.state.viewDefinitionId) {
      // if we don't have an imodel / view definition id - render a button that initiates imodel open
      ui = (<OpenIModelButton onIModelSelected={this._onIModelSelected} />);
    } else {
      // if we do have an imodel and view definition id - startup is finished - nothing to do
    }

    // render the StartupComponent
    return (
      <div>
        {ui}
      </div>
    );
  }
}

/** React props for [[OpenIModelButton]] component */
interface OpenIModelButtonProps {
  onIModelSelected: (imodel: IModelConnection | undefined) => void;
}
/** React state for [[OpenIModelButton]] component */
interface OpenIModelButtonState {
  isLoading: boolean;
}
/** Renders a button that opens an iModel identified in configuration */
class OpenIModelButton extends React.PureComponent<OpenIModelButtonProps, OpenIModelButtonState> {
  public state = { isLoading: false };

  /** Finds project and imodel ids using their names */
  private async getIModelInfo(): Promise<{ projectId: string, imodelId: string }> {
    const imodelName = Config.App.get("imjs_test_imodel");
    const projectName = Config.App.get("imjs_test_project", imodelName);

    const requestContext: AuthorizedFrontendRequestContext = await AuthorizedFrontendRequestContext.create();

    const connectClient = new ContextRegistryClient();
    let project: Project;
    try {
      project = await connectClient.getProject(requestContext, { $filter: `Name+eq+'${projectName}'` });
    } catch (e) {
      throw new Error(`Project with name "${projectName}" does not exist`);
    }

    const imodelQuery = new IModelQuery();
    imodelQuery.byName(imodelName);
    const imodels = await IModelApp.iModelClient.iModels.get(requestContext, project.wsgId, imodelQuery);
    if (imodels.length === 0)
      throw new Error(`iModel with name "${imodelName}" does not exist in project "${projectName}"`);
    return { projectId: project.wsgId, imodelId: imodels[0].wsgId };
  }

  /** Handle iModel open event */
  private async onIModelSelected(imodel: IModelConnection | undefined) {
    this.props.onIModelSelected(imodel);
    this.setState({ isLoading: false });
  }

  private _onClick = async () => {
    this.setState({ isLoading: true });
    let imodel: IModelConnection | undefined;
    try {
      // attempt to open the imodel
      const info = await this.getIModelInfo();
      imodel = await RemoteBriefcaseConnection.open(info.projectId, info.imodelId, OpenMode.Readonly);
    } catch (e) {
      alert(e.message);
    }
    await this.onIModelSelected(imodel);
  }

  public render() {
    return (
      <Button size={ButtonSize.Large} buttonType={ButtonType.Primary} onClick={this._onClick}>
        <span>Open iModel</span>
        {this.state.isLoading ? <span style={{ marginLeft: "8px" }}><Spinner size={SpinnerSize.Small} /></span> : undefined}
      </Button>
    );
  }
}
