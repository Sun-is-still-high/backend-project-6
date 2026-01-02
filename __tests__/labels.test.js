import fastify from 'fastify';
import init from '../server/plugin.js';
import encrypt from '../server/lib/secure.js';

describe('Labels CRUD', () => {
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
    server = fastify({ logger: false });
    await init(server, { envName: 'test' });
    knex = server.knex;
    await knex.migrate.latest();
  });

  beforeEach(async () => {
    await knex('tasksLabels').truncate();
    await knex('tasks').truncate();
    await knex('labels').truncate();
    await knex('taskStatuses').truncate();
    await knex('users').truncate();
  });

  afterAll(async () => {
    await server.close();
    await knex.destroy();
  });

  describe('GET /labels', () => {
    it('should redirect unauthenticated users to login', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/labels',
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/session/new');
    });

    it('should return labels list page for authenticated users', async () => {
      await createUser();
      const cookies = await signIn();

      const response = await server.inject({
        method: 'GET',
        url: '/labels',
        cookies: Object.fromEntries(cookies.map((c) => [c.name, c.value])),
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('Метки');
    });

    it('should show all labels', async () => {
      await createUser();
      const cookies = await signIn();
      await knex('labels').insert({ name: 'Важное' });
      await knex('labels').insert({ name: 'Срочное' });

      const response = await server.inject({
        method: 'GET',
        url: '/labels',
        cookies: Object.fromEntries(cookies.map((c) => [c.name, c.value])),
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('Важное');
      expect(response.body).toContain('Срочное');
    });
  });

  describe('GET /labels/new', () => {
    it('should redirect unauthenticated users to login', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/labels/new',
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/session/new');
    });

    it('should return create form for authenticated users', async () => {
      await createUser();
      const cookies = await signIn();

      const response = await server.inject({
        method: 'GET',
        url: '/labels/new',
        cookies: Object.fromEntries(cookies.map((c) => [c.name, c.value])),
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('Создание метки');
      expect(response.body).toContain('data[name]');
    });
  });

  describe('POST /labels', () => {
    it('should redirect unauthenticated users to login', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/labels',
        payload: {
          data: { name: 'Важное' },
        },
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/session/new');

      const labels = await knex('labels').select();
      expect(labels).toHaveLength(0);
    });

    it('should create label for authenticated users', async () => {
      await createUser();
      const cookies = await signIn();

      const response = await server.inject({
        method: 'POST',
        url: '/labels',
        cookies: Object.fromEntries(cookies.map((c) => [c.name, c.value])),
        payload: {
          data: { name: 'Важное' },
        },
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/labels');

      const labels = await knex('labels').select();
      expect(labels).toHaveLength(1);
      expect(labels[0].name).toBe('Важное');
    });

    it('should not create label with empty name', async () => {
      await createUser();
      const cookies = await signIn();

      const response = await server.inject({
        method: 'POST',
        url: '/labels',
        cookies: Object.fromEntries(cookies.map((c) => [c.name, c.value])),
        payload: {
          data: { name: '' },
        },
      });

      expect(response.statusCode).toBe(422);

      const labels = await knex('labels').select();
      expect(labels).toHaveLength(0);
    });
  });

  describe('GET /labels/:id/edit', () => {
    it('should redirect unauthenticated users to login', async () => {
      const [labelId] = await knex('labels').insert({ name: 'Важное' });

      const response = await server.inject({
        method: 'GET',
        url: `/labels/${labelId}/edit`,
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/session/new');
    });

    it('should return edit form for authenticated users', async () => {
      await createUser();
      const cookies = await signIn();
      const [labelId] = await knex('labels').insert({ name: 'Важное' });

      const response = await server.inject({
        method: 'GET',
        url: `/labels/${labelId}/edit`,
        cookies: Object.fromEntries(cookies.map((c) => [c.name, c.value])),
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('Изменение метки');
      expect(response.body).toContain('Важное');
    });
  });

  describe('PATCH /labels/:id', () => {
    it('should redirect unauthenticated users to login', async () => {
      const [labelId] = await knex('labels').insert({ name: 'Важное' });

      const response = await server.inject({
        method: 'PATCH',
        url: `/labels/${labelId}`,
        payload: {
          data: { name: 'Изменённое' },
        },
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/session/new');

      const labels = await knex('labels').select();
      expect(labels[0].name).toBe('Важное');
    });

    it('should update label for authenticated users', async () => {
      await createUser();
      const cookies = await signIn();
      const [labelId] = await knex('labels').insert({ name: 'Важное' });

      const response = await server.inject({
        method: 'PATCH',
        url: `/labels/${labelId}`,
        cookies: Object.fromEntries(cookies.map((c) => [c.name, c.value])),
        payload: {
          data: { name: 'Изменённое' },
        },
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/labels');

      const labels = await knex('labels').select();
      expect(labels[0].name).toBe('Изменённое');
    });

    it('should not update label with empty name', async () => {
      await createUser();
      const cookies = await signIn();
      const [labelId] = await knex('labels').insert({ name: 'Важное' });

      const response = await server.inject({
        method: 'PATCH',
        url: `/labels/${labelId}`,
        cookies: Object.fromEntries(cookies.map((c) => [c.name, c.value])),
        payload: {
          data: { name: '' },
        },
      });

      expect(response.statusCode).toBe(422);

      const labels = await knex('labels').select();
      expect(labels[0].name).toBe('Важное');
    });
  });

  describe('DELETE /labels/:id', () => {
    it('should redirect unauthenticated users to login', async () => {
      const [labelId] = await knex('labels').insert({ name: 'Важное' });

      const response = await server.inject({
        method: 'DELETE',
        url: `/labels/${labelId}`,
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/session/new');

      const labels = await knex('labels').select();
      expect(labels).toHaveLength(1);
    });

    it('should delete label for authenticated users', async () => {
      await createUser();
      const cookies = await signIn();
      const [labelId] = await knex('labels').insert({ name: 'Важное' });

      const response = await server.inject({
        method: 'DELETE',
        url: `/labels/${labelId}`,
        cookies: Object.fromEntries(cookies.map((c) => [c.name, c.value])),
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/labels');

      const labels = await knex('labels').select();
      expect(labels).toHaveLength(0);
    });

    it('should not delete label linked to task', async () => {
      const userId = await createUser();
      const cookies = await signIn();

      const [statusId] = await knex('taskStatuses').insert({ name: 'Новый' });
      const [labelId] = await knex('labels').insert({ name: 'Важное' });
      const [taskId] = await knex('tasks').insert({
        name: 'Тестовая задача',
        statusId,
        creatorId: userId,
      });
      await knex('tasksLabels').insert({ taskId, labelId });

      const response = await server.inject({
        method: 'DELETE',
        url: `/labels/${labelId}`,
        cookies: Object.fromEntries(cookies.map((c) => [c.name, c.value])),
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/labels');

      const labels = await knex('labels').select();
      expect(labels).toHaveLength(1);
    });
  });
});
