/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { Id64String, Id64Set, Id64 } from "@bentley/bentleyjs-core";
import { SubCategoryAppearance, CategoryProps, CodeScopeSpec, CodeSpec, ColorDef, IModel, InformationPartitionElementProps, DbResult, IModelVersion } from "@bentley/imodeljs-common";
import { IModelDb, PhysicalModel, PhysicalElement, PhysicalPartition, SpatialCategory, OpenParams, Element, ECSqlStatement, ConcurrencyControl } from "@bentley/imodeljs-backend";
import { AuthorizedClientRequestContext } from "@bentley/imodeljs-clients";
import * as crypto from "crypto";

/** Injectable handles for opening IModels andStatic functions to create Models, CodeSecs, Categories, Category Selector, Styles, and View Definitions */
export class IModelDbHandler {
  public constructor() { }

  public async openLatestIModelDb(authContext: AuthorizedClientRequestContext, projectId: string, iModelId: string,
    openParams: OpenParams = OpenParams.pullAndPush(), iModelVersion: IModelVersion = IModelVersion.latest()): Promise<IModelDb> {
    const briefcase = await IModelDb.open(authContext, projectId!, iModelId!, openParams, iModelVersion);
    briefcase.concurrencyControl.setPolicy(new ConcurrencyControl.OptimisticPolicy());
    return briefcase;
  }
  public async deletePhysModelElements(iModelDb: IModelDb, modelId: Id64String, authContext: AuthorizedClientRequestContext): Promise<boolean> {
    const elements = this.getPhysElementsFromModel(iModelDb, modelId);
    for (const element of elements) {
      iModelDb.elements.deleteElement(element.id);
    }
    await iModelDb.concurrencyControl.request(authContext);
    iModelDb.saveChanges("Cleaned out elements from physical model");
    return elements.length > 0;
  }

  public getPhysModel(iModelDb: IModelDb, codeValue: string): Id64String | undefined {
    try {
      const idSet = iModelDb.withPreparedStatement(`SELECT ECInstanceId AS id FROM BisCore:PhysicalModel`,
        (stmt: ECSqlStatement) => {
          const ids: Id64Set = new Set<string>();
          while (stmt.step() === DbResult.BE_SQLITE_ROW)
            ids.add(stmt.getValue(0).getId());
          return ids;
        });
      for (const id of idSet.values()) {
        if (iModelDb.models.getModel(id).name === codeValue)
          return id;
      }
    } catch (error) {
    }
    return undefined;
  }
  public getPhysElementsFromModel(iModelDb: IModelDb, modelId: Id64String): Element[] {
    const elements: Element[] = [];
    try {
      for (const eidStr of iModelDb.queryEntityIds({ from: PhysicalElement.classFullName, where: `Model.Id=${modelId}` })) {
        const element = iModelDb.elements.getElement(eidStr);
        elements.push(element);
      }
    } catch (error) {
    }
    return elements;
  }
  public getSpatialCategory(iModelDb: IModelDb, codeName: string): Element | undefined {
    try {
      for (const eidStr of iModelDb.queryEntityIds({ from: SpatialCategory.classFullName, where: `CodeValue='${codeName}'` })) {
        const element = iModelDb.elements.getElement(eidStr);
        return element;
      }
    } catch { }
    return undefined;
  }
  /** Insert a PhysicalModel */
  public insertChangeSetUtilPhysicalModel(iModelDb: IModelDb, codeName: string): Id64String {
    const partitionProps: InformationPartitionElementProps = {
      classFullName: PhysicalPartition.classFullName,
      model: IModel.repositoryModelId,
      parent: {
        id: IModel.rootSubjectId,
        relClassName: "BisCore:SubjectOwnsPartitionElements",
      },
      code: PhysicalPartition.createCode(iModelDb, IModel.rootSubjectId, codeName),
    };
    const partitionId: Id64String = iModelDb.elements.insertElement(partitionProps);
    const model: PhysicalModel = iModelDb.models.createModel({
      classFullName: PhysicalModel.classFullName,
      modeledElement: { id: partitionId },
    }) as PhysicalModel;
    const modelId = iModelDb.models.insertModel(model);
    return modelId;
  }
  /** Insert a SpatialCategory */
  public insertSpatialCategory(iModelDb: IModelDb, modelId: Id64String, name: string, color: ColorDef): Id64String {
    const categoryProps: CategoryProps = {
      classFullName: SpatialCategory.classFullName,
      model: modelId,
      code: SpatialCategory.createCode(iModelDb, modelId, name),
      isPrivate: false,
    };
    const categoryId: Id64String = iModelDb.elements.insertElement(categoryProps);
    const category: SpatialCategory = iModelDb.elements.getElement(categoryId) as SpatialCategory;
    category.setDefaultAppearance(new SubCategoryAppearance({ color }));
    iModelDb.elements.updateElement(category);
    return categoryId;
  }
  public insertCodeSpec(iModelDb: IModelDb, name: string, scopeType: CodeScopeSpec.Type): Id64String {
    const codeSpec = new CodeSpec(iModelDb, Id64.fromUint32Pair(crypto.randomBytes(4).readUInt32BE(0, true), crypto.randomBytes(4).readUInt32BE(0, true)), name, scopeType);
    iModelDb.codeSpecs.insert(codeSpec);
    return codeSpec.id;
  }
  public getCodeSpecByName(iModelDb: IModelDb, codeSpecName: string): CodeSpec | undefined {
    try {
      const codeSpec = iModelDb.codeSpecs.getByName(codeSpecName);
      return codeSpec;
    } catch  { }
    return undefined;
  }
}
