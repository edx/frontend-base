import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { getLocale, getMessages, IntlProvider } from '@edx/frontend-i18n';
import { Router } from 'react-router-dom';

import OptionalReduxProvider from './OptionalReduxProvider';

import App, { AUTHENTICATED_USER_CHANGED, CONFIG_CHANGED, LOCALE_CHANGED } from './App';
import ErrorBoundary from './ErrorBoundary';
import AppContext from './AppContext';
import { useAppEvent } from './data/hooks';

const AppProvider = ({ store, children }) => {
  const [config, setConfig] = useState(App.config);
  const [authenticatedUser, setAuthenticatedUser] = useState(App.authenticatedUser);
  const [locale, setLocale] = useState(getLocale());

  useAppEvent(AUTHENTICATED_USER_CHANGED, () => {
    setAuthenticatedUser(App.authenticatedUser);
  });

  useAppEvent(CONFIG_CHANGED, () => {
    setConfig(App.config);
  });

  useAppEvent(LOCALE_CHANGED, () => {
    setLocale(getLocale());
  });

  return (
    <ErrorBoundary>
      <AppContext.Provider
        value={{ authenticatedUser, config, locale }}
      >
        <IntlProvider locale={locale} messages={getMessages()}>
          <OptionalReduxProvider store={store}>
            <Router history={App.history}>
              <React.Fragment>{children}</React.Fragment>
            </Router>
          </OptionalReduxProvider>
        </IntlProvider>
      </AppContext.Provider>
    </ErrorBoundary>
  );
};

AppProvider.propTypes = {
  store: PropTypes.object, // eslint-disable-line
  children: PropTypes.node.isRequired,
};

AppProvider.defaultProps = {
  store: null,
};

export default AppProvider;
