/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { ClientRequestContext, Config, OpenMode } from "@bentley/bentleyjs-core";
import { ContextRegistryClient, Project } from "@bentley/context-registry-client";
// make sure webfont brings in the icons and css files.
import "@bentley/icons-generic-webfont/dist/bentley-icons-generic-webfont.css";
import { IModelQuery } from "@bentley/imodelhub-client";
import { ElectronRpcConfiguration } from "@bentley/imodeljs-common";
import { AuthorizedFrontendRequestContext, FrontendRequestContext, IModelApp, IModelConnection, RemoteBriefcaseConnection, SnapshotConnection, ViewState } from "@bentley/imodeljs-frontend";
import { SignIn } from "@bentley/ui-components";
import { Button, ButtonSize, ButtonType, Spinner, SpinnerSize } from "@bentley/ui-core";
import { ConfigurableUiContent, UiFramework } from "@bentley/ui-framework";
import * as React from "react";
import { Provider } from "react-redux";
import { AppUi } from "../app-ui/AppUi";
import { AppBackstageComposer } from "../app-ui/backstage/AppBackstageComposer";
import { NineZoneSampleApp } from "../app/NineZoneSampleApp";
import "./App.css";

/** React state of the App component */
export interface AppState {
  user: {
    isAuthorized: boolean;
    isLoading?: boolean;
  };
  offlineIModel: boolean;
  imodel?: IModelConnection;
  viewStates?: ViewState[];
}

/** A component the renders the whole application UI */
export default class App extends React.Component<{}, AppState> {

  /** Creates an App instance */
  constructor(props?: any, context?: any) {
    super(props, context);
    this.state = {
      user: {
        isAuthorized: NineZoneSampleApp.oidcClient.isAuthorized,
        isLoading: false,
      },
      offlineIModel: false,
      imodel: undefined, viewStates: undefined,
    };
  }

  public componentDidMount() {
    NineZoneSampleApp.oidcClient.onUserStateChanged.addListener(this._onUserStateChanged);
  }

  public componentWillUnmount() {
    // unsubscribe from unified selection changes
    NineZoneSampleApp.oidcClient.onUserStateChanged.removeListener(this._onUserStateChanged);
  }

  private _onUserStateChanged = () => {
    this.setState((prev) => ({ user: { ...prev.user, isAuthorized: NineZoneSampleApp.oidcClient.isAuthorized, isLoading: false } }));
  };

  private _onRegister = () => {
    window.open("https://git.io/fx8YP", "_blank");
  };

  private _onOffline = () => {
    this.setState((prev) => ({ user: { ...prev.user, isLoading: false }, offlineIModel: true }));
  };

  private _onStartSignin = async () => {
    this.setState((prev) => ({ user: { ...prev.user, isLoading: true } }));
    await NineZoneSampleApp.oidcClient.signIn(new FrontendRequestContext());
  };

  /** Pick the first two available spatial, orthographic or drawing view definitions in the imodel */
  private async getFirstTwoViewDefinitions(imodel: IModelConnection): Promise<ViewState[]> {
    const viewSpecs = await imodel.views.queryProps({});
    const acceptedViewClasses = [
      "BisCore:SpatialViewDefinition",
      "BisCore:DrawingViewDefinition",
      "BisCore:OrthographicViewDefinition",
    ];
    const acceptedViewSpecs = viewSpecs.filter((spec) => (-1 !== acceptedViewClasses.indexOf(spec.classFullName)));
    if (1 > acceptedViewSpecs.length)
      throw new Error("No valid view definitions in imodel");

    const viewStates: ViewState[] = [];
    for (const viewDef of acceptedViewSpecs) {
      const viewState = await imodel.views.load(viewDef.id!);
      viewStates.push(viewState);
    }

    if (1 === acceptedViewSpecs.length) {
      const viewState = await imodel.views.load(acceptedViewSpecs[0].id!);
      viewStates.push(viewState);
    }

    return viewStates;
  }

