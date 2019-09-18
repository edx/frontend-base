import PubSub from 'pubsub-js';
import memoize from 'lodash.memoize';
import pick from 'lodash.pick';

import getQueryParameters from './getQueryParameters';
import { defaultAuthenticatedUser } from './frontendAuthWrapper';
import * as handlers from './handlers';

export const APP_TOPIC = 'APP';
export const APP_BEFORE_INIT = `${APP_TOPIC}.BEFORE_INIT`;
export const APP_CONFIGURED = `${APP_TOPIC}.CONFIGURED`;
export const APP_AUTHENTICATED = `${APP_TOPIC}.AUTHENTICATED`;
export const APP_I18N_CONFIGURED = `${APP_TOPIC}.I18N_CONFIGURED`;
export const APP_LOGGING_CONFIGURED = `${APP_TOPIC}.LOGGING_CONFIGURED`;
export const APP_ANALYTICS_CONFIGURED = `${APP_TOPIC}.ANALYTICS_CONFIGURED`;
export const APP_BEFORE_READY = `${APP_TOPIC}.BEFORE_READY`;
export const APP_READY = `${APP_TOPIC}.READY`;
export const APP_ERROR = `${APP_TOPIC}.ERROR`;

/* eslint no-underscore-dangle: "off" */
export default class App {
  static _config = null;
  static _apiClient = null;
  static history = null;
  static authenticatedUser = defaultAuthenticatedUser;
  static getQueryParams = memoize(getQueryParameters);
  static error = null;

  static async initialize({
    messages,
    loggingService,
    overrideHandlers = {},
    ...custom
  }) {
    try {
      await this.override(handlers.beforeInit, overrideHandlers.beforeInit);
      PubSub.publish(APP_BEFORE_INIT);

      this.messages = messages;
      this.loggingService = loggingService;
      this.custom = custom;

      // Configuration
      await this.override(handlers.configuration, overrideHandlers.configuration);
      PubSub.publish(APP_CONFIGURED);

      // Authentication
      await this.override(handlers.authentication, overrideHandlers.authentication);
      PubSub.publish(APP_AUTHENTICATED);

      // Internationalization
      await this.override(handlers.internationalization, overrideHandlers.internationalization);
      PubSub.publish(APP_I18N_CONFIGURED);

      // Logging
      await this.override(handlers.logging, overrideHandlers.logging);
      PubSub.publish(APP_LOGGING_CONFIGURED);

      // Analytics
      await this.override(handlers.analytics, overrideHandlers.analytics);
      PubSub.publish(APP_ANALYTICS_CONFIGURED);

      // Before Ready
      await this.override(handlers.beforeReady, overrideHandlers.beforeReady);
      PubSub.publish(APP_BEFORE_READY);

      // Ready
      await this.override(handlers.ready, overrideHandlers.ready);
      PubSub.publish(APP_READY);
    } catch (e) {
      // Error
      this.error = e;
      await this.override(handlers.error, overrideHandlers.error);
      PubSub.publish(APP_ERROR, e);
    }
  }

  static set config(newConfiguration) {
    this._config = newConfiguration;
  }

  static get config() {
    if (this._config === null) {
      throw new Error('App.config has not been initialized. Are you calling it too early?');
    }
    return this._config;
  }

  static set apiClient(apiClient) {
    this._apiClient = apiClient;
  }

  static get apiClient() {
    if (this._apiClient === null) {
      throw new Error('App.apiClient has not been initialized. Are you calling it too early?');
    }
    return this._apiClient;
  }

  static subscribe(type, callback) {
    PubSub.subscribe(type, callback);
  }

  static get queryParams() {
    return this.getQueryParams(global.location.search);
  }

  static requireConfig(keys, requester) {
    keys.forEach((key) => {
      if (this.config[key] === undefined) {
        throw new Error(`App configuration error: ${key} is required by ${requester}.`);
      }
    });

    return pick(this.config, keys);
  }

  static async override(defaultHandler, overrideHandler) {
    if (overrideHandler !== undefined) {
      await overrideHandler(this);
    } else {
      await defaultHandler(this);
    }
  }

  static reset() {
    this._config = null;
    this._apiClient = null;
    this._error = null;
    this.authenticatedUser = defaultAuthenticatedUser;
    PubSub.unsubscribe(APP_TOPIC);
  }
}
