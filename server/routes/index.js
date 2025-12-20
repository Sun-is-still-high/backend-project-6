import welcome from './welcome.js';
import users from './users.js';
import session from './session.js';

const controllers = [
  welcome,
  users,
  session,
];

export default async (app) => {
  controllers.forEach((controller) => controller(app));
};
