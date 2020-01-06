/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import "@bentley/icons-generic-webfont/dist/bentley-icons-generic-webfont.css";
import { IModelConnection, IModelAppOptions, IModelApp, ViewChangeOptions, MarginPercent, StandardViewId, ZoomToOptions } from "@bentley/imodeljs-frontend";
import { ViewportAndNavigation, GithubLink } from "@bentley/frontend-sample-base";
import { Id64String } from "@bentley/bentleyjs-core";
import { Presentation, SelectionChangeEventArgs, ISelectionProvider } from "@bentley/presentation-frontend";
import { Button, ButtonType, Toggle } from "@bentley/ui-core";
import "@bentley/frontend-sample-base/src/SampleBase.scss";
import "./Sample.scss";

/** This file contains the user interface and main logic that is specific to this sample. */

/** React state of the Sample component */
interface ZoomToProps {
  imodel: IModelConnection;
}

/** React state of the Sample component */
interface SampleState {
  elementsAreSelected: boolean;
  elementList: string[];
  selectedList: string[];
  animateEnable: boolean;
  animateVal: boolean;
  marginEnable: boolean;
  marginVal: number;
  relativeViewEnable: boolean;
  relativeViewVal: StandardViewId;
  standardViewEnable: boolean;
  standardViewVal: StandardViewId;
}

/** A React component that renders the UI specific for this sample */
export class Sample extends React.Component<ZoomToProps, SampleState> {
  private _ignoreSelectionChanged = false;
  private _listRef = React.createRef<HTMLSelectElement>();

  /** Creates an Sample instance */
  constructor(props?: any, context?: any) {
    super(props, context);
    this.state = {
      elementsAreSelected: false,
      elementList: [],
      selectedList: [],
      animateEnable: false,
      animateVal: true,
      marginEnable: false,
      marginVal: 0.1,
      relativeViewEnable: false,
      relativeViewVal: StandardViewId.Top,
      standardViewEnable: false,
      standardViewVal: StandardViewId.Top,
    };

    // subscribe for unified selection changes
    Presentation.selection.selectionChange.addListener(this._onSelectionChanged);
  }

  private _onSelectionChanged = (evt: SelectionChangeEventArgs, selectionProvider: ISelectionProvider) => {
    const selection = selectionProvider.getSelection(evt.imodel, evt.level);
    this.setState({ elementsAreSelected: !selection.isEmpty });
  }

  public static getIModelAppOptions(): IModelAppOptions {
    return {};
  }

  private _handleZoomToElementsButton = async () => {
    const viewChangeOpts: ViewChangeOptions = {};
    if (this.state.animateEnable)
      viewChangeOpts.animateFrustumChange = this.state.animateVal;
    if (this.state.marginEnable)
      viewChangeOpts.marginPercent = new MarginPercent(this.state.marginVal, this.state.marginVal, this.state.marginVal, this.state.marginVal);

    const zoomToOpts: ZoomToOptions = {};
    if (this.state.relativeViewEnable)
      zoomToOpts.placementRelativeId = this.state.relativeViewVal;
    if (this.state.standardViewEnable)
      zoomToOpts.standardViewId = this.state.standardViewVal;

    await IModelApp.viewManager.selectedView!.zoomToElements(this.state.elementList, { ...viewChangeOpts, ...zoomToOpts });
    this.props.imodel.selectionSet.replace(this.state.elementList);
  }

  private _handleCaptureIdsButton = () => {
    const toAdd: string[] = [];
    for (const e of this.props.imodel.selectionSet.elements) {
      if (this.state.elementList.indexOf(e) < 0) {
        toAdd.push(e);
      }
    }
    this.setState({ elementList: [...this.state.elementList, ...toAdd] });
    this.props.imodel.selectionSet.emptyAll();
  }

  private _handleRemoveIdsButton = () => {
    const filteredList = this.state.elementList.filter((e) => this.state.selectedList.indexOf(e) < 0);
    const tableElement = this._listRef.current;
    if (!tableElement)
      return;

    this._ignoreSelectionChanged = true;
    tableElement.selectedIndex = -1;

    for (const option of tableElement.selectedOptions) {
      option.selected = false;
    }
    this._ignoreSelectionChanged = false;

    this.setState({ elementList: filteredList, selectedList: [] });
    this.props.imodel.selectionSet.emptyAll();
  }

  private _handleSelectorChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (this._ignoreSelectionChanged)
      return;

