import welcome from './welcome.js';
import users from './users.js';
import session from './session.js';
import statuses from './statuses.js';
import tasks from './tasks.js';
import labels from './labels.js';

const controllers = [
  welcome,
  users,
  session,
  statuses,
  tasks,
  labels,
];

export default async (app) => {
  controllers.forEach((controller) => controller(app));
};
