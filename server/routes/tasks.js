import i18next from 'i18next';
import Task from '../models/Task.js';
import TaskStatus from '../models/TaskStatus.js';
import User from '../models/User.js';

export default (app) => {
  app.get('/tasks', async (request, reply) => {
    const tasks = await Task.query()
      .withGraphFetched('[status, creator, executor]');
    return reply.render('tasks/index.pug', { tasks });
  });

  app.get('/tasks/new', async (request, reply) => {
    const currentUser = request.currentUser;

    if (!currentUser) {
      request.flash('error', i18next.t('flash.authError'));
      return reply.redirect('/session/new');
    }

    const task = new Task();
    const statuses = await TaskStatus.query();
    const users = await User.query();
    return reply.render('tasks/new.pug', { task, statuses, users, errors: {} });
  });

  app.post('/tasks', async (request, reply) => {
    const currentUser = request.currentUser;

    if (!currentUser) {
      request.flash('error', i18next.t('flash.authError'));
      return reply.redirect('/session/new');
    }

    const { data } = request.body;
    const errors = {};

    if (!data.name || data.name.length < 1) {
      errors.name = [{ message: i18next.t('views.tasks.errors.nameRequired') }];
    }
    if (!data.statusId) {
      errors.statusId = [{ message: i18next.t('views.tasks.errors.statusRequired') }];
    }

    if (Object.keys(errors).length > 0) {
      request.flash('error', i18next.t('flash.tasks.create.error'));
      const statuses = await TaskStatus.query();
      const users = await User.query();
      return reply.code(422).render('tasks/new.pug', {
        task: data,
        statuses,
        users,
        errors,
      });
    }

    const taskData = {
      name: data.name,
      description: data.description || null,
      statusId: Number(data.statusId),
      creatorId: currentUser.id,
      executorId: data.executorId ? Number(data.executorId) : null,
    };

    try {
      await Task.query().insert(taskData);
      request.flash('info', i18next.t('flash.tasks.create.success'));
      return reply.redirect('/tasks');
    } catch (error) {
      request.flash('error', i18next.t('flash.tasks.create.error'));
      const statuses = await TaskStatus.query();
      const users = await User.query();
      return reply.code(422).render('tasks/new.pug', {
        task: data,
        statuses,
        users,
        errors: error.data || {},
      });
    }
  });

  app.get('/tasks/:id', async (request, reply) => {
    const { id } = request.params;

    const task = await Task.query()
      .findById(id)
      .withGraphFetched('[status, creator, executor]');

    if (!task) {
      request.flash('error', i18next.t('flash.tasks.show.notFound'));
      return reply.redirect('/tasks');
    }

    return reply.render('tasks/show.pug', { task });
  });

  app.get('/tasks/:id/edit', async (request, reply) => {
    const { id } = request.params;
    const currentUser = request.currentUser;

    if (!currentUser) {
      request.flash('error', i18next.t('flash.authError'));
      return reply.redirect('/session/new');
    }

    const task = await Task.query().findById(id);
    if (!task) {
      request.flash('error', i18next.t('flash.tasks.edit.notFound'));
      return reply.redirect('/tasks');
    }

    const statuses = await TaskStatus.query();
    const users = await User.query();
    return reply.render('tasks/edit.pug', { task, statuses, users, errors: {} });
  });

  app.patch('/tasks/:id', async (request, reply) => {
    const { id } = request.params;
    const currentUser = request.currentUser;

    if (!currentUser) {
      request.flash('error', i18next.t('flash.authError'));
      return reply.redirect('/session/new');
    }

    const task = await Task.query().findById(id);
    if (!task) {
      request.flash('error', i18next.t('flash.tasks.edit.notFound'));
      return reply.redirect('/tasks');
    }

    const { data } = request.body;
    const errors = {};

    if (!data.name || data.name.length < 1) {
      errors.name = [{ message: i18next.t('views.tasks.errors.nameRequired') }];
    }
    if (!data.statusId) {
      errors.statusId = [{ message: i18next.t('views.tasks.errors.statusRequired') }];
    }

    if (Object.keys(errors).length > 0) {
      request.flash('error', i18next.t('flash.tasks.edit.error'));
      const statuses = await TaskStatus.query();
      const users = await User.query();
      return reply.code(422).render('tasks/edit.pug', {
        task: { ...task, ...data },
        statuses,
        users,
        errors,
      });
    }

    const taskData = {
      name: data.name,
      description: data.description || null,
      statusId: Number(data.statusId),
      executorId: data.executorId ? Number(data.executorId) : null,
    };

    try {
      await task.$query().patch(taskData);
      request.flash('info', i18next.t('flash.tasks.edit.success'));
      return reply.redirect('/tasks');
    } catch (error) {
      request.flash('error', i18next.t('flash.tasks.edit.error'));
      const statuses = await TaskStatus.query();
      const users = await User.query();
      return reply.code(422).render('tasks/edit.pug', {
        task: { ...task, ...data },
        statuses,
        users,
        errors: error.data || {},
      });
    }
  });

  app.delete('/tasks/:id', async (request, reply) => {
    const { id } = request.params;
    const currentUser = request.currentUser;

    if (!currentUser) {
      request.flash('error', i18next.t('flash.authError'));
      return reply.redirect('/session/new');
    }

    const task = await Task.query().findById(id);
    if (!task) {
      request.flash('error', i18next.t('flash.tasks.delete.notFound'));
      return reply.redirect('/tasks');
    }

    if (task.creatorId !== currentUser.id) {
      request.flash('error', i18next.t('flash.tasks.delete.accessError'));
      return reply.redirect('/tasks');
    }

    await Task.query().deleteById(id);
    request.flash('info', i18next.t('flash.tasks.delete.success'));
    return reply.redirect('/tasks');
  });
};
