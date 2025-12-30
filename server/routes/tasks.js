import i18next from 'i18next';
import Task from '../models/Task.js';
import TaskStatus from '../models/TaskStatus.js';
import User from '../models/User.js';
import Label from '../models/Label.js';

export default (app) => {
  app.get('/tasks', async (request, reply) => {
    const { currentUser } = request;

    if (!currentUser) {
      request.flash('error', i18next.t('flash.authError'));
      return reply.redirect('/session/new');
    }

    const {
      status, executor, label, isCreatorUser,
    } = request.query;

    let query = Task.query().withGraphFetched('[status, creator, executor]');

    if (status) {
      query = query.where('statusId', status);
    }

    if (executor) {
      query = query.where('executorId', executor);
    }

    if (label) {
      query = query.whereExists(
        Task.relatedQuery('labels').where('labels.id', label),
      );
    }

    if (isCreatorUser && currentUser) {
      query = query.where('creatorId', currentUser.id);
    }

    const tasks = await query;

    // Load labels for each task manually
    const knex = Task.knex();
    const taskIds = tasks.map((t) => t.id);
    if (taskIds.length > 0) {
      const taskLabelRows = await knex('tasksLabels').whereIn('taskId', taskIds);
      const labelIdsSet = [...new Set(taskLabelRows.map((r) => r.labelId))];
      const allTaskLabels = labelIdsSet.length > 0
        ? await Label.query().whereIn('id', labelIdsSet)
        : [];
      const labelsMap = new Map(allTaskLabels.map((l) => [l.id, l]));

      tasks.forEach((task, index) => {
        const taskLabelIds = taskLabelRows
          .filter((r) => r.taskId === task.id)
          .map((r) => r.labelId);
        tasks[index].labels = taskLabelIds.map((lid) => labelsMap.get(lid)).filter(Boolean);
      });
    }

    const statuses = await TaskStatus.query();
    const users = await User.query();
    const labels = await Label.query();

    const filter = {
      status: status ? Number(status) : null,
      executor: executor ? Number(executor) : null,
      label: label ? Number(label) : null,
      isCreatorUser: !!isCreatorUser,
    };

    return reply.render('tasks/index.pug', {
      tasks, statuses, users, labels, filter,
    });
  });

  app.get('/tasks/new', async (request, reply) => {
    const { currentUser } = request;

    if (!currentUser) {
      request.flash('error', i18next.t('flash.authError'));
      return reply.redirect('/session/new');
    }

    const task = new Task();
    const statuses = await TaskStatus.query();
    const users = await User.query();
    const labels = await Label.query();
    return reply.render('tasks/new.pug', {
      task, statuses, users, labels, errors: {},
    });
  });

  app.post('/tasks', async (request, reply) => {
    const { currentUser } = request;

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
          taskId: newTask.id,
          labelId,
        }));
        await knex('tasksLabels').insert(labelRows);
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
    const { currentUser } = request;

    if (!currentUser) {
      request.flash('error', i18next.t('flash.authError'));
      return reply.redirect('/session/new');
    }

    const { id } = request.params;

    const task = await Task.query()
      .findById(id)
      .withGraphFetched('[status, creator, executor]');

    if (!task) {
      request.flash('error', i18next.t('flash.tasks.show.notFound'));
      return reply.redirect('/tasks');
    }

    // Load labels manually via join table
    const knex = Task.knex();
    const labelIds = await knex('tasksLabels').where('taskId', id).pluck('labelId');
    if (labelIds.length > 0) {
      task.labels = await Label.query().whereIn('id', labelIds);
    } else {
      task.labels = [];
    }

    return reply.render('tasks/show.pug', { task });
  });

  app.get('/tasks/:id/edit', async (request, reply) => {
    const { id } = request.params;
    const { currentUser } = request;

    if (!currentUser) {
      request.flash('error', i18next.t('flash.authError'));
      return reply.redirect('/session/new');
    }

    const task = await Task.query().findById(id);
    if (!task) {
      request.flash('error', i18next.t('flash.tasks.edit.notFound'));
      return reply.redirect('/tasks');
    }

    // Load labels manually
    const knex = Task.knex();
    const labelIds = await knex('tasksLabels').where('taskId', id).pluck('labelId');
    task.labels = labelIds.length > 0 ? await Label.query().whereIn('id', labelIds) : [];

    const statuses = await TaskStatus.query();
    const users = await User.query();
    const labels = await Label.query();
    return reply.render('tasks/edit.pug', {
      task, statuses, users, labels, errors: {},
    });
  });

  app.patch('/tasks/:id', async (request, reply) => {
    const { id } = request.params;
    const { currentUser } = request;

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
      const taskWithLabels = await Task.query().findById(id);
      const knex = Task.knex();
      const taskLabelIds = await knex('tasksLabels').where('taskId', id).pluck('labelId');
      taskWithLabels.labels = taskLabelIds.length > 0 ? await Label.query().whereIn('id', taskLabelIds) : [];
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
      await knex('tasksLabels').where('taskId', id).delete();
      if (labelIds.length > 0) {
        const labelRows = labelIds.map((labelId) => ({
          taskId: Number(id),
          labelId,
        }));
        await knex('tasksLabels').insert(labelRows);
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

  app.post('/tasks/:id', async (request, reply) => {
    const { method: methodOverride } = request.body || {};
    const method = methodOverride?.toUpperCase();
    if (method === 'PATCH') {
      const { id } = request.params;
      const { currentUser } = request;

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
        const taskWithLabels = await Task.query().findById(id);
        const knex = Task.knex();
        const taskLabelIds = await knex('tasksLabels').where('taskId', id).pluck('labelId');
        taskWithLabels.labels = taskLabelIds.length > 0 ? await Label.query().whereIn('id', taskLabelIds) : [];
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

        await knex('tasksLabels').where('taskId', id).delete();
        if (labelIds.length > 0) {
          const labelRows = labelIds.map((labelId) => ({
            taskId: Number(id),
            labelId,
          }));
          await knex('tasksLabels').insert(labelRows);
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
    }
    if (method === 'DELETE') {
      const { id } = request.params;
      const { currentUser } = request;

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
    }
    return reply.code(405).send({ error: 'Method not allowed' });
  });

  app.delete('/tasks/:id', async (request, reply) => {
    const { id } = request.params;
    const { currentUser } = request;

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
