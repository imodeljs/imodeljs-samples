/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { expect } from "chai";
import { initialize, terminate, HierarchyBuilder} from "@bentley/presentation-testing";
import { IModelConnection } from "@bentley/imodeljs-frontend";

before(() => {
  initialize({ rulesetDirectories: ["assets/presentation_rules"] });
});

after(() => {
  terminate();
});

describe("Tree", () => {
  let imodel: IModelConnection;
  let builder: HierarchyBuilder;
  const imodelPath = "test/integration/test-data/Properties_60InstancesWithUrl2.ibim";

  beforeEach(async () => {
    imodel = await IModelConnection.openSnapshot(imodelPath);
    builder = new HierarchyBuilder(imodel);
  });

  afterEach(async () => {
    await imodel.closeSnapshot();
  });

  it("generates correct hierarchy for 'Default' ruleset", async () => {
    const hierarchy = await builder.createHierarchy("Default");
    expect(hierarchy).to.matchSnapshot();
  });

});
