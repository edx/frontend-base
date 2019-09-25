# API Reference

## Initialization Lifecycle Phases

The following lifecycle phases exist.  Their corresponding event constants are in parentheses.  The source code is in `src/handlers`.

Each lifecycle handler can be provided as an `async` function, or as a Promise, allowing asynchronous execution as necessary.  Note that the application will _wait_ for a phase to be complete before moving on to the next phase.

The corresponding event types are published immediately _after_ the lifecycle phase has completed.  Note that the events are published asynchronously using the [pubsub-js](https://github.com/mroderick/PubSubJS) "publish" method.

### beforeInit (`APP_BEFORE_INIT`)

The `beforeInit` phase has no default behavior.  It can be used to perform actions prior to any of the other phases, but after `App.initialize` has validated its environment configuration.  If you want to perform actions prior to validation of the environment configuration, then write your code before calling `App.initialize` itself.

### configuration (`APP_CONFIGURED`)

The `configuration` phase has no default behavior.

The `configuration` phase can be used to provide dynamic, runtime configuration prior to the initialization of any other services the application may need.

### logging (`APP_LOGGING_CONFIGURED`)

The `logging` phase initializes the NewRelicLoggingService from @edx/frontend-logging by default.

### authentication (`APP_AUTHENTICATED`)

The `authentication` phase creates an authenticated apiClient and makes it available at `App.apiClient` on the `App` singleton.  It also runs `ensureAuthenticatedUser` from @edx/frontend-auth and will redirect to the login experience if the user does not have a valid authentication cookie.  Finally, it will make authenticated user information available at `App.authenticatedUser` and `App.decodedAccessToken` for later use by the application.

### i18n (`APP_I18N_CONFIGURED`)

The `i18n` phase initializes @edx/frontend-i18n with the `messages` object provided to `App.initialize`.

### analytics (`APP_ANALYTICS_CONFIGURED`)

The `analytics` phase initializes Segment and configures @edx/frontend-analytics.

### beforeReady (`APP_BEFORE_READY`)

The `beforeReady` phase has no default behavior.

### ready (`APP_READY`)

The `ready` phase has no default behavior.  This is the phase where an application's interface would generally be shown to the user.

### error (`APP_ERROR`)

The `error` phase logs (to loggingService) whatever error occurred to put the app in an error state.  This is the phase where an application would generally show an error message for an unexpected error to the user.

Note that the error which caused the application to transition to the `error` phase is available at `App.error`.  It is also passed as data to any subscribers to the `APP_ERROR` event.

## `App`

The `App` class is a singleton with static methods.  This is so that it can be used throughout a consuming application merely by importing it:

```
import { App } from '@edx/frontend-base';
```

`App` provides a few different methods and properties:

### `App.history`

The application's browser history object.  See the [history documentation](https://github.com/ReactTraining/history/blob/master/docs/GettingStarted.md) for more information.

### `App.authenticatedUser`

A reference to an object containing information about the currently authenticated user.

```
{
  userId: <AUTHENTICATED USER's USER ID>,
  username: <AUTHENTICATED USER's USERNAME>,
  roles: [<ROLE ONE>, <ROLE TWO>],
  administrator: <true|false>,
}
```
### `App.decodedAccessToken`

A reference to an object containing the raw, decoded JWT access token.  This is the snake_case source for the data in `App.authenticatedUser`.

### `App.error`

An error object caught by `App.initialize` if an error occurred during initialization.  Useful for error handlers.  Note: This is not populated for errors outside of application initialization.  It's merely a convenience to allow `APP_ERROR` subscribers and `error` overrideHandlers to access the error that put the application in the error phase.

### `App.initialize({ messages, loggingService, overrideHandlers, custom })`

The `App.initialize` method takes an options object with four possible keys:

#### messages

A frontend-i18n-compatible messages object, or an array of such objects.  If an array is provided, duplicate keys are resolved with the last-one-in winning.

#### loggingService

The logging service to be used by @edx/frontend-logging.  It defaults to `NewRelicLoggingService`.

#### overrideHandlers

An optional object of `overrideHandlers` which can be used to replace the default behavior of any part of the startup sequence.  It can also be used to add additional initialization behavior before or after the rest of the sequence.

An example in which we override the authentication handling:

```
App.initialize({
  overrideHandlers: {
    authentication: () => {
      // As a usage example of overriding one phase of the startup sequence,
      // providing this function will override the default authentication
      // initialization.
    }
  }
});
```

`overrideHandlers` has keys corresponding to the eight lifecycle events.  Including a key will override and replace the corresponding lifecycle handler if provided.  Please see Initialization Lifecycle Phases for more information on the phases responsibilities.

#### custom

The `custom` property can be used to attach custom data to the `App` which will be exposed at `App.custom`.  This data can be used in custom initialization handlers, or elsewhere in the application as necessary.  Note, if you're using this to provide mutable data to the application, _strongly_ consider using React props, context, or Redux instead.

### `App.config`

The environment configuration.  Contains the following keys:

- ACCESS_TOKEN_COOKIE_NAME
- BASE_URL
- CREDENTIALS_BASE_URL
- CSRF_COOKIE_NAME
- CSRF_TOKEN_API_PATH
- ECOMMERCE_BASE_URL
- ENVIRONMENT
- LANGUAGE_PREFERENCE_COOKIE_NAME
- LMS_BASE_URL
- LOGIN_URL
- LOGOUT_URL
- MARKETING_SITE_BASE_URL
- ORDER_HISTORY_URL
- REFRESH_ACCESS_TOKEN_ENDPOINT
- SECURE_COOKIES
- SEGMENT_KEY
- SITE_NAME
- USER_INFO_COOKIE_NAME

If additional, dynamic config is desired, it would be reasonable to add those keys into `App.config`.

### `App.apiClient`

A reference to the @edx/frontend-auth authenticated API Client.

### `App.subscribe(type, callback)`

A method allowing consumers of `App` to subscribe to lifecycle events.  `type` is an event type, as documented in "Initialization Lifecycle Phases".  There are constants for all the event types:

```
import {
  APP_BEFORE_INIT, APP_CONFIGURED, APP_AUTHENTICATED, APP_I18N_CONFIGURED, APP_LOGGING_CONFIGURED, APP_ANALYTICS_CONFIGURED, APP_BEFORE_READY, APP_READY, APP_ERROR
} from `@edx/frontend-base`
```

### `App.requireConfig(keys, requester)`

A method allowing application code to indicate that particular `App.config` keys are required for them to function.  The method returns the required config values.

```
const config = App.requireConfig(['LMS_BASE_URL', 'LOGIN_URL'], 'The name of my feature/component');
```

**NOTE**: If you use App.requireConfig to require config that hasn't been loaded yet (i.e., from a custom `configuration` handler), it will throw an error.  If you use a custom `configuration` handler, you can defer requiring your config by subscribing to the `APP_CONFIGURED` event:

```
let config = null;
App.subscribe(APP_CONFIGURED, () => {
  config = App.requireConfig(['DYNAMICALLY_CONFIGURED_URL'], 'Consumer of custom config');

  // config is known to be set here.
});

export function usesConfig() {
  /* If this function is not used before APP_CONFIGURED, then this is safe usage.
   * If you expect your method may be used before APP_CONFIGURED, then you have a
   * more complex setup.  That sort of thing should be very uncommon.
   */
  console.log(config.DYNAMICALLY_CONFIGURED_URL);
}
```

Environment variable-based config is immediately available on file load, so generally waiting for APP_CONFIGURED is not necessary.

### `App.queryParams`

A method which converts the current query string into an object of key-value pairs and returns it.  It is memoized based on the current query string for efficiency.


## `AppProvider`

`AppProvider` is a wrapper component for React-based micro-frontends to initialize a number of common data/context providers.

```
import { App, AppProvider, APP_READY } from '@edx/frontend-base';

App.subscribe(APP_READY, () => {
  ReactDOM.render(
    <AppProvider>
      <HelloWorld />
    </AppProvider>
  )
});
```

This will provide the following to HelloWorld:

- An error boundary as described above.
- An `AppContext` provider for React context data.
- IntlProvider for @edx/frontend-i18n internationalization
- Optionally a redux `Provider`.  Will only be included if a `store` property is passed to `AppProvider`.
- A `Router` for react-router.

## `AppContext``

`AppContext` provides data from `App` in a way that React components can readily consume, even if it's mutable data.  `AppContext` contains the following data structure:

```
{
  authenticatedUser: <THE App.authenticatedUser OBJECT>,
  config: <THE App.config OBJECT>
}
```

While the only data in `AppContext` today is data that would generally become stable/unchanging prior to `APP_READY` (meaning before React even renders for the first time), using `AppContext` is a preferrable way to access it in React components as it leaves the door open for that data to become mutable in the future.  You could imagine an in-app login experience which updates authenticatedUser after React mounts, for instance, or loading config data dynamically based on user actions.

`AppContext` is used in a React application like any other [React Context](https://reactjs.org/docs/context.html)

## `validateConfig`

The `validateConfig` function is a helper for application code to validate their own environment configuration variables.  Provided a configuration document, it will throw an error if any of the keys are `undefined`:

```
import { validateConfig } from '@edx/frontend-base';

const customConfig = {
  MY_URL: process.env.MY_URL,
}

validateConfig(customConfig);
```

An exception will be thrown if any of the keys in `customConfig` are `undefined`.

## `fetchUserAccount`

The `fetchUserAccount` action is a wrapper around @edx/frontend-auth's own `fetchUserAccount` action which makes it a bit easier to use.  Normally `fetchUserAccount` requires creating a UserAccountApiService with an API client prior to calling it - @edx/frontend-base's version hides that requirement from the user and uses the API client created by `App.initialize`.

```
import { fetchUserAccount, AppContext } from '@edx/frontend-base';

class MyComponent extends React.Component {
  componentDidMount() {
    const username = this.context.authenticatedUser.username;
    this.props.fetchUserAccount(username);
  }
}

export default connect(null, {
  fetchUserAccount,
})(MyComponent);

MyComponent.contextType = AppContext;
