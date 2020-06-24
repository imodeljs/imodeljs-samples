# iModel.js Samples

Copyright © Bentley Systems, Incorporated. All rights reserved.

The [iModel.js](http://imodeljs.org) library is an open source platform for creating, querying, modifying, and displaying iModels.  This repository contains sample code walking through the iModel.js API.

If you have questions, or wish to contribute to the iModel.js samples, see our [Contributing guide](./CONTRIBUTING.md).

## Overview of Repo

[![Build Status](https://dev.azure.com/imodeljs/imodeljs/_apis/build/status/iModel.js%20Samples?branchName=master)](https://dev.azure.com/imodeljs/imodeljs/_build/latest?definitionId=8&branchName=master)

This GitHub repo contains a (growing) collection of sample apps that demonstrate various implementations using iModel.js.  To handle managing and building all of the samples, it is built using [Rush](http://rushjs.io/).

Each of the samples are self-contained and, as such, can be copied out of the cloned source tree and built independently.  These samples are intended to serve as training material and all submissions are welcome and encouraged.  The samples are organized in sub-folders according to the type of app:  

1. [agent-app](#sample-agent-apps)

    Start here to create a new agent.  This folder contains a collection of backend agent apps.  These are suitable to be copied and used as a template to produce a new agent application.

2. [interactive-app](#sample-interactive-apps)

    Start here to create a new web, desktop, or mobile app.  This folder contains a collection of sample apps which include both the frontend and backend.  These are suitable to be copied and used as a template to produce a new interactive application.

3. [tools](#sample-tools)

    A collection of tools that assist in the creation of these samples or provide value to testing the samples.

To run these samples, you need to first get the [required tools](https://imodeljs.org/getting-started/#1-get-the-tools) and ensure you have _Node.js 12.x LTS_ installed on your machine.

## Prerequisites

* [Git](https://git-scm.com/)
* [Node](https://nodejs.org/en/): an installation of the latest security patch of Node 10 or 12. The Node installation also includes the **npm** package manager.
* [Rush](https://github.com/Microsoft/web-build-tools/wiki/Rush): to install `npm install -g @microsoft/rush`
* [TypeScript](https://www.typescriptlang.org/): this is listed as a devDependency, so if you're building it from source, you will get it with `rush install`.
* [Visual Studio Code](https://code.visualstudio.com/): an optional dependency, but the repository structure is optimized for its use

> See [supported platforms](https://www.imodeljs.org/learning/supportedplatforms/) for further information.

## Sample Agent Apps

1. [Query Agent](./agent-app/query-agent/README.md)

    Provides an example of an [agent](https://imodeljs.org/learning/app/#imodel-agents) that illustrates use of the iModel.js API to listen and query changes made to iModels on the iModelHub. A separate optional [imodel-changeset-test-utility](./tools/imodel-changeset-test-utility/README.md) can be used to generate sample change sets that can then be consumed by this sample.

### Agent Development Setup

1. (Optional) Create a sample project using the procedure at [Developer Registration](https://imodeljs.org/getting-started/registration-dashboard/?tab=1).  This step is not needed if you already have a project to test with.

2. (Required) Register your application at [Developer Registration](https://www.imodeljs.org/getting-started/registration-dashboard?tab=0&create=AGENT_APP). For more information, see the section on [authorization](https://imodeljs.org/learning/common/accesstoken/).

3. (Required) Add your agent's identity email as a project participant on your project. Edit your [sample project](https://imodeljs.org/getting-started/registration-dashboard/?tab=1) and add `{client_id}@apps.imsoidc.bentley.com` as a project participant. If adding the user does not work at first, please wait a few minutes. The identity user is being created in the background, this can take up to ten minutes.

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

1. (Optional) Create a sample project using the procedure at [Developer Registration](https://www.imodeljs.org/getting-started/registration-dashboard/?tab=1).  This step is not needed if you already have a project to test with.

2. (Recommended) Register your application at [Developer Registration](https://www.imodeljs.org/getting-started/registration-dashboard/?tab=0).

    For the purpose of running a sample on localhost, ensure your *SPA* app registration includes http://localhost:3000/signin-callback as a valid redirect URI. The client ID should start with spa-.

    If you would like to run a sample in Electron, create a *Desktop* app registration with http://localhost:3000/signin-callback as a valid redirect URI. The client ID should start with native-.

    Note: If you are just testing on localhost you can use the default registration included in the sample. However, it's recommended that you complete the registration, especially since registration is a requirement before the application can be deployed. For more information, see the section on [authorization](https://imodeljs.org/learning/common/accesstoken/).

3. Configure your app using the values you obtained from the registration process.  In the interactive-app subfolder, edit the `.env.local` file.

4. Follow the [steps](#building-samples) to build the samples.

5. a. Web App - There are two servers, a web server that delivers the static web resources (the frontend Javascript, localizable strings, fonts, cursors, etc.), and the backend RPC server that opens the iModel on behalf of the application. Start them both running locally:

    ```sh
    cd [sample app subfolder]
    npm run start:servers
    ```

    b. Electron App

     ```sh
     npm run start:electron
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
    node ./common/scripts/install-run-rush install
    ```

2. Build a single application (replace app-name):

    ```sh
    node ./common/scripts/install-run-rush build --to app-name
    ```

## Unit tests

Run with `node ./common/scripts/install-run-rush test`

## Integration tests

Run with `node ./common/scripts/install-run-rush test:integration`

The integration tests require all configuration variables to be set either in each app's [`Config.App`](https://www.imodeljs.org/reference/bentleyjs-core/configuration/config/) object or as environment variables. The full list of variables required by the integration test are:

*Interactive Apps*

| Variable | Description |
| - | - |
| imjs_test_regular_user_name | The user who should sign in during the test |
| imjs_test_regular_user_password | The user's password |
| imjs_browser_test_client_id | The OIDC client id of the registered app.  Used for Simple Viewer App tests |
| imjs_test_project | A CONNECT Project that the user is member of.  Defaults to the iModel name if not set.  |
| imjs_test_imodel | The iModel in the above Project to use for tests.  When using a project created through the developer registration dashboard, the iModel name is the same as the project name |

*Agent Apps*

| Variable | Description |
| - | - |
| imjs_agent_client_id | The OIDC client id for an agent.  Used for the iModel Changeset Utility |
| imjs_agent_client_secret | The OIDC client secret for the above agent_client_id.  Used for the iModel Changeset Utility |
| imjs_agent_scope | The OIDC scopes for the above agent_client_id.  Used for the iModel Changeset Utility |
| imjs_agent_project_name | A CONNECT Project the above client ID is member of.  Defaults to the iModel name if not set. |
| imjs_agent_imodel_name | The iModel in the above Project to use for tests.  When using a project created through the developer registration dashboard, the iModel name is the same as the project name |

> All of the above variables can be setup on the registration pages on the [Getting Started](https://www.imodeljs.org/getting-started/) page.

> NOTE: The imjs_agent_client_id has to be added to the Project with the following email format, `{Client Id}@apps.imsoidc.bentley.com`.  This new user to the project can be added through the [Project registration dashboard](https://www.imodeljs.org/getting-started/registration-dashboard/?tab=1)
