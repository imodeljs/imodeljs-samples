/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { ChangesetGenerationConfig } from "./ChangesetGenerationConfig";
import { HubUtility } from "./HubUtility";
import { IModelDbHandler } from "./IModelDbHandler";
import { TestChangesetSequence } from "./TestChangesetSequence";
import { Id64String, Logger, assert, Guid } from "@bentley/bentleyjs-core";
import { IModelDb } from "@bentley/imodeljs-backend";
import { AccessToken, AuthorizedClientRequestContext } from "@bentley/imodeljs-clients";
import { YawPitchRollAngles, Point3d, Box, Vector3d } from "@bentley/geometry-core";
import { GeometryStreamBuilder, GeometryStreamProps, IModelVersion, GeometricElement3dProps, Code } from "@bentley/imodeljs-common";

/** Sleep for ms */
const pause = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
/** Class to Save and Push CRUD operations for Elements in the IModelDb
 *  - Periodically creates changesets over GeometricElement3d's
 *    - Each Changeset consists of:
 *      - Creates N blocks in a horizontal level
 *      - Deletes And Updates N/2 blocks if a past level exists.
 *          -Updates change the label and geometry for the blocks
 *    - If N % 2 == 0 creates a named version for the changeset
 */
export class ChangesetGenerator {
  private _currentLevel: number = 0;
  private _iModelDb?: IModelDb;
  private _codeSeed: number = Date.now();
  private _updateIds?: Id64String[];
  private _deleteIds?: Id64String[];
  private _authCtx: AuthorizedClientRequestContext;
  // Only writes to and updates iModelDb. Not responsible for opening or deleting it
  public constructor(private _accessToken: AccessToken, private _hubUtility: HubUtility,
    private _physicalModelId: Id64String, private _categoryId: Id64String, private _codeSpecId: Id64String,
    private _iModelDbHandler: IModelDbHandler = new IModelDbHandler()) {
    this._authCtx = new AuthorizedClientRequestContext(this._accessToken);
    Logger.logTrace(ChangesetGenerationConfig.loggingCategory, "Initialized Changeset Generator");
    Logger.logTrace(ChangesetGenerationConfig.loggingCategory, "--------------------------------------------------------------------------------------------");
  }
  public async pushFirstChangeSetTransaction(iModelDb: IModelDb): Promise<void> {
    this._iModelDb = iModelDb;
    this.insertElement(`${Guid.createValue()}`, `FIRST ELEMENT: ${Guid.createValue()}`, new Point3d(-1000, -1000, -10000 * Math.random()));
    await this._iModelDb.concurrencyControl.request(this._authCtx);
    this._iModelDb.saveChanges("Pushed First Change");
  }
  /** Pushes new change sets to the Hub periodically and sets up named versions */
  public async pushTestChangeSetsAndVersions(projectId: string, iModelId: string, testChangesetSequence: TestChangesetSequence): Promise<boolean> {
    this._iModelDb = await this._iModelDbHandler.openLatestIModelDb(this._authCtx, projectId, iModelId);
    const untilLevel = this._currentLevel + testChangesetSequence.changesetCount;
    while (this._currentLevel < untilLevel) {
      try {
        const insertedIds = await this.createTestChangeSet(testChangesetSequence);
        this._updateIds = insertedIds.slice(0, testChangesetSequence.elementsUpdatedPerChangeset);
        this._deleteIds = insertedIds.slice(insertedIds.length - testChangesetSequence.elementsDeletedPerChangeset, insertedIds.length);
        await this.pushTestChangeSet(testChangesetSequence);

        // Push a named version for every other change set
        if (this._currentLevel % 2 === 0)
          await this.createNamedVersion(iModelId);

        this._currentLevel++;
        Logger.logTrace(ChangesetGenerationConfig.loggingCategory, `Sleeping for ${testChangesetSequence.changesetPushDelay} ms...`);
        await pause(testChangesetSequence.changesetPushDelay);
      } catch (error) {
        Logger.logError(ChangesetGenerationConfig.loggingCategory, `Error pushing changeset: ${error}`);
      }
    }
    this._updateIds = [];
    this._deleteIds = [];
    return true;
  }
  private async createTestChangeSet(testChangesetSequence: TestChangesetSequence): Promise<Id64String[]> {
    const insertedIds: Id64String[] = [];
    for (let i = 0; i < testChangesetSequence.elementsCreatedPerChangeset; i++)
      insertedIds.push(this.insertTestElement(this._currentLevel, i));
    await this._iModelDb!.concurrencyControl.request(this._authCtx);
    this._iModelDb!.saveChanges(`Inserted ${testChangesetSequence.elementsCreatedPerChangeset} elements into level ${this._currentLevel}`);
    if (this._currentLevel > 0) {
      let i = 0;
      for (const updateId of this._updateIds!) {
        this.updateTestElement(this._currentLevel - 1, i, updateId);
        i++;
      }
      await this._iModelDb!.concurrencyControl.request(this._authCtx);
      this._iModelDb!.saveChanges(`Updated ${testChangesetSequence.elementsUpdatedPerChangeset} elements in level ${this._currentLevel - 1}`);

      for (const deleteId of this._deleteIds!)
        this.deleteTestElement(deleteId);
      await this._iModelDb!.concurrencyControl.request(this._authCtx);
      this._iModelDb!.saveChanges(`Deleted ${testChangesetSequence.elementsDeletedPerChangeset} elements in level ${this._currentLevel - 1}`);
    }
    return insertedIds;
  }
  private async pushTestChangeSet(testChangesetSequence: TestChangesetSequence) {
    const description = ChangesetGenerator._getChangeSetDescription(this._currentLevel, testChangesetSequence);
    Logger.logTrace(ChangesetGenerationConfig.loggingCategory, `Pushing change set "${description}" to the Hub`);
    await this._iModelDb!.concurrencyControl.request(this._authCtx);
    this._iModelDb!.saveChanges("Pushed First Change");
    await this._iModelDb!.pullAndMergeChanges(this._authCtx, IModelVersion.latest());
    await this._iModelDb!.pushChanges(this._authCtx, () => description);
  }

