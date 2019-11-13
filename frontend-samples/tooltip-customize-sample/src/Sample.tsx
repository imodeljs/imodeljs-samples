/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import "@bentley/icons-generic-webfont/dist/bentley-icons-generic-webfont.css";
import { IModelConnection, ToolAdmin, IModelAppOptions, HitDetail, imageElementFromUrl, IModelApp } from "@bentley/imodeljs-frontend";
import { ViewportAndNavigation } from "@bentley/frontend-sample-base";
import { Id64String } from "@bentley/bentleyjs-core";
import { Toggle } from "@bentley/ui-core";
import "@bentley/frontend-sample-base/src/SampleBase.scss";

enum ElemProperty {
  Origin = "Origin",
  LastModified = "LastMod",
  CodeValue = "CodeValue",
}

class SampleToolAdmin extends ToolAdmin {
  public showImage: boolean;
  public showCustomText: boolean;
  public showElementProperty: boolean;
  public showDefaultToolTip: boolean;
  public customText: string;
  public elemProperty: ElemProperty;

  constructor() {
    super();
    this.showImage = true;
    this.showCustomText = false;
    this.showElementProperty = true;
    this.showDefaultToolTip = true;
    this.customText = "Sample custom string";
    this.elemProperty = ElemProperty.Origin;
  }

  public async getToolTip(hit: HitDetail): Promise<HTMLElement | string> {

    if ( ! this.showImage && ! this.showCustomText && ! this.showElementProperty && ! this.showDefaultToolTip)
      return "";

    const tip = document.createElement("div") as HTMLDivElement;
    let needHR = false;
    if (this.showImage) {
      const img = await imageElementFromUrl (".\\iModeljs-logo.png");
      tip.appendChild (img);
      needHR = true;
    }

    if (this.showCustomText) {
      if (needHR)
        tip.appendChild (document.createElement("hr"));
      const customText = document.createElement("span") as HTMLSpanElement;
      customText.innerHTML = this.customText;
      tip.appendChild (customText);
      needHR = true;
    }

    if (this.showElementProperty) {
      if (needHR)
        tip.appendChild (document.createElement("hr"));

      const propertyName = this.elemProperty as string;
      let msg = "<b>" + propertyName + ":</b> ";

      if (hit.isElementHit) {
        const query = `SELECT ${propertyName} AS val FROM BisCore.SpatialElement
                       WHERE ECInstanceId = ${hit.sourceId}`;

        const rows = hit.viewport.iModel.query(query);
        for await (const row of rows) {
          switch (this.elemProperty) {
            default:
                msg += row.val;
                break;
            case ElemProperty.LastModified:
              const date = new Date(row.val);
              msg += date.toLocaleString();
              break;
            case ElemProperty.Origin:
              msg += "<ul>";
              msg += "<li><b>x:</b> " + row.val.x + "</li>";
              msg += "<li><b>y:</b> " + row.val.y + "</li>";
              msg += "<li><b>z:</b> " + row.val.z + "</li>";
              msg += "</ul>";
              break;
          }
        }
      }

      const htmlTip = document.createElement("span") as HTMLSpanElement;
      htmlTip.innerHTML = msg;
      tip.appendChild (htmlTip);
      needHR = true;
    }

    if (this.showDefaultToolTip) {
      if (needHR)
        tip.appendChild (document.createElement("hr"));
      let defaultTip = await super.getToolTip (hit);
      if (typeof defaultTip === "string") {
        const htmlTip = document.createElement("span") as HTMLSpanElement;
        htmlTip.innerHTML = defaultTip;
        defaultTip = htmlTip;
      }
      tip.appendChild (defaultTip);
    }

    return tip;
  }
}

/** This file contains the user interface that is specific for this sample. */

/** React state of the Sample component */
interface SampleState {
  toolAdmin: SampleToolAdmin;
  showImage: boolean;
  showCustomText: boolean;
  showElementProperty: boolean;
  showDefaultToolTip: boolean;
  customText: string;
  elemProperty: ElemProperty;
}

