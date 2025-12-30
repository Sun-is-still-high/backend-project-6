import app from '../server/index.js';
import encrypt from '../server/lib/secure.js';

describe('Tasks CRUD', () => {
  let server;
  let knex;

  const createUser = async (email = 'test@example.com') => {
    const [userId] = await knex('users').insert({
      firstName: 'Test',
      lastName: 'User',
      email,
      passwordDigest: encrypt('password'),
    });
    return userId;
  };

  const createStatus = async (name = 'Новый') => {
    const [statusId] = await knex('taskStatuses').insert({ name });
    return statusId;
  };

  const signIn = async (email = 'test@example.com') => {
    const response = await server.inject({
      method: 'POST',
      url: '/session',
      payload: {
        data: {
          email,
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

  describe('GET /tasks', () => {
    it('should redirect unauthenticated users to login', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/tasks',
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/session/new');
    });

    it('should return tasks list page for authenticated users', async () => {
      await createUser();
      const cookies = await signIn();

      const response = await server.inject({
        method: 'GET',
        url: '/tasks',
        cookies: Object.fromEntries(cookies.map((c) => [c.name, c.value])),
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('Задачи');
    });

    it('should show all tasks with relations', async () => {
      const userId = await createUser();
      const statusId = await createStatus();
      const cookies = await signIn();

      await knex('tasks').insert({
        name: 'Тестовая задача',
        statusId,
        creatorId: userId,
      });

      const response = await server.inject({
        method: 'GET',
        url: '/tasks',
        cookies: Object.fromEntries(cookies.map((c) => [c.name, c.value])),
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('Тестовая задача');
      expect(response.body).toContain('Новый');
      expect(response.body).toContain('Test User');
    });
  });

  describe('GET /tasks/new', () => {
    it('should redirect unauthenticated users to login', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/tasks/new',
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/session/new');
    });

    it('should return create form for authenticated users', async () => {
      await createUser();
      await createStatus();
      const cookies = await signIn();

      const response = await server.inject({
        method: 'GET',
        url: '/tasks/new',
        cookies: Object.fromEntries(cookies.map((c) => [c.name, c.value])),
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('Создание задачи');
      expect(response.body).toContain('data[name]');
      expect(response.body).toContain('data[statusId]');
    });
  });

  describe('POST /tasks', () => {
    it('should redirect unauthenticated users to login', async () => {
      const statusId = await createStatus();

      const response = await server.inject({
        method: 'POST',
        url: '/tasks',
        payload: {
          data: { name: 'Новая задача', statusId },
        },
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/session/new');

      const tasks = await knex('tasks').select();
      expect(tasks).toHaveLength(0);
    });

    it('should create task for authenticated users', async () => {
      const userId = await createUser();
      const statusId = await createStatus();
      const cookies = await signIn();

      const response = await server.inject({
        method: 'POST',
        url: '/tasks',
        cookies: Object.fromEntries(cookies.map((c) => [c.name, c.value])),
        payload: {
          data: {
            name: 'Новая задача',
            description: 'Описание задачи',
            statusId,
          },
        },
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/tasks');

      const tasks = await knex('tasks').select();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].name).toBe('Новая задача');
      expect(tasks[0].description).toBe('Описание задачи');
      expect(tasks[0].creatorId).toBe(userId);
    });

    it('should not create task with empty name', async () => {
      await createUser();
      const statusId = await createStatus();
      const cookies = await signIn();

      const response = await server.inject({
        method: 'POST',
        url: '/tasks',
        cookies: Object.fromEntries(cookies.map((c) => [c.name, c.value])),
        payload: {
          data: { name: '', statusId },
        },
      });

      expect(response.statusCode).toBe(422);

      const tasks = await knex('tasks').select();
      expect(tasks).toHaveLength(0);
    });

    it('should not create task without status', async () => {
      await createUser();
      const cookies = await signIn();

      const response = await server.inject({
        method: 'POST',
        url: '/tasks',
        cookies: Object.fromEntries(cookies.map((c) => [c.name, c.value])),
        payload: {
          data: { name: 'Задача без статуса' },
        },
      });

      expect(response.statusCode).toBe(422);

      const tasks = await knex('tasks').select();
      expect(tasks).toHaveLength(0);
    });
  });

  describe('GET /tasks/:id', () => {
    it('should redirect unauthenticated users to login', async () => {
      const userId = await createUser();
      const statusId = await createStatus();

      const [taskId] = await knex('tasks').insert({
        name: 'Тестовая задача',
        statusId,
        creatorId: userId,
      });

      const response = await server.inject({
        method: 'GET',
        url: `/tasks/${taskId}`,
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/session/new');
    });

    it('should show task details for authenticated users', async () => {
      const userId = await createUser();
      const statusId = await createStatus();
      const cookies = await signIn();

      const [taskId] = await knex('tasks').insert({
        name: 'Тестовая задача',
        description: 'Описание',
        statusId,
        creatorId: userId,
      });

      const response = await server.inject({
        method: 'GET',
        url: `/tasks/${taskId}`,
        cookies: Object.fromEntries(cookies.map((c) => [c.name, c.value])),
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('Тестовая задача');
      expect(response.body).toContain('Описание');
    });

    it('should redirect if task not found', async () => {
      await createUser();
      const cookies = await signIn();

      const response = await server.inject({
        method: 'GET',
        url: '/tasks/999',
        cookies: Object.fromEntries(cookies.map((c) => [c.name, c.value])),
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/tasks');
    });
  });

  describe('GET /tasks/:id/edit', () => {
    it('should redirect unauthenticated users to login', async () => {
      const userId = await createUser();
      const statusId = await createStatus();

      const [taskId] = await knex('tasks').insert({
        name: 'Тестовая задача',
        statusId,
        creatorId: userId,
      });

      const response = await server.inject({
        method: 'GET',
        url: `/tasks/${taskId}/edit`,
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/session/new');
    });

    it('should return edit form for authenticated users', async () => {
      const userId = await createUser();
      const statusId = await createStatus();
      const cookies = await signIn();

      const [taskId] = await knex('tasks').insert({
        name: 'Тестовая задача',
        statusId,
        creatorId: userId,
      });

      const response = await server.inject({
        method: 'GET',
        url: `/tasks/${taskId}/edit`,
        cookies: Object.fromEntries(cookies.map((c) => [c.name, c.value])),
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('Изменение задачи');
      expect(response.body).toContain('Тестовая задача');
    });
  });

  describe('PATCH /tasks/:id', () => {
    it('should redirect unauthenticated users to login', async () => {
      const userId = await createUser();
      const statusId = await createStatus();

      const [taskId] = await knex('tasks').insert({
        name: 'Тестовая задача',
        statusId,
        creatorId: userId,
      });

      const response = await server.inject({
        method: 'PATCH',
        url: `/tasks/${taskId}`,
        payload: {
          data: { name: 'Изменённая задача', statusId },
        },
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/session/new');

      const tasks = await knex('tasks').select();
      expect(tasks[0].name).toBe('Тестовая задача');
    });

    it('should update task for authenticated users', async () => {
      const userId = await createUser();
      const statusId = await createStatus();
      const cookies = await signIn();

      const [taskId] = await knex('tasks').insert({
        name: 'Тестовая задача',
        statusId,
        creatorId: userId,
      });

      const response = await server.inject({
        method: 'PATCH',
        url: `/tasks/${taskId}`,
        cookies: Object.fromEntries(cookies.map((c) => [c.name, c.value])),
        payload: {
          data: { name: 'Изменённая задача', statusId },
        },
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/tasks');

      const tasks = await knex('tasks').select();
      expect(tasks[0].name).toBe('Изменённая задача');
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('should redirect unauthenticated users to login', async () => {
      const userId = await createUser();
      const statusId = await createStatus();

      const [taskId] = await knex('tasks').insert({
        name: 'Тестовая задача',
        statusId,
        creatorId: userId,
      });

      const response = await server.inject({
        method: 'DELETE',
        url: `/tasks/${taskId}`,
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/session/new');

      const tasks = await knex('tasks').select();
      expect(tasks).toHaveLength(1);
    });

    it('should delete task by creator', async () => {
      const userId = await createUser();
      const statusId = await createStatus();
      const cookies = await signIn();

      const [taskId] = await knex('tasks').insert({
        name: 'Тестовая задача',
        statusId,
        creatorId: userId,
      });

      const response = await server.inject({
        method: 'DELETE',
        url: `/tasks/${taskId}`,
        cookies: Object.fromEntries(cookies.map((c) => [c.name, c.value])),
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/tasks');

      const tasks = await knex('tasks').select();
      expect(tasks).toHaveLength(0);
    });

    it('should not allow non-creator to delete task', async () => {
      const creatorId = await createUser('creator@example.com');
      await createUser('other@example.com');
      const statusId = await createStatus();

      const [taskId] = await knex('tasks').insert({
        name: 'Тестовая задача',
        statusId,
        creatorId,
      });

      const cookies = await signIn('other@example.com');

      const response = await server.inject({
        method: 'DELETE',
        url: `/tasks/${taskId}`,
        cookies: Object.fromEntries(cookies.map((c) => [c.name, c.value])),
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/tasks');

      const tasks = await knex('tasks').select();
      expect(tasks).toHaveLength(1);
    });
  });

  describe('Protection from deletion', () => {
    it('should not allow deleting user with tasks', async () => {
      const userId = await createUser();
      const statusId = await createStatus();
      const cookies = await signIn();

      await knex('tasks').insert({
        name: 'Тестовая задача',
        statusId,
        creatorId: userId,
      });

      const response = await server.inject({
        method: 'DELETE',
        url: `/users/${userId}`,
        cookies: Object.fromEntries(cookies.map((c) => [c.name, c.value])),
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/users');

      const users = await knex('users').select();
      expect(users).toHaveLength(1);
    });

    it('should not allow deleting status with tasks', async () => {
      const userId = await createUser();
      const statusId = await createStatus();
      const cookies = await signIn();

      await knex('tasks').insert({
        name: 'Тестовая задача',
        statusId,
        creatorId: userId,
      });

      const response = await server.inject({
        method: 'DELETE',
        url: `/statuses/${statusId}`,
        cookies: Object.fromEntries(cookies.map((c) => [c.name, c.value])),
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/statuses');

      const statuses = await knex('taskStatuses').select();
      expect(statuses).toHaveLength(1);
    });
  });

  describe('Task filtering', () => {
    it('should filter tasks by status', async () => {
      const userId = await createUser();
      const status1Id = await createStatus('Новый');
      const status2Id = await createStatus('В работе');
      const cookies = await signIn();

      await knex('tasks').insert({
        name: 'Задача 1',
        statusId: status1Id,
        creatorId: userId,
      });
      await knex('tasks').insert({
        name: 'Задача 2',
        statusId: status2Id,
        creatorId: userId,
      });

      const response = await server.inject({
        method: 'GET',
        url: `/tasks?status=${status1Id}`,
        cookies: Object.fromEntries(cookies.map((c) => [c.name, c.value])),
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('Задача 1');
      expect(response.body).not.toContain('Задача 2');
    });

    it('should filter tasks by executor', async () => {
      const creatorId = await createUser('creator@example.com');
      const executor1Id = await createUser('executor1@example.com');
      const executor2Id = await createUser('executor2@example.com');
      const statusId = await createStatus();
      const cookies = await signIn('creator@example.com');

      await knex('tasks').insert({
        name: 'Задача исполнителя 1',
        statusId,
        creatorId,
        executorId: executor1Id,
      });
      await knex('tasks').insert({
        name: 'Задача исполнителя 2',
        statusId,
        creatorId,
        executorId: executor2Id,
      });

      const response = await server.inject({
        method: 'GET',
        url: `/tasks?executor=${executor1Id}`,
        cookies: Object.fromEntries(cookies.map((c) => [c.name, c.value])),
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('Задача исполнителя 1');
      expect(response.body).not.toContain('Задача исполнителя 2');
    });

    it('should filter tasks by label', async () => {
      const userId = await createUser();
      const statusId = await createStatus();
      const cookies = await signIn();

      const [label1Id] = await knex('labels').insert({ name: 'Важное' });
      const [label2Id] = await knex('labels').insert({ name: 'Срочное' });

      const [task1Id] = await knex('tasks').insert({
        name: 'Задача с меткой 1',
        statusId,
        creatorId: userId,
      });
      const [task2Id] = await knex('tasks').insert({
        name: 'Задача с меткой 2',
        statusId,
        creatorId: userId,
      });

      await knex('tasksLabels').insert({ taskId: task1Id, labelId: label1Id });
      await knex('tasksLabels').insert({ taskId: task2Id, labelId: label2Id });

      const response = await server.inject({
        method: 'GET',
        url: `/tasks?label=${label1Id}`,
        cookies: Object.fromEntries(cookies.map((c) => [c.name, c.value])),
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('Задача с меткой 1');
      expect(response.body).not.toContain('Задача с меткой 2');
    });

    it('should filter tasks by creator (isCreatorUser)', async () => {
      const user1Id = await createUser('user1@example.com');
      const user2Id = await createUser('user2@example.com');
      const statusId = await createStatus();
      const cookies = await signIn('user1@example.com');

      await knex('tasks').insert({
        name: 'Задача пользователя 1',
        statusId,
        creatorId: user1Id,
      });
      await knex('tasks').insert({
        name: 'Задача пользователя 2',
        statusId,
        creatorId: user2Id,
      });

      const response = await server.inject({
        method: 'GET',
        url: '/tasks?isCreatorUser=1',
        cookies: Object.fromEntries(cookies.map((c) => [c.name, c.value])),
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('Задача пользователя 1');
      expect(response.body).not.toContain('Задача пользователя 2');
    });

    it('should filter tasks by multiple criteria', async () => {
      const user1Id = await createUser('user1@example.com');
      const user2Id = await createUser('user2@example.com');
      const status1Id = await createStatus('Новый');
      const status2Id = await createStatus('В работе');
      const cookies = await signIn('user1@example.com');

      await knex('tasks').insert({
        name: 'Задача 1 - Новый статус, пользователь 1',
        statusId: status1Id,
        creatorId: user1Id,
      });
      await knex('tasks').insert({
        name: 'Задача 2 - В работе, пользователь 1',
        statusId: status2Id,
        creatorId: user1Id,
      });
      await knex('tasks').insert({
        name: 'Задача 3 - Новый статус, пользователь 2',
        statusId: status1Id,
        creatorId: user2Id,
      });

      const response = await server.inject({
        method: 'GET',
        url: `/tasks?status=${status1Id}&isCreatorUser=1`,
        cookies: Object.fromEntries(cookies.map((c) => [c.name, c.value])),
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('Задача 1 - Новый статус, пользователь 1');
      expect(response.body).not.toContain('Задача 2 - В работе, пользователь 1');
      expect(response.body).not.toContain('Задача 3 - Новый статус, пользователь 2');
    });

    it('should show filter form with correct elements', async () => {
      await createUser();
      const cookies = await signIn();

      const response = await server.inject({
        method: 'GET',
        url: '/tasks',
        cookies: Object.fromEntries(cookies.map((c) => [c.name, c.value])),
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('name="status"');
      expect(response.body).toContain('name="executor"');
      expect(response.body).toContain('name="label"');
      expect(response.body).toContain('name="isCreatorUser"');
      expect(response.body).toContain('Показать');
    });
  });
});