  private async createNamedVersion(iModelId: string) {
    const name = ChangesetGenerator._getVersionName(this._currentLevel);
    const description = ChangesetGenerator._getVersionDescription(this._currentLevel);
    assert(await this._hubUtility.createNamedVersion(this._authCtx, iModelId, name, description) !== undefined);
  }

  private insertTestElement(level: number, block: number): Id64String {
    const name = ChangesetGenerator._getElementName(level, block);
    const userLabel = ChangesetGenerator._getElementUserLabel(level, block, "inserted");
    return this.insertElement(name, userLabel, ChangesetGenerator._getElementLocation(level, block), new Point3d(5, 5, 5));
  }

  private updateTestElement(level: number, block: number, eid: Id64String) {
    const userLabel = ChangesetGenerator._getElementUserLabel(level, block, "updated");
    this.updateElement(eid, userLabel, new Point3d(10, 10, 10));
  }

  private deleteTestElement(eid: Id64String) {
    this._iModelDb!.elements.deleteElement(eid);
  }
  private insertElement(name: string, userLabel: string, location: Point3d, size: Point3d = new Point3d(5, 5, 5)): Id64String {
    const testElementProps: GeometricElement3dProps = {
      classFullName: "Generic:PhysicalObject",
      model: this._physicalModelId!,
      category: this._categoryId!,
      code: this._createCode(name),
      placement: { origin: location, angles: new YawPitchRollAngles() },
      geom: ChangesetGenerator._createBox(size),
      userLabel,
    };
    return this._iModelDb!.elements.insertElement(testElementProps);
  }

  private updateElement(eid: Id64String, newUserLabel: string, newSize: Point3d = new Point3d(10, 10, 10)) {

    const element = this._iModelDb!.elements.getElement(eid);
    if (!element)
      throw new Error(`Element with name ${name} not found`);

    element.userLabel = newUserLabel;
    element.geom = ChangesetGenerator._createBox(newSize);

    this._iModelDb!.elements.updateElement(element);
  }

  private static _getElementLocation(level: number, block: number): Point3d {
    const x = block * 10;
    const y = level * 10;
    const z = 0;
    return new Point3d(x, y, z);
  }
  private static _getChangeSetDescription(level: number, testChangesetSequence: TestChangesetSequence) {
    if (level === 0)
      return `Inserted ${testChangesetSequence.elementsCreatedPerChangeset} elements on level: ${level}`;
    else
      return `Inserted ${testChangesetSequence.elementsCreatedPerChangeset} elements on level: ${level}, ` +
        `updated and deleted ${testChangesetSequence.elementsUpdatedPerChangeset} elements on level: ${level - 1}`;
  }
  private static _getElementName(level: number, block: number) {
    return `Element-${level}-${block}`;
  }

  private static _getElementUserLabel(level: number, block: number, suffix: string) {
    return `Element (${level}, ${block}) (${suffix})`;
  }

  private static _getVersionName(level: number) {
    return `Level ${level}: ${Date.now().toString()}`;
  }

  private static _getVersionDescription(level: number) {
    return `Named version for Level ${level}`;
  }
  private _createCode(name: string): Code {
    return new Code({
      spec: this._codeSpecId!,
      scope: this._physicalModelId!.toString(),
      value: name + this._codeSeed,
    });
  }
  /** Create a geometry stream containing a box */
  private static _createBox(size: Point3d): GeometryStreamProps {
    const geometryStreamBuilder = new GeometryStreamBuilder();
    geometryStreamBuilder.appendGeometry(Box.createDgnBox(
      Point3d.createZero(), Vector3d.unitX(), Vector3d.unitY(), new Point3d(0, 0, size.z),
      size.x, size.y, size.x, size.y, true,
    )!);
    return geometryStreamBuilder.geometryStream;
  }
}
