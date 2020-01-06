/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import * as React from "react";
import * as moq from "typemoq";
import { render } from "@testing-library/react";
import { expect } from "chai";
import PropertiesComponent from "../../../../src/frontend/components/Properties";
import { IModelApp, IModelConnection } from "@bentley/imodeljs-frontend";
import { IPresentationPropertyDataProvider } from "@bentley/presentation-components";
import { PropertyData, PropertyDataChangeEvent } from "@bentley/ui-components";
import { KeySet } from "@bentley/presentation-common";

const iModelConnectionMock = moq.Mock.ofType<IModelConnection>();

class EmptyPropertyDataProvider implements IPresentationPropertyDataProvider {
  public displayType = "test";
  public keys = new KeySet();
  public selectionInfo = undefined;
  public imodel = iModelConnectionMock.object;
  public rulesetId = "";

  protected _data: PropertyData = {
    label: "Empty data",
    categories: [],
    records: { test: [] },
  };

  public dispose() { }

  public getContentDescriptor = async () => undefined;
  public getContentSetSize = async () => 0;
  public getContent = async () => undefined;

  public getData =  async () => this._data;
  public onDataChanged = new PropertyDataChangeEvent();
}

describe("Properties", () => {

  it("renders header", () => {
    const renderWrapper = render(<PropertiesComponent dataProvider={new EmptyPropertyDataProvider()}/>);
    const header = renderWrapper.getByTestId("property-pane-component-header");
    expect(header.innerHTML).to.equal(IModelApp.i18n.translate("SimpleViewer:components.properties"));
  });

});
