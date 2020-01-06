# iModel.js Samples

Copyright © Bentley Systems, Incorporated. All rights reserved.

The [iModel.js](http://imodeljs.org) library is an open source platform for creating, querying, modifying, and displaying iModels.  This repository contains sample code walking through the iModel.js API.

If you have questions, or wish to contribute to the iModel.js samples, see our [Contributing guide](./CONTRIBUTING.md).

## Overview of Repo

[![Build Status](https://dev.azure.com/imodeljs/imodeljs/_apis/build/status/iModel.js%20Samples?branchName=master)](https://dev.azure.com/imodeljs/imodeljs/_build/latest?definitionId=5&branchName=master)

This GitHub repo contains a (growing) collection of sample apps that demonstrate various implementations using iModel.js.  To handle managing and building all of the samples, it is built using [Rush](http://rushjs.io/).

Each of the samples are self-contained and, as such, can be copied out of the cloned source tree and built independently.  These samples are intended to serve as training material and all submissions are welcome and encouraged.  The samples are organized in sub-folders according to the type of app:  

1. [agent-app](#sample-agent-apps)

    Start here to create a new agent.  This folder contains a collection of backend agent apps.  These are suitable to be copied and used as a template to produce a new agent application.

2. [interactive-app](#sample-interactive-apps)

    Start here to create a new web, desktop, or mobile app.  This folder contains a collection of sample apps which include both the frontend and backend.  These are suitable to be copied and used as a template to produce a new interactive application.

3. [frontend-samples](#frontend-samples)
    
    Explore these samples to learn how to use specific APIs.  This folder contains a collection of small apps that each demonstrate a single frontend feature.  These are intended to isolate the relevant API calls.  Do *not* use as a template for a new application.

4. [tools](#sample-tools)

    A collection of tools.

To run these samples, you need to first get the [required tools](https://imodeljs.github.io/iModelJs-docs-output/getting-started/#1-get-the-tools) and ensure you have _Node.js 10.x LTS_ installed on your machine.

## Sample Agent Apps

1. [Query Agent](./agent-app/query-agent/README.md)

    Provides an example of an [agent](https://imodeljs.github.io/iModelJs-docs-output//learning/app/#imodel-agents) that illustrates use of the iModel.js API to listen and query changes made to iModels on the iModelHub. A separate optional [imodel-changeset-test-utility](./tools/imodel-changeset-test-utility/README.md) can be used to generate sample change sets that can then be consumed by this sample.

### Agent Development Setup

1. (Optional) Create a sample project using the procedure at [Developer Registration](https://imodeljs.github.io/iModelJs-docs-output/getting-started/registration-dashboard/?tab=1).  This step is not needed if you already have a project to test with.

2. (Required) Register your application at [Developer Registration](https://imodeljs.github.io/iModelJs-docs-output/getting-started/registration-dashboard/?tab=0). Select "Agent" from the app type dropdown. For more information, see the section on [authorization](https://imodeljs.github.io/iModelJs-docs-output/learning/common/accesstoken/).

3. (Required) Add your agent's identity email as a project participant on your project. Edit your [sample project](https://imodeljs.github.io/iModelJs-docs-output/getting-started/registration-dashboard/?tab=1) and add {client_id}@apps.imsoidc.bentley.com as a project particpant. If adding the user does not work at first, please wait a few minutes. The identity user is being created in the background, this can take up to ten minutes.

4. Configure your app using the values you obtained from the registration process. In the agent-app subfolder, edit the configuration values in src/QueryAgentConfig.ts.

5. Follow the [steps](#building-samples) to build the samples.

6. Start the agent with `npm start`.  See the Agent-specific README file for additional details.

## Sample Interactive Apps

1. [Basic Viewport App](./interactive-app/basic-viewport-app/README.md)

    Demonstrates the minimum setup for opening an iModel and viewing its graphics in a viewport with basic viewing tools.

2. [Simple Viewer App](./interactive-app/simple-viewer-app/README.md)

    Demonstrates opening an iModel and viewing its data using unified selection and is presented using a viewport, tree control, property grid, and table.

3. [Ninezone Sample App](./interactive-app/ninezone-sample-app/README.md)

    Demonstrates the Bentley 9-Zone UI layout pattern and opening an iModel and viewing its data.

### Interactive App Development Setup

1. (Optional) Create a sample project using the procedure at [Developer Registration](https://imodeljs.github.io/iModelJs-docs-output/getting-started/#developer-registration).  This step is not needed if you already have a project to test with.

2. (Recommended) Register your application at [Developer Registration](https://imodeljs.github.io/iModelJs-docs-output/getting-started/#developer-registration).

    For the purpose of running a sample on localhost, ensure your registration includes http://localhost:3000/signin-callback as a valid redirect URI.

    If you would like to run a sample in electron, another application should be registered which includes [electron://frontend/signin-callback]() as a valid redirect URI.

    Note: If you are just testing on localhost you can use the default registration included in the sample. However, it's recommended that you complete the registration, especially since registration is a requirement before the application can be deployed. For more information, see the section on [authorization](https://imodeljs.github.io/iModelJs-docs-output/learning/common/accesstoken/).

3. Configure your app using the values you obtained from the registration process.  In the interactive-app subfolder, edit src/common/config.json and src/common/configuration.ts.

4. Follow the [steps](#building-samples) to build the samples.

5. There are two servers, a web server that delivers the static web resources (the frontend Javascript, localizable strings, fonts, cursors, etc.), and the backend RPC server that opens the iModel on behalf of the application. Start them both running locally:

    ```sh
    cd [sample app subfolder]
    npm run start:servers
    ```

6. Open a web browser (e.g., Chrome or Edge), and browse to localhost:3000.

## Frontend Samples

1. [Viewer Only](./frontend-samples/viewer-only-sample/README.md)

    Stub to be used as a template for building feature specific samples. 

2. [Emphasize Elements](./frontend-samples/emphasize-elements-sample/README.md)

    Demonstrates emphasizing, hiding, isolating, and colorizing the display of element graphics.

3. [Heatmap Decorator](./frontend-samples/heatmap-decorator-sample/README.md)

    Demonstrates how to display heatmap graphics that overlay the iModel.

3. [Tooltip Customize](./frontend-samples/tooltip-customize-sample/README.md)

    Demonstrates how to change the contents of the element hover tooltip.

### Frontend Sample Development Setup

1. (Optional) Create a sample project using the procedure at [Developer Registration](https://imodeljs.github.io/iModelJs-docs-output/getting-started/#developer-registration).  This step is not needed if you already have a project to test with.

2. Configure your app using the values you obtained from the registration process.  In the specific sample subfolder, edit src/config.json to refer to the project and iModel.

3. Follow the [steps](#building-samples) to build the samples.

4. Start the webserver for the app locally:

    ```sh
    cd [sample app subfolder]
    npm run start
    ```

6. Open a web browser (e.g., Chrome or Edge), and browse to localhost:3000.

## Sample Tools

1. [iModel Changeset Test Utility](./tools/imodel-changeset-test-utility/README.md)

    Test utility for generating and pushing change sets to an iModel in the iModelHub. The utility creates change sets by inserting and updating geometric elements, and periodically pushes them to the iModelHub.

    This utility is meant to be used for testing sample applications like the [query-agent](./agent-app/query-agent/README.md).

### Tools Development Setup

Follow the [steps](#building-samples) to build the samples.

## Building Samples

1. Install the dependencies

    ```sh
    node ./common/scripts/install-run-rush update
    ```

2. Build all sample applications

    ```sh
    node ./common/scripts/install-run-rush build
    ```

    or to build a single application (replace app-name):

    ```sh
    node ./common/scripts/install-run-rush build --to app-name
    ```

## Unit tests

Run with `node ./common/scripts/install-run-rush test`

## Integration tests

Run with `node ./common/scripts/install-run-rush test:integration`

The integration tests require all configuration variables to be set either in each app's [`Config.App`](https://imodeljs.github.io/iModelJs-docs-output/reference/imodeljs-clients/config/config) object or as environment variables. The full list of variables required by the integration test are:

*Interactive Apps*

| Variable | Description |
| - | - |
| imjs_test_regular_user_name | The user who should sign in during the test |
| imjs_test_regular_user_password | The user's password |
| imjs_browser_test_client_id | The OIDC client id of the registered app.  Used for Simple Viewer App tests |
| imjs_test_project | A CONNECT Project that the user is member of |
| imjs_test_imodel | The iModel in the above Project to use for tests. |

*Agent Apps*

| Variable | Description |
| - | - |
| imjs_agent_client_id | The OIDC client id for an agent.  Used for the iModel Changeset Utility |
| imjs_agent_client_secret | The OIDC client secret for the above agent_client_id.  Used for the iModel Changeset Utility |
| imjs_agent_project_name | A CONNECT Project the above client ID is member of. |
| imjs_agent_imodel_name | The iModel in the above Project to use for tests. |

> All of the above variables can be setup on the registration pages on the [Getting Started](https://imodeljs.github.io/iModelJs-docs-output/getting-started/) page.

> NOTE: The imjs_agent_client_id has to be added to the Project with the following email format, `{Client Id}@apps.imsoidc.bentley.com`.  This new user to the project can be added through the [Project registration dashboard](https://imodeljs.github.io/iModelJs-docs-output/getting-started/registration-dashboard/?tab=1)
