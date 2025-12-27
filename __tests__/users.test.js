import { faker } from '@faker-js/faker';
import app from '../server/index.js';

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
    server = await app('test');
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
      const { encrypt } = await import('../server/lib/secure.js');

      await knex('users').insert({
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        password_digest: encrypt(userData.password),
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
      expect(users[0].first_name).toBe(userData.firstName);
      expect(users[0].last_name).toBe(userData.lastName);
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
      const { encrypt } = await import('../server/lib/secure.js');

      await knex('users').insert({
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        password_digest: encrypt(userData.password),
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
      const { encrypt } = await import('../server/lib/secure.js');

      await knex('users').insert({
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        password_digest: encrypt(userData.password),
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
      const { encrypt } = await import('../server/lib/secure.js');

      await knex('users').insert({
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        password_digest: encrypt(userData.password),
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
      const { encrypt } = await import('../server/lib/secure.js');

      const [userId] = await knex('users').insert({
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        password_digest: encrypt(userData.password),
      });

      const response = await server.inject({
        method: 'GET',
        url: `/users/${userId}/edit`,
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/session/new');
    });
  });

  describe('User Delete (DELETE /users/:id)', () => {
    it('should not allow unauthenticated users to delete', async () => {
      const userData = generateUser();
      const { encrypt } = await import('../server/lib/secure.js');

      const [userId] = await knex('users').insert({
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        password_digest: encrypt(userData.password),
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
