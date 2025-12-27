import i18next from 'i18next';
import TaskStatus from '../models/TaskStatus.js';
import Task from '../models/Task.js';

const handleStatusUpdate = async (request, reply) => {
  const { id } = request.params;
  const currentUser = request.currentUser;

  if (!currentUser) {
    request.flash('error', i18next.t('flash.authError'));
    return reply.redirect('/session/new');
  }

  const status = await TaskStatus.query().findById(id);
  if (!status) {
    request.flash('error', i18next.t('flash.statuses.edit.notFound'));
    return reply.redirect('/statuses');
  }

  const { data } = request.body;

  if (!data) {
    request.flash('error', i18next.t('flash.statuses.edit.error'));
    return reply.code(422).render('statuses/edit.pug', {
      status,
      errors: { name: [{ message: i18next.t('views.statuses.errors.nameRequired') }] },
    });
  }

  const errors = {};

  if (!data.name || data.name.length < 1) {
    errors.name = [{ message: i18next.t('views.statuses.errors.nameRequired') }];
  }

  if (Object.keys(errors).length > 0) {
    request.flash('error', i18next.t('flash.statuses.edit.error'));
    return reply.code(422).render('statuses/edit.pug', {
      status: { ...status, ...data },
      errors,
    });
  }

  try {
    await status.$query().patch({ name: data.name });
    request.flash('info', i18next.t('flash.statuses.edit.success'));
    return reply.redirect('/statuses');
  } catch (error) {
    request.flash('error', i18next.t('flash.statuses.edit.error'));
    return reply.code(422).render('statuses/edit.pug', {
      status: { ...status, ...data },
      errors: error.data || {},
    });
  }
};

const handleStatusDelete = async (request, reply) => {
  const { id } = request.params;
  const currentUser = request.currentUser;

  if (!currentUser) {
    request.flash('error', i18next.t('flash.authError'));
    return reply.redirect('/session/new');
  }

  const status = await TaskStatus.query().findById(id);
  if (!status) {
    request.flash('error', i18next.t('flash.statuses.delete.notFound'));
    return reply.redirect('/statuses');
  }

  const tasksCount = await Task.query().where('status_id', id).resultSize();
  if (tasksCount > 0) {
    request.flash('error', i18next.t('flash.statuses.delete.hasTasks'));
    return reply.redirect('/statuses');
  }

  await TaskStatus.query().deleteById(id);
  request.flash('info', i18next.t('flash.statuses.delete.success'));
  return reply.redirect('/statuses');
};

export default (app) => {
  app.get('/statuses', async (request, reply) => {
    const currentUser = request.currentUser;

    if (!currentUser) {
      request.flash('error', i18next.t('flash.authError'));
      return reply.redirect('/session/new');
    }

    const statuses = await TaskStatus.query();
    return reply.render('statuses/index.pug', { statuses });
  });

  app.get('/statuses/new', async (request, reply) => {
    const currentUser = request.currentUser;

    if (!currentUser) {
      request.flash('error', i18next.t('flash.authError'));
      return reply.redirect('/session/new');
    }

    const status = new TaskStatus();
    return reply.render('statuses/new.pug', { status, errors: {} });
  });

  app.post('/statuses', async (request, reply) => {
    const currentUser = request.currentUser;

    if (!currentUser) {
      request.flash('error', i18next.t('flash.authError'));
      return reply.redirect('/session/new');
    }

    const { data } = request.body;

    if (!data) {
      request.flash('error', i18next.t('flash.statuses.create.error'));
      return reply.code(422).render('statuses/new.pug', {
        status: {},
        errors: { name: [{ message: i18next.t('views.statuses.errors.nameRequired') }] },
      });
    }

    const errors = {};

    if (!data.name || data.name.length < 1) {
      errors.name = [{ message: i18next.t('views.statuses.errors.nameRequired') }];
    }

    if (Object.keys(errors).length > 0) {
      request.flash('error', i18next.t('flash.statuses.create.error'));
      return reply.code(422).render('statuses/new.pug', {
        status: data,
        errors,
      });
    }

    try {
      await TaskStatus.query().insert({ name: data.name });
      request.flash('info', i18next.t('flash.statuses.create.success'));
      return reply.redirect('/statuses');
    } catch (error) {
      request.flash('error', i18next.t('flash.statuses.create.error'));
      return reply.code(422).render('statuses/new.pug', {
        status: data,
        errors: error.data || {},
      });
    }
  });

  app.get('/statuses/:id/edit', async (request, reply) => {
    const { id } = request.params;
    const currentUser = request.currentUser;

    if (!currentUser) {
      request.flash('error', i18next.t('flash.authError'));
      return reply.redirect('/session/new');
    }

    const status = await TaskStatus.query().findById(id);
    if (!status) {
      request.flash('error', i18next.t('flash.statuses.edit.notFound'));
      return reply.redirect('/statuses');
    }

    return reply.render('statuses/edit.pug', { status, errors: {} });
  });

  app.patch('/statuses/:id', async (request, reply) => {
    return handleStatusUpdate(request, reply);
  });

  app.post('/statuses/:id', async (request, reply) => {
    const method = request.query._method?.toUpperCase();
    if (method === 'PATCH') {
      return handleStatusUpdate(request, reply);
    }
    if (method === 'DELETE') {
      return handleStatusDelete(request, reply);
    }
    return reply.code(405).send({ error: 'Method not allowed' });
  });

  app.delete('/statuses/:id', async (request, reply) => {
    return handleStatusDelete(request, reply);
  });
};
