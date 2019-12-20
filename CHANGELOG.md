# Changelog

## 1.9.0 
The default response type for OIDC clients has changed in this repo. It now defaults to `responseType: "code"`. To use an implicit grant type client, the `OidcFrontendClientConfiguration` will need to be adjusted. SPA clients created on the [iModel.js registration dashboard](https://imodeljs.github.io/iModelJs-docs-output/getting-started/registration-dashboard/) are now created with grant type authorization_code.