  /** Handle iModel open event */
  private _onIModelSelected = async (imodel: IModelConnection | undefined) => {
    if (!imodel) {
      // reset the state when imodel is closed
      this.setState({ imodel: undefined, viewStates: undefined });
      UiFramework.setIModelConnection(undefined);
      return;
    }
    try {
      // attempt to get ViewState for the first two available view definitions
      const viewStates = await this.getFirstTwoViewDefinitions(imodel);
      if (viewStates) {
        this.setState(
          { imodel, viewStates },
          () => { AppUi.handleIModelViewsSelected(imodel, viewStates); },
        );
      }
    } catch (e) {
      // if failed, close the imodel and reset the state
      await imodel.close();
      this.setState({ imodel: undefined, viewStates: undefined });
      alert(e.message);
    }
  };

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
    let style: React.CSSProperties = {};

    if (this.state.user.isLoading || window.location.href.includes(this._signInRedirectUri)) {
      // if user is currently being loaded, just tell that
      ui = `${IModelApp.i18n.translate("NineZoneSample:signing-in")}...`;
    } else if (!this.state.user.isAuthorized && !this.state.offlineIModel) {
      // if user doesn't have an access token, show sign in page
      // Only call with onOffline prop for electron mode since this is not a valid option for Web apps
      if (ElectronRpcConfiguration.isElectron)
        ui = (<SignIn onSignIn={this._onStartSignin} onRegister={this._onRegister} onOffline={this._onOffline} />);
      else
        ui = (<SignIn onSignIn={this._onStartSignin} onRegister={this._onRegister} />);
    } else if (!this.state.imodel || !this.state.viewStates) {
      // NOTE: We needed to delay some initialization until now so we know if we are opening a snapshot or an imodel.
      this.delayedInitialization();
      // if we don't have an imodel / view definition id - render a button that initiates imodel open
      ui = (<OpenIModelButton
        onIModelSelected={this._onIModelSelected}
        offlineIModel={this.state.offlineIModel} />);
    } else {
      // if we do have an imodel and view definition id - render imodel components
      ui = <IModelComponents />;
      style = { display: "none" };
    }

    // render the app
    return (
      <Provider store={NineZoneSampleApp.store} >
        <div className="App">
          <div className="Header" style={style}>
            <h2>{IModelApp.i18n.translate("NineZoneSample:welcome-message")}</h2>
          </div>
          {ui}
        </div>
      </Provider>
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
      const projects: Project[] = await connectClient.getInvitedProjects(requestContext, { $filter: `Name+eq+'${projectName}'` });
      project = projects[0];
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
  };

  private _onClickSignOut = async () => {
    if (NineZoneSampleApp.oidcClient)
      NineZoneSampleApp.oidcClient.signOut(new ClientRequestContext());  // eslint-disable-line @typescript-eslint/no-floating-promises
  };

  public render() {
    return (
      <div>
        <div>
          <Button size={ButtonSize.Large} buttonType={ButtonType.Primary} className="button-open-imodel" onClick={this._onClickOpen}>
            <span>{IModelApp.i18n.translate("NineZoneSample:components.imodel-picker.open-imodel")}</span>
            {this.state.isLoading ? <span style={{ marginLeft: "8px" }}><Spinner size={SpinnerSize.Small} /></span> : undefined}
          </Button>
        </div>
        <div>
          <Button size={ButtonSize.Large} buttonType={ButtonType.Primary} className="button-signout" onClick={this._onClickSignOut}>
            <span>{IModelApp.i18n.translate("NineZoneSample:components.imodel-picker.signout")}</span>
          </Button>
        </div>
      </div>
    );
  }
}

/** Renders a viewport, a tree, a property grid and a table */
class IModelComponents extends React.PureComponent {
  public render() {
    return (
      <ConfigurableUiContent appBackstage={<AppBackstageComposer />} />
    );
  }
}
