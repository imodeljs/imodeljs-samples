# Basic Viewport App

Copyright © 2019 Bentley Systems, Incorporated. All rights reserved.

An iModel.js sample application that demonstrates the minimum setup for opening an iModel and viewing its graphics in a viewport with basic viewing tools.

* _Viewport_: Renders geometric data onto an HTMLCanvasElement.
* _Toolbar_: Includes basic viewport tools in top-right corner of viewport (select, fit, rotate, pan, zoom).

This app serves as a guide on how you can embed one or more of these components into your own application.
See http://imodeljs.org for comprehensive documentation on the iModel.js API and the various constructs used in this sample.

## Purpose

The purpose of this application is to demonstrate the following:

* [Dependencies](./package.json) required for iModel.js-based frontend applications.
* [Scripts](./package.json) recommended to build and run iModel.js-based applications.
* How to set up a simple [backend for web](./src/backend/BackendServer.ts) and
* How to set up a simple [frontend for web](./src/frontend/api/BasicViewportApp.ts).
* How to [implement OIDC sign-in](./docs/oidc.md) to get access to iModels on iModelHub.
* How to [consume](./src/frontend/components/App.tsx) iModel.js React components.
* How to [setup a viewport](./src/frontend/components/App.tsx#L106).
* How to include
  [tools](./src/frontend/components/Toolbar.tsx) in a
  [viewport](./src/frontend/components/App.tsx#L205).

## Development Setup

Follow the [App Development Setup](../../README.md) section under Sample Interactive Apps to configure, install dependencies, build, and run the app.

## Contributing

[Contributing to iModel.js](https://github.com/imodeljs/imodeljs/blob/master/CONTRIBUTING.md)
