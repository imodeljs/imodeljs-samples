/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { ClientRequestContext, Config, Id64, Id64String, Logger, OpenMode } from "@bentley/bentleyjs-core";
import { ContextRegistryClient, Project } from "@bentley/context-registry-client";

// make sure webfont brings in the icons and css files.
import "@bentley/icons-generic-webfont/dist/bentley-icons-generic-webfont.css";
import { IModelQuery } from "@bentley/imodelhub-client";
import { ElectronRpcConfiguration } from "@bentley/imodeljs-common";
import { AuthorizedFrontendRequestContext, DrawingViewState, FrontendRequestContext, IModelApp, IModelConnection, RemoteBriefcaseConnection, SnapshotConnection, SpatialViewState } from "@bentley/imodeljs-frontend";
import { ISelectionProvider, Presentation, SelectionChangeEventArgs } from "@bentley/presentation-frontend";
import { SignIn } from "@bentley/ui-components";
import { Button, ButtonSize, ButtonType, Spinner, SpinnerSize } from "@bentley/ui-core";
import * as React from "react";
import { AppLoggerCategory } from "../../common/LoggerCategory";
import { SimpleViewerApp } from "../api/SimpleViewerApp";
import "./App.css";
import PropertiesWidget from "./Properties";
import GridWidget from "./Table";
import TreeWidget from "./Tree";
import ViewportContentControl from "./Viewport";

/** React state of the App component */
export interface AppState {
  user: {
    isAuthorized: boolean;
    isLoading?: boolean;
  };
  offlineIModel: boolean;
  imodel?: IModelConnection;
  viewDefinitionId?: Id64String;
}

/** A component the renders the whole application UI */
export default class App extends React.Component<{}, AppState> {

  /** Creates an App instance */
  constructor(props?: any, context?: any) {
    super(props, context);
    this.state = {
      user: {
        isAuthorized: SimpleViewerApp.oidcClient.isAuthorized,
        isLoading: false,
      },
      offlineIModel: false,
    };
  }

  public componentDidMount() {
    // subscribe for unified selection changes
    Presentation.selection.selectionChange.addListener(this._onSelectionChanged);
    SimpleViewerApp.oidcClient.onUserStateChanged.addListener(this._onUserStateChanged);
  }

  public componentWillUnmount() {
    // unsubscribe from unified selection changes
    Presentation.selection.selectionChange.removeListener(this._onSelectionChanged);
    SimpleViewerApp.oidcClient.onUserStateChanged.removeListener(this._onUserStateChanged);
  }

  private _onUserStateChanged = () => {
    this.setState((prev) => ({ user: { ...prev.user, isAuthorized: SimpleViewerApp.oidcClient.isAuthorized, isLoading: false } }));
  }

  private _onRegister = () => {
    window.open("https://git.io/fx8YP", "_blank");
  }

  private _onOffline = () => {
    this.setState((prev) => ({ user: { ...prev.user, isLoading: false }, offlineIModel: true }));
  }

  private _onStartSignin = async () => {
    this.setState((prev) => ({ user: { ...prev.user, isLoading: true } }));
    SimpleViewerApp.oidcClient.signIn(new FrontendRequestContext());  // tslint:disable-line:no-floating-promises
  }

