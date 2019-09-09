# Implementing OIDC Sign-In

To access iModelHub services consumers need an access token. The token may be acquired through an OIDC sign-in process whose implementation is described below.

## Implementation

OIDC sign-in implementation consists of 3 parts:

- OidcBrowserClient wrapper component that wraps `oidc-client` package and acts as a helper.

- Application-wide `OidcBrowserClient` instance created in `IModelApp.onStartup()` callback (*see [SimpleViewerApp.ts](../src/frontend/api/SimpleViewerApp.ts)*):
  ```ts
  this._oidcClient = new OidcBrowserClient();
  ```

- Changes in React component (*see [App.tsx](../src/frontend/components/App.tsx)*):

  1. Add sign-in state into component's state in component's constructor. `OidcClient` created in previous step can be used to get initial values:
  ```ts
  this.state = {
    user: {
      isLoading: SimpleViewerApp.oidcClient.isLoading,
      accessToken: SimpleViewerApp.oidcClient.accessToken,
    },
  };
  ```

  2. Subscribe for `onUserStateChanged` callback in `componentDidMount`:
  ```ts
  SimpleViewerApp.oidcClient.onUserStateChanged.addListener(this._onUserStateChanged);
  ```

  3. Unsubscribe from `onUserStateChanged` callback in `componentWillUnmount`:
  ```ts
  SimpleViewerApp.oidcClient.onUserStateChanged.removeListener(this._onUserStateChanged);
  ```

  4. Implement the `onUserStateChanged` event handler to update component state:
  ```ts
  private _onUserStateChanged = (accessToken: AccessToken | undefined) => {
    this.setState((prev) => ({ user: { ...prev.user, accessToken } }));
  }
  ```

  5. In the component's `render` callback, if we don't have an access token, we want to show either a sign-in dialog or report the sign-in process. To initiate the sign-in process, `OidcClient.signIn()` should be called.
  ```ts
  if (this.state.user.isLoading) {
    ui = `${IModelApp.i18n.translate("SimpleViewer:signing-in")}...`;
  } else if (!this.state.user.accessToken) {
    ui = (<SignIn onSignIn={() => SimpleViewerApp.oidcClient.signIn(new ActivityLoggingContext(Guid.createValue()))} />);
  } else {
    // user is logged in, render application UI
  }
  ```
