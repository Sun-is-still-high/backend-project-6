import { faker } from '@faker-js/faker';
import fastify from 'fastify';
import init from '../server/plugin.js';
import encrypt from '../server/lib/secure.js';

describe('Users CRUD', () => {
  let server;
  let knex;

  const generateUser = () => ({
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    password: faker.internet.password({ length: 8 }),
  });

  beforeAll(async () => {
    server = fastify({ logger: false });
    await init(server, { envName: 'test' });
    knex = server.knex;
    await knex.migrate.latest();
  });

  beforeEach(async () => {
    await knex('users').truncate();
  });

  afterAll(async () => {
    await server.close();
    await knex.destroy();
  });

  describe('GET /users', () => {
    it('should return users list page', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/users',
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('Пользователи');
    });

    it('should show all registered users', async () => {
      const userData = generateUser();

      await knex('users').insert({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        passwordDigest: encrypt(userData.password),
      });

      const response = await server.inject({
        method: 'GET',
        url: '/users',
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain(userData.email);
      expect(response.body).toContain(userData.firstName);
      expect(response.body).toContain(userData.lastName);
    });
  });

  describe('GET /users/new', () => {
    it('should return registration form', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/users/new',
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('Регистрация');
      expect(response.body).toContain('data[firstName]');
      expect(response.body).toContain('data[lastName]');
      expect(response.body).toContain('data[email]');
      expect(response.body).toContain('data[password]');
    });
  });

  describe('POST /users', () => {
    it('should create a new user', async () => {
      const userData = generateUser();

      const response = await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          data: userData,
        },
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/');

      const users = await knex('users').select();
      expect(users).toHaveLength(1);
      expect(users[0].email).toBe(userData.email);
      expect(users[0].firstName).toBe(userData.firstName);
      expect(users[0].lastName).toBe(userData.lastName);
    });

    it('should not create user with invalid data', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          data: {
            firstName: '',
            lastName: '',
            email: 'invalid',
            password: 'ab',
          },
        },
      });

      expect(response.statusCode).toBe(422);

      const users = await knex('users').select();
      expect(users).toHaveLength(0);
    });

    it('should not create user with duplicate email', async () => {
      const userData = generateUser();

      await knex('users').insert({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        passwordDigest: encrypt(userData.password),
      });

      const response = await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          data: {
            firstName: 'New',
            lastName: 'User',
            email: userData.email,
            password: 'validpassword',
          },
        },
      });

      expect(response.statusCode).toBe(422);

      const users = await knex('users').select();
      expect(users).toHaveLength(1);
    });
  });

  describe('Session (Authentication)', () => {
    it('GET /session/new should return login form', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/session/new',
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('Вход');
      expect(response.body).toContain('data[email]');
      expect(response.body).toContain('data[password]');
    });

    it('POST /session should authenticate user with valid credentials', async () => {
      const userData = generateUser();

      await knex('users').insert({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        passwordDigest: encrypt(userData.password),
      });

      const response = await server.inject({
        method: 'POST',
        url: '/session',
        payload: {
          data: {
            email: userData.email,
            password: userData.password,
          },
        },
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/');
    });

    it('POST /session should reject invalid credentials', async () => {
      const userData = generateUser();

      await knex('users').insert({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        passwordDigest: encrypt(userData.password),
      });

      const response = await server.inject({
        method: 'POST',
        url: '/session',
        payload: {
          data: {
            email: userData.email,
            password: 'wrongpassword',
          },
        },
      });

      expect(response.statusCode).toBe(422);
    });
  });

  describe('User Edit/Update (PATCH /users/:id)', () => {
    it('should not allow unauthenticated users to edit', async () => {
      const userData = generateUser();

      const [userId] = await knex('users').insert({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        passwordDigest: encrypt(userData.password),
      });

      const response = await server.inject({
        method: 'GET',
        url: `/users/${userId}/edit`,
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/session/new');
    });

    it('should update user for authenticated user', async () => {
      const userData = generateUser();

      const [userId] = await knex('users').insert({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        passwordDigest: encrypt(userData.password),
      });

      const signInResponse = await server.inject({
        method: 'POST',
        url: '/session',
        payload: {
          data: {
            email: userData.email,
            password: userData.password,
          },
        },
      });
      const { cookies } = signInResponse;

      const newData = {
        firstName: 'UpdatedFirst',
        lastName: 'UpdatedLast',
        email: 'updated@example.com',
      };

      const response = await server.inject({
        method: 'PATCH',
        url: `/users/${userId}`,
        cookies: Object.fromEntries(cookies.map((c) => [c.name, c.value])),
        payload: {
          data: newData,
        },
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/users');

      const users = await knex('users').select();
      expect(users[0].firstName).toBe(newData.firstName);
      expect(users[0].lastName).toBe(newData.lastName);
      expect(users[0].email).toBe(newData.email);
    });

    it('should update user via POST with method=PATCH (browser form simulation)', async () => {
      const userData = generateUser();

      const [userId] = await knex('users').insert({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        passwordDigest: encrypt(userData.password),
      });

      const signInResponse = await server.inject({
        method: 'POST',
        url: '/session',
        payload: {
          data: {
            email: userData.email,
            password: userData.password,
          },
        },
      });
      const { cookies } = signInResponse;

      const newData = {
        firstName: 'FormUpdatedName',
        lastName: 'FormUpdatedLast',
        email: 'form-update@example.com',
      };

      const response = await server.inject({
        method: 'POST',
        url: `/users/${userId}`,
        cookies: Object.fromEntries(cookies.map((c) => [c.name, c.value])),
        payload: {
          method: 'PATCH',
          data: newData,
        },
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/users');

      const users = await knex('users').select();
      expect(users[0].firstName).toBe(newData.firstName);
      expect(users[0].lastName).toBe(newData.lastName);
      expect(users[0].email).toBe(newData.email);
    });
  });

  describe('User Delete (DELETE /users/:id)', () => {
    it('should not allow unauthenticated users to delete', async () => {
      const userData = generateUser();

      const [userId] = await knex('users').insert({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        passwordDigest: encrypt(userData.password),
      });

      const response = await server.inject({
        method: 'DELETE',
        url: `/users/${userId}`,
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/session/new');

      const users = await knex('users').select();
      expect(users).toHaveLength(1);
    });
  });
});
