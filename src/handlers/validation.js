import validateConfig from '../validateConfig';

export default async function validation(app) {
  validateConfig(app.config, 'App validation handler');
}
