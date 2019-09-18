import { configure } from '@edx/frontend-i18n';
import merge from 'lodash.merge';

export function mergeMessages(messagesArray = []) {
  return Array.isArray(messagesArray) ? merge({}, ...messagesArray) : {};
}

export default async function internationalization(app) {
  const messages = Array.isArray(app.messages) ? mergeMessages(app.messages) : app.messages;
  configure(app.config, messages);
}
