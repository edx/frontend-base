import { getAuthenticatedAPIClient } from '@edx/frontend-auth';

import authentication from './authentication';
import App, { AUTHENTICATED_USER_CHANGED } from '../App';
import * as Api from '../Api';

jest.mock('@edx/frontend-auth', () => ({
  getAuthenticatedAPIClient: jest.fn(() => ({
    login: jest.fn(),
    getAuthenticatedUser: jest.fn(async (path) => {
      if (path === '/authenticated') {
        return {
          authenticatedUser: null,
          decodedAccessToken: null,
        };
      }
      return {
        authenticatedUser: {
          userId: 'user123',
          username: 'user_person',
          roles: [],
          administrator: true,
        },
        decodedAccessToken: {
          user_id: 'user123',
          preferred_username: 'user_person',
          roles: [],
          administrator: true,
        },
      };
    }),
  })),
}));

describe('authentication', () => {
  it('should create an API client, ensure we have an authenticated user, and extract user data from the token', async () => {
    window.history.pushState({}, '', '/i/am/a/path');

    await authentication(App);

    expect(getAuthenticatedAPIClient).toHaveBeenCalledWith({
      accessTokenCookieName: 'edx-jwt-cookie-header-payload',
      appBaseUrl: 'localhost:1995',
      authBaseUrl: 'http://localhost:18000',
      csrfTokenApiPath: '/csrf/api/v1/token',
      loggingService: undefined,
      loginUrl: 'http://localhost:18000/login',
      logoutUrl: 'http://localhost:18000/login',
      refreshAccessTokenEndpoint: 'http://localhost:18000/login_refresh',
      userInfoCookieName: 'edx-user-info',
    });
    // TODO: There's an async in here - we probably need to wait for it.
    expect(App.apiClient.getAuthenticatedUser).toHaveBeenCalledWith('/i/am/a/path');
    expect(App.authenticatedUser).toEqual({
      userId: 'user123',
      username: 'user_person',
      roles: [],
      administrator: true,
    });
    expect(App.decodedAccessToken).toEqual({
      user_id: 'user123',
      preferred_username: 'user_person',
      roles: [],
      administrator: true,
    });
    expect(App.apiClient.login).not.toHaveBeenCalled();
  });

  it('should perform a login redirect if the user is not authenticated and allowAnonymous is false', async () => {
    window.history.pushState({}, '', '/authenticated');

    await authentication(App);
    expect(getAuthenticatedAPIClient).toHaveBeenCalledWith({
      accessTokenCookieName: 'edx-jwt-cookie-header-payload',
      appBaseUrl: 'localhost:1995',
      authBaseUrl: 'http://localhost:18000',
      csrfTokenApiPath: '/csrf/api/v1/token',
      loggingService: undefined,
      loginUrl: 'http://localhost:18000/login',
      logoutUrl: 'http://localhost:18000/login',
      refreshAccessTokenEndpoint: 'http://localhost:18000/login_refresh',
      userInfoCookieName: 'edx-user-info',
    });
    // TODO: There's an async in here - we probably need to wait for it.
    expect(App.apiClient.getAuthenticatedUser).toHaveBeenCalledWith('/authenticated');
    expect(App.authenticatedUser).toEqual(null);
    expect(App.decodedAccessToken).toEqual(null);
    expect(App.apiClient.login).toHaveBeenCalledWith('http://localhost/authenticated');
  });

  it('should perform a user account fetch if hydrateAuthenticatedUser is true', async (done) => {
    jest.spyOn(Api, 'get').mockImplementation(async () => ({
      name: 'edX User',
    }));
    window.history.pushState({}, '', '/');
    App.hydrateAuthenticatedUser = true;

    App.subscribe(AUTHENTICATED_USER_CHANGED, () => {
      expect(App.authenticatedUser).toEqual({
        userId: 'user123',
        username: 'user_person',
        roles: [],
        administrator: true,
        name: 'edX User',
      });
      done();
    });

    await authentication(App);
    expect(getAuthenticatedAPIClient).toHaveBeenCalledWith({
      accessTokenCookieName: 'edx-jwt-cookie-header-payload',
      appBaseUrl: 'localhost:1995',
      authBaseUrl: 'http://localhost:18000',
      csrfTokenApiPath: '/csrf/api/v1/token',
      loggingService: undefined,
      loginUrl: 'http://localhost:18000/login',
      logoutUrl: 'http://localhost:18000/login',
      refreshAccessTokenEndpoint: 'http://localhost:18000/login_refresh',
      userInfoCookieName: 'edx-user-info',
    });
    // TODO: There's an async in here - we probably need to wait for it.
    expect(App.apiClient.getAuthenticatedUser).toHaveBeenCalledWith('/');
    // Name shouldn't be in authenticatedUser yet.
    expect(App.authenticatedUser).toEqual({
      userId: 'user123',
      username: 'user_person',
      roles: [],
      administrator: true,
    });
    expect(App.decodedAccessToken).toEqual({
      user_id: 'user123',
      preferred_username: 'user_person',
      roles: [],
      administrator: true,
    });
    expect(App.apiClient.login).not.toHaveBeenCalled();
  });
});
