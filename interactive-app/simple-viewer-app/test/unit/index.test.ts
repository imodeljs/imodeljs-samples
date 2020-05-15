/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import * as typemoq from "typemoq";
import { IModelApp, NoRenderApp } from "@bentley/imodeljs-frontend";
import { UiCore } from "@bentley/ui-core";
import { UiComponents } from "@bentley/ui-components";
import { cleanup } from "@testing-library/react";
import { Presentation, SelectionManager, SelectionScopesManager } from "@bentley/presentation-frontend";
import { I18NOptions } from "@bentley/imodeljs-i18n";

function supplyI18NOptions(): I18NOptions {
  return { urlTemplate: `${window.location.origin}/locales/{{lng}}/{{ns}}.json` };
}

before(async () => {
  await NoRenderApp.startup({ i18n: supplyI18NOptions() });

  await UiComponents.initialize(IModelApp.i18n);
  await Presentation.initialize();

  // Presentation.selection needs to be set, because WithUnifiedSelection requires a SelectionHandler.
  // If selection handler is not provided through props, the HOC creates a new SelectionHandler by
  // using Presentation.selection
  Presentation.setSelectionManager(new SelectionManager({ scopes: typemoq.Mock.ofType<SelectionScopesManager>().object }));
});

after(() => {
  UiCore.terminate();
  UiComponents.terminate();
});

afterEach(() => {
  cleanup();
});