  private _onSelectionChanged = (evt: SelectionChangeEventArgs, selectionProvider: ISelectionProvider) => {
    const selection = selectionProvider.getSelection(evt.imodel, evt.level);
    if (selection.isEmpty) {
      Logger.logInfo(AppLoggerCategory.Frontend, "========== Selection cleared ==========");
    } else {
      Logger.logInfo(AppLoggerCategory.Frontend, "========== Selection change ==========");
      if (selection.instanceKeys.size !== 0) {
        // log all selected ECInstance ids grouped by ECClass name
        Logger.logInfo(AppLoggerCategory.Frontend, "ECInstances:");
        selection.instanceKeys.forEach((ids, ecclass) => {
          Logger.logInfo(AppLoggerCategory.Frontend, `${ecclass}: [${[...ids].join(",")}]`);
        });
      }
      if (selection.nodeKeys.size !== 0) {
        // log all selected node keys
        Logger.logInfo(AppLoggerCategory.Frontend, "Nodes:");
        selection.nodeKeys.forEach((key) => Logger.logInfo(AppLoggerCategory.Frontend, JSON.stringify(key)));
      }
      Logger.logInfo(AppLoggerCategory.Frontend, "=======================================");
    }
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
    } catch (e) {
      // if failed, close the imodel and reset the state
      await imodel.close();
      this.setState({ imodel: undefined, viewDefinitionId: undefined });
      alert(e.message);
    }
  }

  private get _signInRedirectUri() {
    const split = (Config.App.get("imjs_browser_test_redirect_uri") as string).split("://");
    return split[split.length - 1];
  }

  private delayedInitialization() {
    if (this.state.offlineIModel) {
      // WORKAROUND: Clear authorization client if operating in offline mode
      IModelApp.authorizationClient = undefined;
    }
  }

  /** The component's render method */
  public render() {
    let ui: React.ReactNode;

    if (this.state.user.isLoading || window.location.href.includes(this._signInRedirectUri)) {
      // if user is currently being loaded, just tell that
      ui = `${IModelApp.i18n.translate("SimpleViewer:signing-in")}...`;
    } else if (!this.state.user.isAuthorized && !this.state.offlineIModel) {
      // if user doesn't have an access token, show sign in page
      // Only call with onOffline prop for electron mode since this is not a valid option for Web apps
      if (ElectronRpcConfiguration.isElectron)
        ui = (<SignIn onSignIn={this._onStartSignin} onRegister={this._onRegister} onOffline={this._onOffline} />);
      else
        ui = (<SignIn onSignIn={this._onStartSignin} onRegister={this._onRegister} />);
    } else if (!this.state.imodel || !this.state.viewDefinitionId) {
      // NOTE: We needed to delay some initialization until now so we know if we are opening a snapshot or an imodel.
      this.delayedInitialization();
      // if we don't have an imodel / view definition id - render a button that initiates imodel open
      ui = (<OpenIModelButton
        onIModelSelected={this._onIModelSelected}
        offlineIModel={this.state.offlineIModel} />);
    } else {
      // if we do have an imodel and view definition id - render imodel components
      ui = <IModelComponents imodel={this.state.imodel} viewDefinitionId={this.state.viewDefinitionId} />;
    }

    // render the app
    return (
      <div className="app">
        <div className="app-header">
          <h2>{IModelApp.i18n.translate("SimpleViewer:welcome-message")}</h2>
        </div>
        {ui}
      </div>
    );
  }
}

/** React props for [[OpenIModelButton]] component */
interface OpenIModelButtonProps {
  offlineIModel: boolean;
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

  private _onClickOpen = async () => {
    this.setState({ isLoading: true });
    let imodel: IModelConnection | undefined;
    try {
      // attempt to open the imodel
      if (this.props.offlineIModel) {
        const offlineIModel = Config.App.getString("imjs_offline_imodel");
        imodel = await SnapshotConnection.openFile(offlineIModel);
      } else {
        const info = await this.getIModelInfo();
        imodel = await RemoteBriefcaseConnection.open(info.projectId, info.imodelId, OpenMode.Readonly);
      }
    } catch (e) {
      alert(e.message);
    }
    await this.onIModelSelected(imodel);
  }

  private _onClickSignOut = async () => {
    if (SimpleViewerApp.oidcClient)
      SimpleViewerApp.oidcClient.signOut(new ClientRequestContext()); // tslint:disable-line:no-floating-promises
  }

  public render() {
    return (
      <div>
        <div>
          <Button size={ButtonSize.Large} buttonType={ButtonType.Primary} className="button-open-imodel" onClick={this._onClickOpen}>
            <span>{IModelApp.i18n.translate("SimpleViewer:components.imodel-picker.open-imodel")}</span>
            {this.state.isLoading ? <span style={{ marginLeft: "8px" }}><Spinner size={SpinnerSize.Small} /></span> : undefined}
          </Button>
        </div>
        <div>
          <Button size={ButtonSize.Large} buttonType={ButtonType.Primary} className="button-signout" onClick={this._onClickSignOut}>
            <span>{IModelApp.i18n.translate("SimpleViewer:components.imodel-picker.signout")}</span>
          </Button>
        </div>
      </div>
    );
  }
}

/** React props for [[IModelComponents]] component */
interface IModelComponentsProps {
  imodel: IModelConnection;
  viewDefinitionId: Id64String;
}
/** Renders a viewport, a tree, a property grid and a table */
class IModelComponents extends React.PureComponent<IModelComponentsProps> {
  public render() {
    return (
      <div className="app-content">
        <div className="top-left">
          <ViewportContentControl imodel={this.props.imodel} viewDefinitionId={this.props.viewDefinitionId} />
        </div>
        <div className="right">
          <div className="top">
            <TreeWidget imodel={this.props.imodel} />
          </div>
          <div className="bottom">
            <PropertiesWidget imodel={this.props.imodel} />
          </div>
        </div>
        <div className="bottom">
          <GridWidget imodel={this.props.imodel} />
        </div>
      </div>
    );
  }
}
