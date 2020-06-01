/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import * as React from "react";
import * as moq from "typemoq";
import { render } from "@testing-library/react";
import { waitForElement } from "@testing-library/dom";
import { expect } from "chai";

import { IModelApp, IModelConnection } from "@bentley/imodeljs-frontend";
import { IPresentationTreeDataProvider } from "@bentley/presentation-components";
import { PropertyRecord } from "@bentley/ui-abstract";
import { TreeNodeItem } from "@bentley/ui-components";
import TreeComponent from "../../../../src/frontend/components/Tree";

const iModelConnectionMock = moq.Mock.ofType<IModelConnection>();

class EmptyTreeDataProvider implements IPresentationTreeDataProvider {
  protected _nodes: TreeNodeItem[] = [];
  public get imodel() { return iModelConnectionMock.object; }
  public getFilteredNodePaths = async () => [];
  public get onTreeNodeChanged() { return undefined; }
  public get rulesetId() { return ""; }
  public getNodeKey = () => ({ type: "testType", pathFromRoot: ["root"] });
  public getNodes = async () => this._nodes;
  public getNodesCount = async () => this._nodes.length;
  public loadHierarchy = async () => { return; };
  public dispose() {return; }
}

describe("Tree", () => {

  it("renders header and tree component", () => {
    const renderWrapper = render(<TreeComponent dataProvider={new EmptyTreeDataProvider()} />);
    const header = renderWrapper.getByTestId("tree-component-header");
    expect(header.innerHTML).to.be.equal(IModelApp.i18n.translate("SimpleViewer:components.tree"));
    expect(renderWrapper.container.querySelector(".components-controlledTree-loader")).to.not.be.empty;
  });

  describe("Tree content", () => {

    class DataProvider extends EmptyTreeDataProvider {
      protected _nodes: TreeNodeItem[] = [
        {
          id: "1",
          label: PropertyRecord.fromString("Node 1"),
        },
        {
          id: "2",
          label: PropertyRecord.fromString("Node 2"),
        },
      ];
    }

    before(() => {
      // note: this is needed for AutoSizer used by the Tree to
      // have non-zero size and render the virtualized list
      Object.defineProperties(HTMLElement.prototype, {
        offsetHeight: { get: () => 200 },
        offsetWidth: { get: () => 200 },
      });
    });

    after(() => {
      Object.defineProperties(HTMLElement.prototype, {
        offsetHeight: { get: () => 0 },
        offsetWidth: { get: () => 0 },
      });
    });

    it("renders 'no data' when data provider is empty", async () => {
      const renderWrapper = render(<TreeComponent dataProvider={new EmptyTreeDataProvider()} />);
      expect(renderWrapper.container.querySelector(".components-controlledTree-loader")).to.not.be.empty;
      const noDataLabel = await waitForElement(() => renderWrapper.getByText(IModelApp.i18n.translate("UiComponents:general.noData")));
      expect(noDataLabel).to.not.be.undefined;
    });

    it("renders all nodes from data provider when it's not empty", async () => {
      const renderWrapper = render(<TreeComponent dataProvider={new DataProvider()} />);
      expect(renderWrapper.container.querySelector(".components-controlledTree-loader")).to.not.be.empty;

      const nodes = await waitForElement(() => renderWrapper.getAllByTestId("tree-node"));
      expect(nodes.length).to.equal(2);
      expect(renderWrapper.getByText("Node 1")).to.not.be.undefined;
    });

  });

});
