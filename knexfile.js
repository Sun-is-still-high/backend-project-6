import path from 'path';
import { fileURLToPath } from 'url';

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
};

export const test = {
  client: 'better-sqlite3',
  connection: ':memory:',
  useNullAsDefault: true,
  migrations,
};

export const production = {
  client: 'pg',
  connection: process.env.DATABASE_URL,
  migrations,
};

export default { development, test, production };
