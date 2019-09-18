
import App, { APP_BEFORE_INIT, APP_ERROR, APP_CONFIGURED, APP_AUTHENTICATED, APP_I18N_CONFIGURED, APP_LOGGING_CONFIGURED, APP_ANALYTICS_CONFIGURED, APP_BEFORE_READY, APP_READY } from './App';

import {
  analytics,
  authentication,
  beforeInit,
  beforeReady,
  configuration,
  error,
  internationalization,
  logging,
  ready,
} from './handlers';

jest.mock('./handlers');

describe('App', () => {
  afterEach(() => {
    App.reset();
  });

  describe('defaults', () => {
    it('should have sensible defaults', () => {
      expect(App.history).toBeNull();
      expect(App.authenticatedUser).toEqual({
        userId: null,
        username: null,
        roles: [],
        administrator: false,
      });
      expect(App.error).toBeNull();
    });
  });

  describe('initialize', () => {
    beforeEach(() => {
      analytics.mockClear();
      authentication.mockClear();
      beforeInit.mockClear();
      beforeReady.mockClear();
      configuration.mockClear();
      error.mockClear();
      internationalization.mockClear();
      logging.mockClear();
      ready.mockClear();
    });

    it('should call default handlers in the absence of overrides', async (done) => {
      const expectedEvents = [
        APP_BEFORE_INIT,
        APP_CONFIGURED,
        APP_AUTHENTICATED,
        APP_I18N_CONFIGURED,
        APP_LOGGING_CONFIGURED,
        APP_ANALYTICS_CONFIGURED,
        APP_BEFORE_READY,
        APP_READY,
      ];
      function checkDispatchedDone(eventName) {
        const index = expectedEvents.indexOf(eventName);
        if (index > -1) {
          expectedEvents.splice(index, 1);
          if (expectedEvents.length === 0) {
            done();
          }
        } else {
          throw new Error(`Unexpected event dispatched! ${eventName}`);
        }
      }
      App.subscribe(APP_BEFORE_INIT, checkDispatchedDone);
      App.subscribe(APP_CONFIGURED, checkDispatchedDone);
      App.subscribe(APP_AUTHENTICATED, checkDispatchedDone);
      App.subscribe(APP_I18N_CONFIGURED, checkDispatchedDone);
      App.subscribe(APP_LOGGING_CONFIGURED, checkDispatchedDone);
      App.subscribe(APP_ANALYTICS_CONFIGURED, checkDispatchedDone);
      App.subscribe(APP_BEFORE_READY, checkDispatchedDone);
      App.subscribe(APP_READY, checkDispatchedDone);

      await App.initialize({ messages: null, loggingService: 'logging service' });

      expect(analytics).toHaveBeenCalledWith(App);
      expect(authentication).toHaveBeenCalledWith(App);
      expect(beforeInit).toHaveBeenCalledWith(App);
      expect(beforeReady).toHaveBeenCalledWith(App);
      expect(configuration).toHaveBeenCalledWith(App);
      expect(internationalization).toHaveBeenCalledWith(App);
      expect(logging).toHaveBeenCalledWith(App);
      expect(ready).toHaveBeenCalledWith(App);

      // No error, though.
      expect(error).not.toHaveBeenCalled();
    });

    it('should call override handlers if they exist', async () => {
      const overrideHandlers = {
        analytics: jest.fn(),
        authentication: jest.fn(),
        beforeInit: jest.fn(),
        beforeReady: jest.fn(),
        configuration: jest.fn(),
        internationalization: jest.fn(),
        logging: jest.fn(),
        ready: jest.fn(),
        error: jest.fn(),
      };
      await App.initialize({
        messages: null,
        loggingService: 'logging service',
        overrideHandlers,
      });
      // None of these.
      expect(analytics).not.toHaveBeenCalled();
      expect(authentication).not.toHaveBeenCalled();
      expect(beforeInit).not.toHaveBeenCalled();
      expect(beforeReady).not.toHaveBeenCalled();
      expect(configuration).not.toHaveBeenCalled();
      expect(internationalization).not.toHaveBeenCalled();
      expect(logging).not.toHaveBeenCalled();
      expect(ready).not.toHaveBeenCalled();

      // All of these.
      expect(overrideHandlers.analytics).toHaveBeenCalledWith(App);
      expect(overrideHandlers.authentication).toHaveBeenCalledWith(App);
      expect(overrideHandlers.beforeInit).toHaveBeenCalledWith(App);
      expect(overrideHandlers.beforeReady).toHaveBeenCalledWith(App);
      expect(overrideHandlers.configuration).toHaveBeenCalledWith(App);
      expect(overrideHandlers.internationalization).toHaveBeenCalledWith(App);
      expect(overrideHandlers.logging).toHaveBeenCalledWith(App);
      expect(overrideHandlers.ready).toHaveBeenCalledWith(App);

      // Still no errors
      expect(error).not.toHaveBeenCalled();
      expect(overrideHandlers.error).not.toHaveBeenCalled();
    });

    it('should call the error handler if something throws', async () => {
      const overrideHandlers = {
        authentication: jest.fn(() => {
          throw new Error('uhoh!');
        }),
      };
      await App.initialize({
        messages: null,
        loggingService: 'logging service',
        overrideHandlers,
      });
      // All of these.
      expect(beforeInit).toHaveBeenCalledWith(App);
      expect(configuration).toHaveBeenCalledWith(App);
      expect(overrideHandlers.authentication).toHaveBeenCalledWith(App);

      // None of these.
      expect(analytics).not.toHaveBeenCalled();
      expect(authentication).not.toHaveBeenCalled();
      expect(beforeReady).not.toHaveBeenCalled();
      expect(internationalization).not.toHaveBeenCalled();
      expect(logging).not.toHaveBeenCalled();
      expect(ready).not.toHaveBeenCalled();

      // Hey, an error!
      expect(error).toHaveBeenCalledWith(App);
      expect(App.error).toEqual(new Error('uhoh!'));

      expect((done) => {
        App.subscribe(APP_ERROR, (e) => {
          expect(e.message).toEqual('uhoh!');
          done();
        });
      });
    });

    it('should call the override error handler if something throws', async () => {
      const overrideHandlers = {
        authentication: jest.fn(() => {
          throw new Error('uhoh!');
        }),
        error: jest.fn(),
      };
      await App.initialize({
        messages: null,
        loggingService: 'logging service',
        overrideHandlers,
      });
      // All of these.
      expect(beforeInit).toHaveBeenCalledWith(App);
      expect(configuration).toHaveBeenCalledWith(App);
      expect(overrideHandlers.authentication).toHaveBeenCalledWith(App);

      // None of these.
      expect(analytics).not.toHaveBeenCalled();
      expect(authentication).not.toHaveBeenCalled();
      expect(beforeReady).not.toHaveBeenCalled();
      expect(internationalization).not.toHaveBeenCalled();
      expect(logging).not.toHaveBeenCalled();
      expect(ready).not.toHaveBeenCalled();
      // Not the default error handler.
      expect(error).not.toHaveBeenCalled();

      // But yes, the override error handler!
      expect(overrideHandlers.error).toHaveBeenCalledWith(App);
    });
  });

  describe('config', () => {
    it('should throw an error if config is read before being written', () => {
      expect(() => {
        const config = App.config; // eslint-disable-line
      }).toThrow(new Error('App.config has not been initialized. Are you calling it too early?'));
    });

    it('should give the config if it has been set', () => {
      App.config = { booyah: 'yes' };
      expect(App.config).toEqual({ booyah: 'yes' });
    });
  });

  describe('apiClient', () => {
    it('should throw an error if apiClient is read before being written', () => {
      expect(() => {
        const apiClient = App.apiClient; // eslint-disable-line
      }).toThrow(new Error('App.apiClient has not been initialized. Are you calling it too early?'));
    });

    it('should give the apiClient if it has been set', () => {
      App.apiClient = 'yes';
      expect(App.apiClient).toEqual('yes');
    });
  });

  describe('queryParams', () => {
    beforeEach(() => {
      window.history.pushState({}, '', '?foo=bar&buh=baz');
    });

    it('should return an object of query parameters', () => {
      const params = App.queryParams;
      expect(params).toEqual({
        foo: 'bar',
        buh: 'baz',
      });
    });
  });

  describe('requireConfig', () => {
    it('should require config provided via requireConfig', () => {
      App.config = {
        YES: 'yes',
        NO: 'no',
        MAYBE: 'maybe',
      };

      const dichotomyConfig = App.requireConfig(['YES', 'NO'], 'Test');
      const wafflingConfig = App.requireConfig(['MAYBE'], 'Test');

      expect(dichotomyConfig).toEqual({
        YES: 'yes',
        NO: 'no',
      });

      expect(wafflingConfig).toEqual({
        MAYBE: 'maybe',
      });
    });

    it('should throw an error if a piece of required config is not configured', () => {
      expect(() => {
        App.config = {
          YES: 'yes',
        };
        App.requireConfig(['MAYBE'], 'Test');
      }).toThrow(new Error('App configuration error: MAYBE is required by Test.'));
    });
  });

  describe('queryParams', () => {

  });
});
