import app from '../server/index.js';
import encrypt from '../server/lib/secure.js';

describe('Statuses CRUD', () => {
  let server;
  let knex;

  const createUser = async () => {
    const [userId] = await knex('users').insert({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      passwordDigest: encrypt('password'),
    });
    return userId;
  };

  const signIn = async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/session',
      payload: {
        data: {
          email: 'test@example.com',
          password: 'password',
        },
      },
    });
    return response.cookies;
  };

  beforeAll(async () => {
    server = await app('test');
    knex = server.knex;
    await knex.migrate.latest();
  });

  beforeEach(async () => {
    await knex('taskStatuses').truncate();
    await knex('users').truncate();
  });

  afterAll(async () => {
    await server.close();
    await knex.destroy();
  });

  describe('GET /statuses', () => {
    it('should redirect unauthenticated users to login', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/statuses',
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/session/new');
    });

    it('should return statuses list page for authenticated users', async () => {
      await createUser();
      const cookies = await signIn();

      const response = await server.inject({
        method: 'GET',
        url: '/statuses',
        cookies: Object.fromEntries(cookies.map((c) => [c.name, c.value])),
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('Статусы');
    });

    it('should show all statuses', async () => {
      await createUser();
      const cookies = await signIn();
      await knex('taskStatuses').insert({ name: 'Новый' });
      await knex('taskStatuses').insert({ name: 'В работе' });

      const response = await server.inject({
        method: 'GET',
        url: '/statuses',
        cookies: Object.fromEntries(cookies.map((c) => [c.name, c.value])),
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('Новый');
      expect(response.body).toContain('В работе');
    });
  });

  describe('GET /statuses/new', () => {
    it('should redirect unauthenticated users to login', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/statuses/new',
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/session/new');
    });

    it('should return create form for authenticated users', async () => {
      await createUser();
      const cookies = await signIn();

      const response = await server.inject({
        method: 'GET',
        url: '/statuses/new',
        cookies: Object.fromEntries(cookies.map((c) => [c.name, c.value])),
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('Создание статуса');
      expect(response.body).toContain('data[name]');
    });
  });

  describe('POST /statuses', () => {
    it('should redirect unauthenticated users to login', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/statuses',
        payload: {
          data: { name: 'Новый' },
        },
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/session/new');

      const statuses = await knex('taskStatuses').select();
      expect(statuses).toHaveLength(0);
    });

    it('should create status for authenticated users', async () => {
      await createUser();
      const cookies = await signIn();

      const response = await server.inject({
        method: 'POST',
        url: '/statuses',
        cookies: Object.fromEntries(cookies.map((c) => [c.name, c.value])),
        payload: {
          data: { name: 'Новый' },
        },
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/statuses');

      const statuses = await knex('taskStatuses').select();
      expect(statuses).toHaveLength(1);
      expect(statuses[0].name).toBe('Новый');
    });

    it('should not create status with empty name', async () => {
      await createUser();
      const cookies = await signIn();

      const response = await server.inject({
        method: 'POST',
        url: '/statuses',
        cookies: Object.fromEntries(cookies.map((c) => [c.name, c.value])),
        payload: {
          data: { name: '' },
        },
      });

      expect(response.statusCode).toBe(422);

      const statuses = await knex('taskStatuses').select();
      expect(statuses).toHaveLength(0);
    });
  });

  describe('GET /statuses/:id/edit', () => {
    it('should redirect unauthenticated users to login', async () => {
      const [statusId] = await knex('taskStatuses').insert({ name: 'Новый' });

      const response = await server.inject({
        method: 'GET',
        url: `/statuses/${statusId}/edit`,
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/session/new');
    });

    it('should return edit form for authenticated users', async () => {
      await createUser();
      const cookies = await signIn();
      const [statusId] = await knex('taskStatuses').insert({ name: 'Новый' });

      const response = await server.inject({
        method: 'GET',
        url: `/statuses/${statusId}/edit`,
        cookies: Object.fromEntries(cookies.map((c) => [c.name, c.value])),
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('Изменение статуса');
      expect(response.body).toContain('Новый');
    });
  });

  describe('PATCH /statuses/:id', () => {
    it('should redirect unauthenticated users to login', async () => {
      const [statusId] = await knex('taskStatuses').insert({ name: 'Новый' });

      const response = await server.inject({
        method: 'PATCH',
        url: `/statuses/${statusId}`,
        payload: {
          data: { name: 'Изменённый' },
        },
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/session/new');

      const statuses = await knex('taskStatuses').select();
      expect(statuses[0].name).toBe('Новый');
    });

    it('should update status for authenticated users', async () => {
      await createUser();
      const cookies = await signIn();
      const [statusId] = await knex('taskStatuses').insert({ name: 'Новый' });

      const response = await server.inject({
        method: 'PATCH',
        url: `/statuses/${statusId}`,
        cookies: Object.fromEntries(cookies.map((c) => [c.name, c.value])),
        payload: {
          data: { name: 'Изменённый' },
        },
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/statuses');

      const statuses = await knex('taskStatuses').select();
      expect(statuses[0].name).toBe('Изменённый');
    });

    it('should not update status with empty name', async () => {
      await createUser();
      const cookies = await signIn();
      const [statusId] = await knex('taskStatuses').insert({ name: 'Новый' });

      const response = await server.inject({
        method: 'PATCH',
        url: `/statuses/${statusId}`,
        cookies: Object.fromEntries(cookies.map((c) => [c.name, c.value])),
        payload: {
          data: { name: '' },
        },
      });

      expect(response.statusCode).toBe(422);

      const statuses = await knex('taskStatuses').select();
      expect(statuses[0].name).toBe('Новый');
    });
  });

  describe('DELETE /statuses/:id', () => {
    it('should redirect unauthenticated users to login', async () => {
      const [statusId] = await knex('taskStatuses').insert({ name: 'Новый' });

      const response = await server.inject({
        method: 'DELETE',
        url: `/statuses/${statusId}`,
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/session/new');

      const statuses = await knex('taskStatuses').select();
      expect(statuses).toHaveLength(1);
    });

    it('should delete status for authenticated users', async () => {
      await createUser();
      const cookies = await signIn();
      const [statusId] = await knex('taskStatuses').insert({ name: 'Новый' });

      const response = await server.inject({
        method: 'DELETE',
        url: `/statuses/${statusId}`,
        cookies: Object.fromEntries(cookies.map((c) => [c.name, c.value])),
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/statuses');

      const statuses = await knex('taskStatuses').select();
      expect(statuses).toHaveLength(0);
    });
  });
});
