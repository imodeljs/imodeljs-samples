# Zoom To Elements Sample

Copyright © Bentley Systems, Incorporated. All rights reserved.

An iModel.js sample application that demonstrates how to use the [Viewport.ZoomToElements](https://imodeljs.github.io/iModelJs-docs-output/reference/imodeljs-frontend/views/viewport/zoomtoelements/) API.  The API changes the camera so it is pointing at a specified set of elements.

[![Click to run the demo](./docs/try-it-now.png)](https://zoomtoelementssample.z13.web.core.windows.net/)

This is a 'frontend-only' sample.  It utilizes frontend-sample-base which supplies the viewport and view navigation tools. See http://imodeljs.org for comprehensive documentation on the iModel.js API and the various constructs used in this sample.

## Purpose

The purpose of this application is to demonstrate the following:

- Calling Viewport.ZoomToElement so the user can see a specified set of elements.
- Some of the available options such as: Animate, Margin, and View orientation.

![Screenshot of the application](./docs/overview.png)

## Development Setup

Follow the instructions under [Frontend Sample Development Setup](../../README.md#frontend-sample-development-setup) to configure, install dependencies, build, and run the app.

## Description

The Viewport.ZoomToElement is a commonly used API which directs the user's attention to a particular element or group of elements.  The method accepts options from the union of two options structures.  Those are [ZoomToOptions](https://imodeljs.github.io/iModelJs-docs-output/reference/imodeljs-frontend/views/zoomtooptions) and [ViewChangeOptions](https://imodeljs.github.io/iModelJs-docs-output/reference/imodeljs-frontend/views/viewchangeoptions).  See the documentation for the full list of options.

This sample allows the user to select one or more elements and add their ids to a simple list.  The list of ids is implemented as an array of strings because that is the form expected by the Viewport.ZoomToElement method.  The list is displayed in the UI by a simple [HTMLSelectElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLSelectElement).

## Contributing

[Contributing to iModel.js](https://github.com/imodeljs/imodeljs/blob/master/CONTRIBUTING.md)
