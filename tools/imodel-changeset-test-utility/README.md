# imodel-changeset-test-utility

Copyright © 2019 Bentley Systems, Incorporated. All rights reserved.

Test utility for generating and pushing change sets to an iModel in the iModelHub. The utility creates change sets by inserting and updating geometric elements, and periodically pushes them to the iModelHub.

This utility is meant to be used for testing sample applications like the [imodel-query-agent](https://github.com/imodeljs/imodel-query-agent).

## Important note about registrations using iModel.js v0.191.0 and prior

**The authorization method of agent clients has been changed in versions >=0.192.0. Therefore all registrations using agent clients created before 0.192.0 have been invalidated. To continue using your app with versions >=0.192.0 please create a new agent registration [here](https://imodeljs.github.io/iModelJs-docs-output/getting-started/registration-dashboard/). (i.e. You will need a client_id that starts with service-xxxxxx if using iModel.js versions >=0.192.0.) The new registration process is easy, fully automated, and can be completed in minutes.**

## Development Setup

1. Get the registration details of the sample application you are testing - for example, if testing imodel-query-agent, see the section on development setup in [imodel-query-agent](https://github.com/imodeljs/imodel-query-agent/blob/master/README.md).

2. Edit [src/ChangesetGenerationConfig.ts](./src/ChangesetGenerationConfig.ts) to set the values you obtained after registration in step 1.

3. Install the dependencies with `npm install`

4. Build the source with `npm run build`

## Run Change Set Test Utility

* Run `npm start`. Watch the console for various messages that show the progress.

## Test

The utility includes some tests to validate it's behavior - these are useful for internal testing:

* Unit tests: `npm test`
* Integration tests: `npm run test:integration`

## Contributing

[Contributing to iModel.js](https://github.com/imodeljs/imodeljs/blob/master/CONTRIBUTING.md)
