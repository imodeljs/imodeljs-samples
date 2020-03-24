import { Id64String, Id64Array } from "@bentley/bentleyjs-core";
import { Code, IModel, ModelProps, ColorDef, ViewStateProps, ViewDefinition2dProps, SheetProps } from "@bentley/imodeljs-common";
import { ViewState, ViewState2d, IModelConnection, DrawingViewState, DrawingModelState, SectionDrawingModelState, SheetModelState, SheetViewState } from "@bentley/imodeljs-frontend";

  /** API for creating a 2D view from a model */
export class ViewCreator2d {

  constructor(private imodel: IModelConnection) {}

  public static drawingModelClasses = [DrawingModelState.classFullName, SectionDrawingModelState.classFullName];
  public static sheetModelClasses = [SheetModelState.classFullName];

  /** Create and return a view for a given 2D model */
  public async getViewForModel(model: ModelProps, vpAspect?: number): Promise<ViewState | undefined> {
    let viewState: ViewState2d | undefined;

    if (model.id) viewState = await this._createViewState2d(model.id, model.classFullName, vpAspect);
    if (viewState) await viewState.load();

    return viewState;
  }

  /** Create view from any 2D model type (Drawing/SectionDrawring/Sheet) */
  private async _createViewState2d(modelId: Id64String, modelType: string, vpAspect?: number): Promise<ViewState2d | undefined> {
    let viewState: ViewState2d | undefined;

    if (ViewCreator2d.drawingModelClasses.includes(modelType)) {
      const props = await this._createViewStateProps(modelId, ColorDef.white, vpAspect);
      viewState = (DrawingViewState.createFromProps(props, this.imodel) as ViewState2d);
    } else if (ViewCreator2d.sheetModelClasses.includes(modelType)) {
      let props = await this._createViewStateProps(modelId, ColorDef.white, vpAspect);
      props = await this._addSheetViewProps(modelId, props);
      viewState = (SheetViewState.createFromProps(props, this.imodel) as ViewState2d);
    }

    return viewState;
  }

  /** Create ViewStateProps for the model. ViewStateProps are composed of the 4 sets of Props below */
  private _createViewStateProps = async (modelId: Id64String, bgColor: ColorDef, vpAspect?: number): Promise<ViewStateProps> => {
    // Use dictionary model in all props
    const dictionaryId = IModel.dictionaryId;
    const categories = await this._getAllCategories();
    // model extents
    const modelRange: any = (await this.imodel.models.queryModelRanges(modelId))[0];
    let originX = modelRange.low[0];
    let originY = modelRange.low[1];
    let deltaX = modelRange.high[0] - originX;
    let deltaY = modelRange.high[1] - originY;

    // if vp aspect given, update model extents to fit view
    if (vpAspect) {
      const modelAspect = deltaY / deltaX;

      if (modelAspect > vpAspect) {
        const xFix = deltaY / vpAspect;
        originX = originX - xFix / 2;
        deltaX = deltaX + xFix;
      } else if (modelAspect < vpAspect) {
        const yFix = deltaX * vpAspect;
        originY = originY - yFix / 2;
        deltaY = deltaY + yFix;
      }
    }

    const modelSelectorProps = {
      models: [modelId],
      code: Code.createEmpty(),
      model: dictionaryId,
      classFullName: "BisCore:ModelSelector",
    };

    const categorySelectorProps = {
      categories,
      code: Code.createEmpty(),
      model: dictionaryId,
      classFullName: "BisCore:CategorySelector",
    };

    const viewDefinitionProps: ViewDefinition2dProps = {
      baseModelId: modelId,
      categorySelectorId: "",
      displayStyleId: "",
      origin: {x: originX, y: originY},
      delta: {x: deltaX, y: deltaY },
      angle: {radians: 0},
      code: Code.createEmpty(),
      model: dictionaryId,
      classFullName: "BisCore:ViewDefinition2d",
    };

    const displayStyleProps = {
      code: Code.createEmpty(),
      model: dictionaryId,
      classFullName: "BisCore:DisplayStyle",
      jsonProperties: {
        styles: {
          backgroundColor: bgColor,
        },
      },
    };
    const viewStateProps = { displayStyleProps, modelSelectorProps, categorySelectorProps, viewDefinitionProps };

    return viewStateProps;
  }

  private async _addSheetViewProps(modelId: Id64String, props: ViewStateProps) {

    const modelRange: any = (await this.imodel.models.queryModelRanges(modelId))[0];

    const sheetProps: SheetProps = {
      model: modelId,
      code: {spec: "", scope: ""},
      classFullName: "DrawingSheetModel",
      height: modelRange.high[1] - modelRange.low[1],
      width: modelRange.high[0] - modelRange.low[0],
    };

    props.sheetAttachments = await this._getSheetAttachments(modelId);
    props.sheetProps = sheetProps;

    return props;
  }

  private async _getAllCategories(): Promise<Id64Array> {
    // Only use categories with elements in them
    const allDrawingCategories = "SELECT ECInstanceId from BisCore.DrawingCategory";
    const categories = await this._executeQuery(allDrawingCategories);

    return categories;
  }

  private async _getSheetAttachments(modelId: string): Promise<string[]> {
    // Only use categories with elements in them
    const attachmentQuery = `SELECT ECInstanceId FROM Bis.ViewAttachment WHERE Model.Id = ${modelId}`;
    const attachements = await this._executeQuery(attachmentQuery);

    return attachements;
  }

  private _executeQuery = async (query: string) => {
    const rows = [];
    for await (const row of this.imodel.query(query))
      rows.push(row.id);

    return rows;
  }
}
