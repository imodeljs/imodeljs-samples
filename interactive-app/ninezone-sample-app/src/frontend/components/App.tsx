/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { Provider } from "react-redux";

import { ElectronRpcConfiguration } from "@bentley/imodeljs-common";
import { OpenMode, ClientRequestContext } from "@bentley/bentleyjs-core";
import { ConnectClient, IModelQuery, Project, Config } from "@bentley/imodeljs-clients";
import { IModelApp, IModelConnection, FrontendRequestContext, AuthorizedFrontendRequestContext, ViewState } from "@bentley/imodeljs-frontend";
import { Presentation, SelectionChangeEventArgs, ISelectionProvider, IFavoritePropertiesStorage, FavoriteProperties, FavoritePropertiesManager } from "@bentley/presentation-frontend";
import { Button, ButtonSize, ButtonType, Spinner, SpinnerSize } from "@bentley/ui-core";
import { ConfigurableUiContent, UiFramework, BackstageItem } from "@bentley/ui-framework";
import { SignIn } from "@bentley/ui-components";

import { AppUi } from "../app-ui/AppUi";
import { NineZoneSampleApp } from "../app/NineZoneSampleApp";

// make sure webfont brings in the icons and css files.
import "@bentley/icons-generic-webfont/dist/bentley-icons-generic-webfont.css";
import "./App.css";
import { AppBackstageItemProvider } from "../app-ui/backstage/AppBackstageItemProvider";
import { AppBackstageComposer } from "../app-ui/backstage/AppBackstageComposer";

// tslint:disable: no-console

/** React state of the App component */
export interface State {
  user: {
    isLoading?: boolean;
  };
  offlineIModel: boolean;
  imodel?: IModelConnection;
  viewStates?: ViewState[];
}

/** A component the renders the whole application UI */
export default class App extends React.Component<{}, State> {

  /** Creates an App instance */
  constructor(props?: any, context?: any) {
    super(props, context);
    this.state = {
      user: {
        isLoading: false,
      },
      offlineIModel: false,
      imodel: undefined, viewStates: undefined,
    };
  }

  public componentDidMount() {
    // subscribe for unified selection changes
    Presentation.selection.selectionChange.addListener(this._onSelectionChanged);
  }

  public componentWillUnmount() {
    // unsubscribe from unified selection changes
    Presentation.selection.selectionChange.removeListener(this._onSelectionChanged);
  }

  private _onSelectionChanged = (evt: SelectionChangeEventArgs, selectionProvider: ISelectionProvider) => {
    const selection = selectionProvider.getSelection(evt.imodel, evt.level);
    if (selection.isEmpty) {
      console.log("========== Selection cleared ==========");
    } else {
      console.log("========== Selection change ===========");
      if (selection.instanceKeys.size !== 0) {
        // log all selected ECInstance ids grouped by ECClass name
        console.log("ECInstances:");
        selection.instanceKeys.forEach((ids, ecclass) => {
          console.log(`${ecclass}: [${[...ids].join(",")}]`);
        });
      }
      if (selection.nodeKeys.size !== 0) {
        // log all selected node keys
        console.log("Nodes:");
        selection.nodeKeys.forEach((key) => console.log(JSON.stringify(key)));
      }
      console.log("=======================================");
    }
  }

  private _onRegister = () => {
    window.open("https://imodeljs.github.io/iModelJs-docs-output/getting-started/#developer-registration", "_blank");
  }

  private _onOffline = () => {
    this.setState((prev) => ({ user: { ...prev.user, isLoading: false }, offlineIModel: true }));
  }

  private _onStartSignin = async () => {
    this.setState((prev) => ({ user: { ...prev.user, isLoading: true } }));
    await NineZoneSampleApp.oidcClient.signIn(new FrontendRequestContext());
  }

