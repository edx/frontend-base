import camelCase from 'lodash.camelcase';
import snakeCase from 'lodash.snakecase';

import App from './App';

export const modifyObjectKeys = (object, modify) => {
  // If the passed in object is not an Object, return it.
  if (
    object === undefined ||
    object === null ||
    (typeof object !== 'object' && !Array.isArray(object))
  ) {
    return object;
  }

  if (Array.isArray(object)) {
    return object.map(value => modifyObjectKeys(value, modify));
  }

  // Otherwise, process all its keys.
  const result = {};
  Object.entries(object).forEach(([key, value]) => {
    result[modify(key)] = modifyObjectKeys(value, modify);
  });
  return result;
};

export const camelCaseObject = object => modifyObjectKeys(object, camelCase);

export const snakeCaseObject = object => modifyObjectKeys(object, snakeCase);

export const convertKeyNames = (object, nameMap) => {
  const transformer = key =>
    (nameMap[key] === undefined ? key : nameMap[key]);

  return modifyObjectKeys(object, transformer);
};

export function formatKnownError(error) {
  const formattedError = new Error();
  const { fieldErrors, errors, messages } = camelCaseObject(error.response.data);
  formattedError.fieldErrors = fieldErrors;
  formattedError.errors = errors;
  formattedError.messages = messages;
  return formattedError;
}

export function isKnownError(error) {
  return (
    error.response !== undefined &&
    error.response.data !== undefined &&
    (
      error.response.data.errors !== undefined ||
      error.response.data.field_errors !== undefined ||
      error.response.data.messages !== undefined
    )
  );
}

export const request = async (type, ...args) => {
  try {
    const { data } = await App.apiClient[type](...args);
    return camelCaseObject(data);
  } catch (error) {
    if (isKnownError(error)) {
      // This is an error we know how to handle, so format it and throw it on.
      throw formatKnownError(error);
    }

    // We don't know how to handle this, so just throw it on as-is.
    throw error;
  }
};

export const get = async (...args) => request('get', ...args);
// NOTE: del becomes delete here.  We can't call a constant "delete", it's a reserved word.
export const del = async (...args) => request('delete', ...args);
export const head = async (...args) => request('head', ...args);
export const options = async (...args) => request('options', ...args);
export const patch = async (...args) => request('patch', ...args);
export const post = async (...args) => request('post', ...args);
export const put = async (...args) => request('put', ...args);
