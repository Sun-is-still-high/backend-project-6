import i18next from 'i18next';
import Label from '../models/Label.js';

const handleLabelUpdate = async (request, reply) => {
  const { id } = request.params;
  const currentUser = request.currentUser;

  if (!currentUser) {
    request.flash('error', i18next.t('flash.authError'));
    return reply.redirect('/session/new');
  }

  const label = await Label.query().findById(id);
  if (!label) {
    request.flash('error', i18next.t('flash.labels.edit.notFound'));
    return reply.redirect('/labels');
  }

  const { data } = request.body;

  if (!data) {
    request.flash('error', i18next.t('flash.labels.edit.error'));
    return reply.code(422).render('labels/edit.pug', {
      label,
      errors: { name: [{ message: i18next.t('views.labels.errors.nameRequired') }] },
    });
  }

  const errors = {};

  if (!data.name || data.name.length < 1) {
    errors.name = [{ message: i18next.t('views.labels.errors.nameRequired') }];
  }

  if (Object.keys(errors).length > 0) {
    request.flash('error', i18next.t('flash.labels.edit.error'));
    return reply.code(422).render('labels/edit.pug', {
      label: { ...label, ...data },
      errors,
    });
  }

  try {
    await label.$query().patch({ name: data.name });
    request.flash('info', i18next.t('flash.labels.edit.success'));
    return reply.redirect('/labels');
  } catch (error) {
    request.flash('error', i18next.t('flash.labels.edit.error'));
    return reply.code(422).render('labels/edit.pug', {
      label: { ...label, ...data },
      errors: error.data || {},
    });
  }
};

const handleLabelDelete = async (request, reply) => {
  const { id } = request.params;
  const currentUser = request.currentUser;

  if (!currentUser) {
    request.flash('error', i18next.t('flash.authError'));
    return reply.redirect('/session/new');
  }

  const label = await Label.query().findById(id);
  if (!label) {
    request.flash('error', i18next.t('flash.labels.delete.notFound'));
    return reply.redirect('/labels');
  }

  const knex = Label.knex();
  const tasksCount = await knex('tasks_labels').where('label_id', id).count('* as count').first();
  if (tasksCount.count > 0) {
    request.flash('error', i18next.t('flash.labels.delete.hasTasks'));
    return reply.redirect('/labels');
  }

  await Label.query().deleteById(id);
  request.flash('info', i18next.t('flash.labels.delete.success'));
  return reply.redirect('/labels');
};

export default (app) => {
  app.get('/labels', async (request, reply) => {
    const currentUser = request.currentUser;

    if (!currentUser) {
      request.flash('error', i18next.t('flash.authError'));
      return reply.redirect('/session/new');
    }

    const labels = await Label.query();
    return reply.render('labels/index.pug', { labels });
  });

  app.get('/labels/new', async (request, reply) => {
    const currentUser = request.currentUser;

    if (!currentUser) {
      request.flash('error', i18next.t('flash.authError'));
      return reply.redirect('/session/new');
    }

    const label = new Label();
    return reply.render('labels/new.pug', { label, errors: {} });
  });

  app.post('/labels', async (request, reply) => {
    const currentUser = request.currentUser;

    if (!currentUser) {
      request.flash('error', i18next.t('flash.authError'));
      return reply.redirect('/session/new');
    }

    const { data } = request.body;

    if (!data) {
      request.flash('error', i18next.t('flash.labels.create.error'));
      return reply.code(422).render('labels/new.pug', {
        label: {},
        errors: { name: [{ message: i18next.t('views.labels.errors.nameRequired') }] },
      });
    }

    const errors = {};

    if (!data.name || data.name.length < 1) {
      errors.name = [{ message: i18next.t('views.labels.errors.nameRequired') }];
    }

    if (Object.keys(errors).length > 0) {
      request.flash('error', i18next.t('flash.labels.create.error'));
      return reply.code(422).render('labels/new.pug', {
        label: data,
        errors,
      });
    }

    try {
      await Label.query().insert({ name: data.name });
      request.flash('info', i18next.t('flash.labels.create.success'));
      return reply.redirect('/labels');
    } catch (error) {
      request.flash('error', i18next.t('flash.labels.create.error'));
      return reply.code(422).render('labels/new.pug', {
        label: data,
        errors: error.data || {},
      });
    }
  });

  app.get('/labels/:id/edit', async (request, reply) => {
    const { id } = request.params;
    const currentUser = request.currentUser;

    if (!currentUser) {
      request.flash('error', i18next.t('flash.authError'));
      return reply.redirect('/session/new');
    }

    const label = await Label.query().findById(id);
    if (!label) {
      request.flash('error', i18next.t('flash.labels.edit.notFound'));
      return reply.redirect('/labels');
    }

    return reply.render('labels/edit.pug', { label, errors: {} });
  });

  app.patch('/labels/:id', async (request, reply) => {
    return handleLabelUpdate(request, reply);
  });

  app.post('/labels/:id', async (request, reply) => {
    const method = request.query._method?.toUpperCase();
    if (method === 'PATCH') {
      return handleLabelUpdate(request, reply);
    }
    if (method === 'DELETE') {
      return handleLabelDelete(request, reply);
    }
    return reply.code(405).send({ error: 'Method not allowed' });
  });

  app.delete('/labels/:id', async (request, reply) => {
    return handleLabelDelete(request, reply);
  });
};
