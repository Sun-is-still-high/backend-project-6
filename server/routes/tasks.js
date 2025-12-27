import i18next from 'i18next';
import Task from '../models/Task.js';
import TaskStatus from '../models/TaskStatus.js';
import User from '../models/User.js';
import Label from '../models/Label.js';

export default (app) => {
  app.get('/tasks', async (request, reply) => {
    const currentUser = request.currentUser;

    if (!currentUser) {
      request.flash('error', i18next.t('flash.authError'));
      return reply.redirect('/session/new');
    }

    const { status, executor, label, isCreatorUser } = request.query;

    let query = Task.query().withGraphFetched('[status, creator, executor, labels]');

    if (status) {
      query = query.where('status_id', status);
    }

    if (executor) {
      query = query.where('executor_id', executor);
    }

    if (label) {
      query = query.whereExists(
        Task.relatedQuery('labels').where('labels.id', label),
      );
    }

    if (isCreatorUser && currentUser) {
      query = query.where('creator_id', currentUser.id);
    }

    const tasks = await query;
    const statuses = await TaskStatus.query();
    const users = await User.query();
    const labels = await Label.query();

    const filter = {
      status: status ? Number(status) : null,
      executor: executor ? Number(executor) : null,
      label: label ? Number(label) : null,
      isCreatorUser: !!isCreatorUser,
    };

    return reply.render('tasks/index.pug', { tasks, statuses, users, labels, filter });
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
    const labels = await Label.query();
    return reply.render('tasks/new.pug', { task, statuses, users, labels, errors: {} });
  });

  app.post('/tasks', async (request, reply) => {
    const currentUser = request.currentUser;

    if (!currentUser) {
      request.flash('error', i18next.t('flash.authError'));
      return reply.redirect('/session/new');
    }

    const { data } = request.body;

    if (!data) {
      request.flash('error', i18next.t('flash.tasks.create.error'));
      const statuses = await TaskStatus.query();
      const users = await User.query();
      const labels = await Label.query();
      return reply.code(422).render('tasks/new.pug', {
        task: {},
        statuses,
        users,
        labels,
        errors: { name: [{ message: i18next.t('views.tasks.errors.nameRequired') }] },
      });
    }

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
      const labels = await Label.query();
      return reply.code(422).render('tasks/new.pug', {
        task: { ...data, labelIds: data.labels },
        statuses,
        users,
        labels,
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

    const labelIds = data.labels
      ? (Array.isArray(data.labels) ? data.labels : [data.labels]).map(Number)
      : [];

    try {
      const knex = Task.knex();
      const newTask = await Task.query().insert(taskData);

      if (labelIds.length > 0) {
        const labelRows = labelIds.map((labelId) => ({
          task_id: newTask.id,
          label_id: labelId,
        }));
        await knex('tasks_labels').insert(labelRows);
      }

      request.flash('info', i18next.t('flash.tasks.create.success'));
      return reply.redirect('/tasks');
    } catch (error) {
      request.flash('error', i18next.t('flash.tasks.create.error'));
      const statuses = await TaskStatus.query();
      const users = await User.query();
      const labels = await Label.query();
      return reply.code(422).render('tasks/new.pug', {
        task: { ...data, labelIds: data.labels },
        statuses,
        users,
        labels,
        errors: error.data || {},
      });
    }
  });

  app.get('/tasks/:id', async (request, reply) => {
    const currentUser = request.currentUser;

    if (!currentUser) {
      request.flash('error', i18next.t('flash.authError'));
      return reply.redirect('/session/new');
    }

    const { id } = request.params;

    const task = await Task.query()
      .findById(id)
      .withGraphFetched('[status, creator, executor, labels]');

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

    const task = await Task.query()
      .findById(id)
      .withGraphFetched('labels');
    if (!task) {
      request.flash('error', i18next.t('flash.tasks.edit.notFound'));
      return reply.redirect('/tasks');
    }

    const statuses = await TaskStatus.query();
    const users = await User.query();
    const labels = await Label.query();
    return reply.render('tasks/edit.pug', { task, statuses, users, labels, errors: {} });
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

    if (!data) {
      request.flash('error', i18next.t('flash.tasks.edit.error'));
      const taskWithLabels = await Task.query().findById(id).withGraphFetched('labels');
      const statuses = await TaskStatus.query();
      const users = await User.query();
      const labels = await Label.query();
      return reply.code(422).render('tasks/edit.pug', {
        task: taskWithLabels,
        statuses,
        users,
        labels,
        errors: { name: [{ message: i18next.t('views.tasks.errors.nameRequired') }] },
      });
    }

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
      const labels = await Label.query();
      return reply.code(422).render('tasks/edit.pug', {
        task: { ...task, ...data, labelIds: data.labels },
        statuses,
        users,
        labels,
        errors,
      });
    }

    const taskData = {
      name: data.name,
      description: data.description || null,
      statusId: Number(data.statusId),
      executorId: data.executorId ? Number(data.executorId) : null,
    };

    const labelIds = data.labels
      ? (Array.isArray(data.labels) ? data.labels : [data.labels]).map(Number)
      : [];

    try {
      const knex = Task.knex();
      await task.$query().patch(taskData);

      // Update labels: delete old and insert new
      await knex('tasks_labels').where('task_id', id).delete();
      if (labelIds.length > 0) {
        const labelRows = labelIds.map((labelId) => ({
          task_id: Number(id),
          label_id: labelId,
        }));
        await knex('tasks_labels').insert(labelRows);
      }

      request.flash('info', i18next.t('flash.tasks.edit.success'));
      return reply.redirect('/tasks');
    } catch (error) {
      request.flash('error', i18next.t('flash.tasks.edit.error'));
      const statuses = await TaskStatus.query();
      const users = await User.query();
      const labels = await Label.query();
      return reply.code(422).render('tasks/edit.pug', {
        task: { ...task, ...data, labelIds: data.labels },
        statuses,
        users,
        labels,
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
