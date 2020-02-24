/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import * as ReactDOM from "react-dom";
import "@bentley/icons-generic-webfont/dist/bentley-icons-generic-webfont.css";
import { IModelConnection, IModelAppOptions, IModelApp, EmphasizeElements, ScreenViewport, FeatureOverrideType } from "@bentley/imodeljs-frontend";
import { ViewportAndNavigation, GithubLink, SampleUIProvider, SampleContext, SampleBaseApp, App } from "@bentley/frontend-sample-base";
import { Id64String } from "@bentley/bentleyjs-core";
import { Presentation, SelectionChangeEventArgs, ISelectionProvider } from "@bentley/presentation-frontend";
import { Button, ButtonType, Toggle } from "@bentley/ui-core";
import { ColorPickerButton } from "@bentley/ui-components";
import { ColorDef } from "@bentley/imodeljs-common";
import "@bentley/frontend-sample-base/src/SampleBase.scss";

/** This file contains the user interface and main logic that is specific to this sample. */

enum ActionType {
  Emphasize = "Emphasize",
  Isolate = "Isolate",
  Hide = "Hide",
  Override = "Color",
}

abstract class EmphasizeActionBase {
  protected abstract execute(emph: EmphasizeElements, vp: ScreenViewport): boolean;

  public run(): boolean {
    const vp = IModelApp.viewManager.selectedView;

    if (undefined === vp) {
      return false;
    }

    const emph = EmphasizeElements.getOrCreate(vp);
    return this.execute(emph, vp);
  }
}

class EmphasizeAction extends EmphasizeActionBase {
  private _wantEmphasis: boolean;

  public constructor(wantEmphasis: boolean) {
    super();
    this._wantEmphasis = wantEmphasis;
  }
  public execute(emph: EmphasizeElements, vp: ScreenViewport): boolean {
    emph.wantEmphasis = this._wantEmphasis;
    emph.emphasizeSelectedElements(vp);
    return true;
  }
}

class ClearEmphasizeAction extends EmphasizeActionBase {
  public execute(emph: EmphasizeElements, vp: ScreenViewport): boolean {
    emph.clearEmphasizedElements(vp);
    return true;
  }
}

class HideAction extends EmphasizeActionBase {
  public execute(emph: EmphasizeElements, vp: ScreenViewport): boolean {
    emph.hideSelectedElements(vp);
    return true;
  }
}

class ClearHideAction extends EmphasizeActionBase {
  public execute(emph: EmphasizeElements, vp: ScreenViewport): boolean {
    emph.clearHiddenElements(vp);
    return true;
  }
}

class IsolateAction extends EmphasizeActionBase {
  public execute(emph: EmphasizeElements, vp: ScreenViewport): boolean {
    emph.isolateSelectedElements(vp);
    return true;
  }
}

class ClearIsolateAction extends EmphasizeActionBase {
  public execute(emph: EmphasizeElements, vp: ScreenViewport): boolean {
    emph.clearIsolatedElements(vp);
    return true;
  }
}

class OverrideAction extends EmphasizeActionBase {
  private _colorValue: ColorDef;

  public constructor(colorValue: ColorDef) {
    super();
    this._colorValue = colorValue;
  }

  public execute(emph: EmphasizeElements, vp: ScreenViewport): boolean {
    emph.overrideSelectedElements(vp, this._colorValue, FeatureOverrideType.ColorOnly, false, true);
    return true;
  }
}

class ClearOverrideAction extends EmphasizeActionBase {
  public execute(emph: EmphasizeElements, vp: ScreenViewport): boolean {
    emph.clearOverriddenElements(vp);
    return true;
  }
}

/** React state of the Sample component */
interface SampleState {
  selectionIsEmpty: boolean;
  emphasizeIsActive: boolean;
  hideIsActive: boolean;
  isolateIsActive: boolean;
  overrideIsActive: boolean;
  wantEmphasis: boolean;
  colorValue: ColorDef;
}

/** A React component that renders the UI specific for this sample */
export class Sample extends React.Component<{}, SampleState> {

  /** Creates an Sample instance */
  constructor(props?: any, context?: any) {
    super(props, context);
    this.state = {
      selectionIsEmpty: true,
      emphasizeIsActive: false,
      hideIsActive: false,
      isolateIsActive: false,
      overrideIsActive: false,
      wantEmphasis: true,
      colorValue: ColorDef.red,
    };

    // subscribe for unified selection changes
    Presentation.selection.selectionChange.addListener(this._onSelectionChanged);
  }

  /** This method is called as the app initializes.  This gives us a chance to supply options to
   * be passed to IModelApp.startup.
   */
  public static getIModelAppOptions(): IModelAppOptions {
    // This sample doesn't supply any special options.
    return {};
  }

  private _onSelectionChanged = (evt: SelectionChangeEventArgs, selectionProvider: ISelectionProvider) => {
    const selection = selectionProvider.getSelection(evt.imodel, evt.level);
    this.setState({ selectionIsEmpty: selection.isEmpty });
  }