    const selectedList: string[] = [];
    for (const option of event.target.selectedOptions) {
      selectedList.push(option.value);
    }
    this.setState({ selectedList });
    this.props.imodel.selectionSet.replace(selectedList);
  }

  /** Selector for list of elementIds */
  private _elementIdSelector = () => {
    return (
      <select ref={this._listRef} multiple onChange={this._handleSelectorChange}>
        {this.state.elementList.map((item: string) => <option>{item}</option>)}
      </select>
    );
  }

  /** The sample's render method */
  public render() {
    return (
      <>
        <div className="sample-ui">
          <div className="sample-instructions">
            <span>Select one or more elements.  Click to capture their Ids into a list.  Set the options and then click Zoom to Elements.</span>
            <GithubLink linkTarget="https://github.com/imodeljs/imodeljs-samples/tree/master/frontend-samples/zoom-to-elements-sample" />
          </div>
          <hr></hr>
          <div className="table-wrapper">
            {this._elementIdSelector()}
            <div className="table-button-wrapper">
              <Button buttonType={ButtonType.Primary} title="Add Elements selected in view" onClick={() => this._handleCaptureIdsButton()} disabled={!this.state.elementsAreSelected}>+</Button>
              <Button buttonType={ButtonType.Primary} title="Remove selected list entries" onClick={() => this._handleRemoveIdsButton()} disabled={0 === this.state.selectedList.length}>-</Button>
            </div>
          </div>
          <span className="table-caption">{this.state.elementList.length} elementIds in list</span>
          <hr></hr>
          <div className="sample-options-3col">
            <Toggle isOn={this.state.animateEnable} onChange={() => this.setState({ animateEnable: !this.state.animateEnable })} />
            <span>Animate</span>
            <Toggle isOn={this.state.animateVal} onChange={() => this.setState({ animateVal: !this.state.animateVal })} disabled={!this.state.animateEnable} />
            <Toggle isOn={this.state.marginEnable} onChange={() => this.setState({ marginEnable: !this.state.marginEnable })} />
            <span>Margin</span>
            <input type="range" min="0" max="0.25" step="0.01" value={this.state.marginVal} onChange={(event: React.ChangeEvent<HTMLInputElement>) => this.setState({ marginVal: Number(event.target.value) })} disabled={!this.state.marginEnable}></input>
            <Toggle isOn={this.state.standardViewEnable} onChange={() => this.setState({ standardViewEnable: !this.state.standardViewEnable })} />
            <span>Standard View</span>
            <ViewPicker onViewPick={(viewId: StandardViewId) => { this.setState({ standardViewVal: viewId }); }} disabled={!this.state.standardViewEnable} />
            <Toggle isOn={this.state.relativeViewEnable} onChange={() => this.setState({ relativeViewEnable: !this.state.relativeViewEnable })} />
            <span>Relative View</span>
            <ViewPicker onViewPick={(viewId: StandardViewId) => { this.setState({ relativeViewVal: viewId }); }} disabled={!this.state.relativeViewEnable} />
          </div>
          <hr></hr>
          <div style={{ textAlign: "center" }}>
            <Button buttonType={ButtonType.Primary} onClick={() => this._handleZoomToElementsButton()} disabled={0 === this.state.elementList.length}>Zoom to Elements</Button>
          </div>
        </div>
      </>
    );
  }
}

interface ViewPickerProps {
  /** function to run when user selects a view */
  onViewPick?: ((viewId: StandardViewId) => void) | undefined;
  disabled?: boolean;
}

class ViewPicker extends React.PureComponent<ViewPickerProps> {
  private viewIdFromStringVal(stringVal: string): StandardViewId {
    let viewId = StandardViewId.NotStandard;
    switch (stringVal) {
      case "0": viewId = StandardViewId.Top; break;
      case "1": viewId = StandardViewId.Bottom; break;
      case "2": viewId = StandardViewId.Left; break;
      case "3": viewId = StandardViewId.Right; break;
      case "4": viewId = StandardViewId.Front; break;
      case "5": viewId = StandardViewId.Back; break;
      case "6": viewId = StandardViewId.Iso; break;
      case "7": viewId = StandardViewId.RightIso; break;
    }
    return viewId;
  }

  private _handleViewPick = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (this.props.onViewPick)
      this.props.onViewPick(this.viewIdFromStringVal(event.target.value));
  }

  public render() {
    return (
      <select onChange={this._handleViewPick} disabled={this.props.disabled}>
        <option value={StandardViewId.Top}>Top</option>
        <option value={StandardViewId.Bottom}>Bottom</option>
        <option value={StandardViewId.Left}>Left</option>
        <option value={StandardViewId.Right}>Right</option>
        <option value={StandardViewId.Front}>Front</option>
        <option value={StandardViewId.Back}>Back</option>
        <option value={StandardViewId.Iso}>Iso</option>
        <option value={StandardViewId.RightIso}>RightIso</option>
      </select>
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
        <ViewportAndNavigation imodel={this.props.imodel} viewDefinitionId={this.props.viewDefinitionId} rulesetId={rulesetId} />,
      <Sample imodel={this.props.imodel} />;
      </>
    );
  }
}
