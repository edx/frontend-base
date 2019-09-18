import { getAuthenticatedAPIClient } from '@edx/frontend-auth';
import {
  identifyAuthenticatedUser,
  sendPageEvent,
  configureAnalytics,
  initializeSegment,
} from '@edx/frontend-analytics';
import { configure as configureI18n } from '@edx/frontend-i18n';
import { configureLoggingService } from '@edx/frontend-logging';

import App from './App';
import configuration from './configuration';
import mergeMessages from './mergeMessages';
import { getAuthenticatedUser } from './frontendAuthWrapper';

// Our configuration is known statically, so we set it immediately.
App.config = configuration;

export default async function initialize({ messages, loggingService, ...other }) {
  const otherKeys = Object.keys(other);
  if (otherKeys.length > 0) {
    throw new Error(`Unexpected options passed to application initialize: ${otherKeys.join(' ')}.`);
  }
  try {
    App.apiClient = getAuthenticatedAPIClient({
      appBaseUrl: configuration.BASE_URL,
      authBaseUrl: configuration.LMS_BASE_URL,
      loginUrl: configuration.LOGIN_URL,
      logoutUrl: configuration.LOGOUT_URL,
      csrfTokenApiPath: configuration.CSRF_TOKEN_API_PATH,
      refreshAccessTokenEndpoint: configuration.REFRESH_ACCESS_TOKEN_ENDPOINT,
      accessTokenCookieName: configuration.ACCESS_TOKEN_COOKIE_NAME,
      userInfoCookieName: configuration.USER_INFO_COOKIE_NAME,
      csrfCookieName: configuration.CSRF_COOKIE_NAME,
      loggingService,
    });

    // Get a valid access token for authenticated API access.
    const accessToken =
      await App.apiClient.ensurePublicOrAuthenticationAndCookies(global.location.pathname);
    // Once we have refreshed our authentication, extract it for use later.

    App.authenticatedUser = getAuthenticatedUser(accessToken);

    // Configure services.
    configureI18n(configuration, Array.isArray(messages) ? mergeMessages(messages) : messages);
    configureLoggingService(loggingService);
    initializeSegment(configuration.SEGMENT_KEY);
    configureAnalytics({
      loggingService,
      authApiClient: App.apiClient,
      analyticsApiBaseUrl: configuration.LMS_BASE_URL,
    });

    // Application is now ready to be used.
    App.ready();

    // Send analytics events indicating a successful initialization.
    identifyAuthenticatedUser(accessToken.userId);
    sendPageEvent();
  } catch (error) {
    loggingService.logError(error.message);
    App.error(error);
  }
}
