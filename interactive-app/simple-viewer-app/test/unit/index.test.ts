/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import * as typemoq from "typemoq";
import { IModelApp, NoRenderApp } from "@bentley/imodeljs-frontend";
import { UiCore } from "@bentley/ui-core";
import { UiComponents } from "@bentley/ui-components";
import { cleanup } from "@testing-library/react";
import { Presentation, SelectionManager } from "@bentley/presentation-frontend";
import { SelectionScopesManager } from "@bentley/presentation-frontend/lib/selection/SelectionScopesManager";
import { I18NOptions } from "@bentley/imodeljs-i18n";

function supplyI18NOptions(): I18NOptions {
  return { urlTemplate: `${window.location.origin}/locales/{{lng}}/{{ns}}.json` };
}

before(async () => {
  NoRenderApp.startup({ i18n: supplyI18NOptions() });

  await UiCore.initialize(IModelApp.i18n);
  await UiComponents.initialize(IModelApp.i18n);
  Presentation.initialize();

  // Presentation.selection needs to be set, because WithUnifiedSelection requires a SelectionHandler.
  // If selection handler is not provided through props, the HOC creates a new SelectionHandler by
  // using Presentation.selection
  Presentation.selection = new SelectionManager({ scopes: typemoq.Mock.ofType<SelectionScopesManager>().object });
});

after(() => {
  UiCore.terminate();
  UiComponents.terminate();
});

afterEach(() => {
  cleanup();
});