  private _handleActionButton = (type: ActionType) => {
    switch (type) {
      default:
      case ActionType.Emphasize: {
        if (new EmphasizeAction(this.state.wantEmphasis).run())
          this.setState({ emphasizeIsActive: true });
        break;
      }
      case ActionType.Isolate: {
        if (new IsolateAction().run())
          this.setState({ isolateIsActive: true });
        break;
      }
      case ActionType.Hide: {
        if (new HideAction().run())
          this.setState({ hideIsActive: true });
        break;
      }
      case ActionType.Override: {
        if (new OverrideAction(this.state.colorValue).run())
          this.setState({ overrideIsActive: true });
        break;
      }
    }
  }

  private _handleClearButton = (type: ActionType) => {
    switch (type) {
      default:
      case ActionType.Emphasize: {
        if (new ClearEmphasizeAction().run())
          this.setState({ emphasizeIsActive: false });
        break;
      }
      case ActionType.Isolate: {
        if (new ClearIsolateAction().run())
          this.setState({ isolateIsActive: false });
        break;
      }
      case ActionType.Hide: {
        if (new ClearHideAction().run())
          this.setState({ hideIsActive: false });
        break;
      }
      case ActionType.Override: {
        if (new ClearOverrideAction().run())
          this.setState({ overrideIsActive: false });
        break;
      }
    }
  }

  private _onToggleEmphasis = (wantEmphasis: boolean) => {
    this.setState({ wantEmphasis });
  }

  private _onColorPick = (colorValue: ColorDef) => {
    this.setState({ colorValue });
  }

  /** The sample's render method */
  public render() {
    return (
      <>
        <div className="sample-ui">
          <div className="sample-instructions">
            <span>Select one or more elements.  Click one of the Apply buttons.</span>
            <GithubLink linkTarget="https://github.com/imodeljs/imodeljs-samples/tree/master/frontend-samples/emphasize-elements-sample" />
          </div>
          <hr></hr>
          <div className="sample-options-4col">
            <span>Emphasize</span>
            <Toggle isOn={this.state.wantEmphasis} showCheckmark={true} onChange={this._onToggleEmphasis} disabled={this.state.selectionIsEmpty} />
            <Button buttonType={ButtonType.Primary} onClick={() => this._handleActionButton(ActionType.Emphasize)} disabled={this.state.selectionIsEmpty}>Apply</Button>
            <Button buttonType={ButtonType.Primary} onClick={() => this._handleClearButton(ActionType.Emphasize)} disabled={!this.state.emphasizeIsActive}>Clear</Button>
            <span>Hide</span>
            <span />
            <Button buttonType={ButtonType.Primary} onClick={() => this._handleActionButton(ActionType.Hide)} disabled={this.state.selectionIsEmpty}>Apply</Button>
            <Button buttonType={ButtonType.Primary} onClick={() => this._handleClearButton(ActionType.Hide)} disabled={!this.state.hideIsActive}>Clear</Button>
            <span>Isolate</span>
            <span />
            <Button buttonType={ButtonType.Primary} onClick={() => this._handleActionButton(ActionType.Isolate)} disabled={this.state.selectionIsEmpty}>Apply</Button>
            <Button buttonType={ButtonType.Primary} onClick={() => this._handleClearButton(ActionType.Isolate)} disabled={!this.state.isolateIsActive}>Clear</Button>
            <span>Override</span>
            <ColorPickerButton activeColor={this.state.colorValue} onColorPick={this._onColorPick} disabled={this.state.selectionIsEmpty} />
            <Button buttonType={ButtonType.Primary} onClick={() => this._handleActionButton(ActionType.Override)} disabled={this.state.selectionIsEmpty}>Apply</Button>
            <Button buttonType={ButtonType.Primary} onClick={() => this._handleClearButton(ActionType.Override)} disabled={!this.state.overrideIsActive}>Clear</Button>
          </div>
        </div>
      </>
    );
  }
}

/*
* From here down is boiler plate common to all front-end samples.
*********************************************************************************************/

/** React props for Sample component */
interface SampleProps {
  imodel: IModelConnection;
  viewDefinitionId: Id64String;
}

/** A React component that renders the UI for the sample */
export class SampleContainer extends React.PureComponent<SampleProps> {

  /** The sample's render method */
  public render() {
    // ID of the presentation ruleset used by all of the controls; the ruleset
    // can be found at `assets/presentation_rules/Default.PresentationRuleSet.xml`
    const rulesetId = "Default";
    return (
      <>
        <ViewportAndNavigation imodel={this.props.imodel} viewDefinitionId={this.props.viewDefinitionId} rulesetId={rulesetId} />
        <Sample />
      </>
    );
  }
}

// initialize the application
const uiProvider: SampleUIProvider = { getSampleUI: (context: SampleContext) => < SampleContainer imodel={context.imodel} viewDefinitionId={context.viewDefinitionId} /> };
SampleBaseApp.startup(uiProvider, Sample.getIModelAppOptions());

// tslint:disable-next-line:no-floating-promises
SampleBaseApp.ready.then(() => {

  // when initialization is complete, render
  ReactDOM.render(
    <App />,
    document.getElementById("root") as HTMLElement,
  );
});