  /** Pick the first two available spatial, orthographic or drawing view definitions in the imodel */
  private async getFirstTwoViewDefinitions(imodel: IModelConnection): Promise<ViewState[]> {
    const viewSpecs = await imodel.views.queryProps({});
    const acceptedViewClasses = [
      "BisCore:SpatialViewDefinition",
      "BisCore:DrawingViewDefinition",
      "BisCore:OrthographicViewDefinition",
    ];
    const acceptedViewSpecs = viewSpecs.filter((spec) => (-1 !== acceptedViewClasses.indexOf(spec.classFullName)));
    if (2 > acceptedViewSpecs.length)
      throw new Error("No valid view definitions in imodel");

    const viewStates: ViewState[] = [];
    for (const viewDef of acceptedViewSpecs) {
      const viewState = await imodel.views.load(viewDef.id!);
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
      if (this.state.offlineIModel) {
        await imodel.closeSnapshot();
      } else {
        await imodel.close();
      }

      this.setState({ imodel: undefined, viewStates: undefined });
      alert(e.message);
    }
  }

  private delayedInitialization() {

    if (this.state.offlineIModel) {
      // WORKAROUND: create 'local' FavoritePropertiesManager when in 'offline' or snapshot mode. Otherwise,
      //             the PresentationManager will try to use the Settings service online and fail.
      const storage: IFavoritePropertiesStorage = {
        loadProperties: async (_?: string, __?: string) => ( {
          nestedContentInfos: new Set<string>(),
          propertyInfos: new Set<string>(),
          baseFieldInfos: new Set<string>(),
        }),
        async saveProperties(_: FavoriteProperties, __?: string, ___?: string) {},
      };
      Presentation.favoriteProperties = new FavoritePropertiesManager({storage});

      // WORKAROUND: Clear authorization client if operating in offline mode
      IModelApp.authorizationClient = undefined;
    }

    // initialize Presentation
    Presentation.initialize({activeLocale: IModelApp.i18n.languageList()[0]});
  }

  /** The component's render method */
  public render() {
    let ui: React.ReactNode;
    let style: React.CSSProperties = {};

    if (this.state.user.isLoading) {
      // if user is currently being loaded, just tell that
      ui = `${IModelApp.i18n.translate("NineZoneSample:signing-in")}...`;
    } else if (!NineZoneSampleApp.oidcClient.hasSignedIn && !this.state.offlineIModel) {
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
      // if we do have an imodel and view definition id - render
      // imodel components
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
    const projectName = Config.App.get("imjs_test_project");
    const imodelName = Config.App.get("imjs_test_imodel");

    const requestContext: AuthorizedFrontendRequestContext = await AuthorizedFrontendRequestContext.create();

    const connectClient = new ConnectClient();
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
        imodel = await IModelConnection.openSnapshot(offlineIModel);
      } else {
        const info = await this.getIModelInfo();
        imodel = await IModelConnection.open(info.projectId, info.imodelId, OpenMode.Readonly);
      }
    } catch (e) {
      alert(e.message);
    }
    await this.onIModelSelected(imodel);
  }

  private _onClickSignOut = async () => {
    if (NineZoneSampleApp.oidcClient)
      NineZoneSampleApp.oidcClient.signOut(new ClientRequestContext()); // tslint:disable-line:no-floating-promises
  }

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
            {this.state.isLoading ? <span style={{ marginLeft: "8px"}}><Spinner size={SpinnerSize.Small} /></span> : undefined}
          </Button>
        </div>
      </div>
    );
  }
}

/** Renders a viewport, a tree, a property grid and a table */
class IModelComponents extends React.PureComponent {
  private _provider = new AppBackstageItemProvider();

  public componentDidMount() {
    UiFramework.backstageManager.itemsManager.add(this._provider.backstageItems);
  }

  public componentWillUnmount() {
    const items = this._provider.backstageItems.map((item: BackstageItem) => item.id);
    UiFramework.backstageManager.itemsManager.remove(items);
  }

  public render() {
    return (
      <ConfigurableUiContent appBackstage={<AppBackstageComposer />} />
    );
  }
}
