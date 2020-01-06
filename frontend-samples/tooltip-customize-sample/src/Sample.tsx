/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import "@bentley/icons-generic-webfont/dist/bentley-icons-generic-webfont.css";
import { IModelConnection, ToolAdmin, IModelAppOptions, HitDetail, imageElementFromUrl, IModelApp } from "@bentley/imodeljs-frontend";
import { ViewportAndNavigation, GithubLink } from "@bentley/frontend-sample-base";
import { Id64String } from "@bentley/bentleyjs-core";
import { Toggle } from "@bentley/ui-core";
import "@bentley/frontend-sample-base/src/SampleBase.scss";

/** This file contains the user interface and main logic that is specific to this sample. */

enum ElemProperty {
  Origin = "Origin",
  LastModified = "LastMod",
  CodeValue = "CodeValue",
}

interface SampleSettings {
  showImage: boolean;
  showCustomText: boolean;
  showElementProperty: boolean;
  showDefaultToolTip: boolean;
  customText: string;
  elemProperty: ElemProperty;
}

class SampleToolAdmin extends ToolAdmin {
  public settings: SampleSettings = {
    showImage: true,
    showCustomText: false,
    showElementProperty: true,
    showDefaultToolTip: true,
    customText: "Sample custom string",
    elemProperty: ElemProperty.Origin,
  };

  public async getToolTip(hit: HitDetail): Promise<HTMLElement | string> {

    if (!this.settings.showImage && !this.settings.showCustomText && !this.settings.showElementProperty && !this.settings.showDefaultToolTip)
      return "";

    const tip = document.createElement("div") as HTMLDivElement;
    let needHR = false;
    if (this.settings.showImage) {
      const img = await imageElementFromUrl(".\\iModeljs-logo.png");
      tip.appendChild(img);
      needHR = true;
    }

    if (this.settings.showCustomText) {
      if (needHR)
        tip.appendChild(document.createElement("hr"));
      const customText = document.createElement("span") as HTMLSpanElement;
      customText.innerHTML = this.settings.customText;
      tip.appendChild(customText);
      needHR = true;
    }

    if (this.settings.showElementProperty) {
      if (needHR)
        tip.appendChild(document.createElement("hr"));

      const propertyName = this.settings.elemProperty as string;
      let msg = "<b>" + propertyName + ":</b> ";

      if (hit.isElementHit) {
        const query = `SELECT ${propertyName} AS val FROM BisCore.SpatialElement
                       WHERE ECInstanceId = ${hit.sourceId}`;

        const rows = hit.viewport.iModel.query(query);
        for await (const row of rows) {
          switch (this.settings.elemProperty) {
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
      tip.appendChild(htmlTip);
      needHR = true;
    }

    if (this.settings.showDefaultToolTip) {
      if (needHR)
        tip.appendChild(document.createElement("hr"));
      let defaultTip = await super.getToolTip(hit);
      if (typeof defaultTip === "string") {
        const htmlTip = document.createElement("span") as HTMLSpanElement;
        htmlTip.innerHTML = defaultTip;
        defaultTip = htmlTip;
      }
      tip.appendChild(defaultTip);
    }

    return tip;
  }
}

/** A React component that renders the UI specific for this sample */
export class Sample extends React.Component<{}, SampleSettings> {

  /** Creates a Sample instance */
  constructor(props?: any, context?: any) {
    super(props, context);
    const toolAdmin = IModelApp.toolAdmin as SampleToolAdmin;
    this.state = { ...toolAdmin.settings };
  }

  public static getIModelAppOptions(): IModelAppOptions {
    const toolAdmin = new SampleToolAdmin();
    return { toolAdmin };
  }

  private _onChangeShowImage = (checked: boolean) => {
    this.setState({ showImage: checked }, () => {
      const toolAdmin = IModelApp.toolAdmin as SampleToolAdmin;
      toolAdmin.settings.showImage = checked;
    });
  }

  private _onChangeShowCustomText = (checked: boolean) => {
    this.setState({ showCustomText: checked }, () => {
      const toolAdmin = IModelApp.toolAdmin as SampleToolAdmin;
      toolAdmin.settings.showCustomText = checked;
    });
  }

  private _onChangeShowElementProperty = (checked: boolean) => {
    this.setState({ showElementProperty: checked }, () => {
      const toolAdmin = IModelApp.toolAdmin as SampleToolAdmin;
      toolAdmin.settings.showElementProperty = checked;
    });
  }

  private _onChangeShowDefaultToolTip = (checked: boolean) => {
    this.setState({ showDefaultToolTip: checked }, () => {
      const toolAdmin = IModelApp.toolAdmin as SampleToolAdmin;
      toolAdmin.settings.showDefaultToolTip = checked;
    });
  }

  private _onChangeCustomText = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value: string = event.target.value;
    this.setState({ customText: value }, () => {
      const toolAdmin = IModelApp.toolAdmin as SampleToolAdmin;
      toolAdmin.settings.customText = value;
    });
  }

  private _onChangeElementProperty = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as ElemProperty;
    this.setState({ elemProperty: value }, () => {
      const toolAdmin = IModelApp.toolAdmin as SampleToolAdmin;
      toolAdmin.settings.elemProperty = value;
    });
  }

  /** The sample's render method */
  public render() {
    return (
      <>
        { /* This is the ui specific for this sample.*/}
        <div className="sample-ui">
          <div className="sample-instructions">
            <span>Hover the mouse pointer over an element to see the tooltip.  Use these options to control it.</span>
            <GithubLink linkTarget="https://github.com/imodeljs/imodeljs-samples/tree/master/frontend-samples/tooltip-customize-sample" />
          </div>
          <hr></hr>
          <div className="sample-options-3col">
            <Toggle isOn={this.state.showImage} onChange={this._onChangeShowImage} />
            <span>Show Image</span>
            <span></span>
            <Toggle isOn={this.state.showCustomText} onChange={this._onChangeShowCustomText} />
            <span>Show Custom Text</span>
            <input type="text" value={this.state.customText} onChange={this._onChangeCustomText} disabled={!this.state.showCustomText} />
            <Toggle isOn={this.state.showElementProperty} onChange={this._onChangeShowElementProperty} />
            <span>Show Element Property</span>
            <select onChange={this._onChangeElementProperty} value={this.state.elemProperty} disabled={!this.state.showElementProperty}>
              <option value={ElemProperty.Origin}> Origin </option>
              <option value={ElemProperty.LastModified}> Last Modified </option>
              <option value={ElemProperty.CodeValue}> Code value </option>
            </select>
            <Toggle isOn={this.state.showDefaultToolTip} onChange={this._onChangeShowDefaultToolTip} />
            <span>Show Default ToolTip</span>
            <span></span>
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
export class SampleContainer extends React.Component<SampleProps> {

  /** The sample's render method */
  public render() {
    // ID of the presentation ruleset used by all of the controls; the ruleset
    // can be found at `assets/presentation_rules/Default.PresentationRuleSet.xml`
    const rulesetId = "Default";
    return (
      <>
        <ViewportAndNavigation imodel={this.props.imodel} viewDefinitionId={this.props.viewDefinitionId} rulesetId={rulesetId} />,
      <Sample />;
      </>
    );
  }
}
