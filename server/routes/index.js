import welcome from './welcome.js';
import users from './users.js';
import session from './session.js';
import statuses from './statuses.js';

const controllers = [
  welcome,
  users,
  session,
  statuses,
];

export default async (app) => {
  controllers.forEach((controller) => controller(app));
};
