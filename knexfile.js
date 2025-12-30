import path from 'path';
import { fileURLToPath } from 'url';
import { knexSnakeCaseMappers } from 'objection';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const migrations = {
  directory: path.join(__dirname, 'server', 'migrations'),
};

export const development = {
  client: 'better-sqlite3',
  connection: {
    filename: path.resolve(__dirname, 'database.sqlite'),
  },
  useNullAsDefault: true,
  migrations,
  ...knexSnakeCaseMappers(),
};

export const test = {
  client: 'better-sqlite3',
  connection: ':memory:',
  useNullAsDefault: true,
  migrations,
  ...knexSnakeCaseMappers(),
};

export const production = {
  client: 'pg',
  connection: process.env.DATABASE_URL,
  migrations,
  ...knexSnakeCaseMappers(),
};

export default { development, test, production };
