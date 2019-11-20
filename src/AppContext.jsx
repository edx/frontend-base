import React from 'react';

const AppContext = React.createContext({
  authenticatedUser: null,
  config: {},
  locale: null,
});

export default AppContext;