/** A component the renders the UI for the sample */
export class Sample extends React.Component<{}, SampleState> {

  /** Creates an Sample instance */
  constructor(props?: any, context?: any) {
    super(props, context);
    const toolAdmin = IModelApp.toolAdmin as SampleToolAdmin;
    this.state = {
      toolAdmin,
      showImage: toolAdmin.showImage,
      showCustomText: toolAdmin.showCustomText,
      showElementProperty: toolAdmin.showElementProperty,
      showDefaultToolTip: toolAdmin.showDefaultToolTip,
      customText: toolAdmin.customText,
      elemProperty: toolAdmin.elemProperty,
    };
  }

  public static getIModelAppOptions(): IModelAppOptions {
    const toolAdmin = new SampleToolAdmin();
    return { toolAdmin };
  }

  private _onChangeShowImage = (checked: boolean) => {
    this.setState ({showImage: checked});
    this.state.toolAdmin.showImage = checked;
  }

  private _onChangeShowCustomText = (checked: boolean) => {
    this.setState ({showCustomText: checked});
    this.state.toolAdmin.showCustomText = checked;
  }

  private _onChangeShowElementProperty = (checked: boolean) => {
    this.setState ({showElementProperty: checked});
    this.state.toolAdmin.showElementProperty = checked;
  }

  private _onChangeShowDefaultToolTip = (checked: boolean) => {
    this.setState ({showDefaultToolTip: checked});
    this.state.toolAdmin.showDefaultToolTip = checked;
  }

  private _onChangeCustomText = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value: string = event.target.value;
    this.setState ({customText: value});
    this.state.toolAdmin.customText = value;
  }

  private _onChangeElementProperty = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as ElemProperty;
    this.setState ({elemProperty: value});
    this.state.toolAdmin.elemProperty = value;
  }

  /** The sample's render method */
  public render() {
    return (
      <>
      <div className="sample-ui">
        <div className="sample-instructions">
          <span>Hover the mouse pointer over an element to see the tooltip.  Use these options to control it.</span>
        </div>
        <hr></hr>
        <div className="sample-options-3col">
          <span>Show Image</span>
          <Toggle isOn={this.state.showImage} onChange={this._onChangeShowImage}/>
          <span></span>
          <span>Show Custom Text</span>
          <Toggle isOn={this.state.showCustomText} onChange={this._onChangeShowCustomText}/>
          <input type="text" value={this.state.customText} onChange={this._onChangeCustomText} disabled={!this.state.showCustomText}/>
          <span>Show Element Property</span>
          <Toggle isOn={this.state.showElementProperty} onChange={this._onChangeShowElementProperty}/>
          <select onChange={this._onChangeElementProperty} disabled={!this.state.showElementProperty}>
            <option value={ElemProperty.Origin}> Origin </option>
            <option value={ElemProperty.LastModified}> Last Modified </option>
            <option value={ElemProperty.CodeValue}> Code value </option>
          </select>
          <span>Show Default ToolTip</span>
          <Toggle isOn={this.state.showDefaultToolTip} onChange={this._onChangeShowDefaultToolTip}/>
          <span></span>
        </div>
      </div>
      </>
      );
    }
  }

/*
 * From here down is boiler plate.  You don't need to touch this when creating a new sample.
 *********************************************************************************************/

/** React props for Sample component */
interface SampleProps {
  imodel: IModelConnection;
  viewDefinitionId: Id64String;
}

/** A component the renders the UI for the sample */
export class SampleContainer extends React.Component<SampleProps> {

  /** The sample's render method */
  public render() {
    return (
      <>
      <ViewportAndNavigation imodel={this.props.imodel} viewDefinitionId={this.props.viewDefinitionId} />,
      <Sample/>;
      </>
    );
  }
}
