import React from 'react';
import PropTypes from 'prop-types';
import { getLocale, getMessages, IntlProvider } from '@edx/frontend-i18n';
import { Provider } from 'react-redux';
import { Router } from 'react-router-dom';

import App from './App';
import ErrorBoundary from './ErrorBoundary';
import AppContext from './AppContext';

const AppProvider = ({ store, children }) => (
  <ErrorBoundary>
    <AppContext.Provider value={{ authenticatedUser: App.authenticatedUser, config: App.config }}>
      <IntlProvider locale={getLocale()} messages={getMessages()}>
        <Provider store={store}>
          <Router history={App.history}>
            <React.Fragment>
              {children}
            </React.Fragment>
          </Router>
        </Provider>
      </IntlProvider>
    </AppContext.Provider>
  </ErrorBoundary>
);

AppProvider.propTypes = {
  store: PropTypes.object.isRequired, // eslint-disable-line
  children: PropTypes.node.isRequired,
};

export default AppProvider;
