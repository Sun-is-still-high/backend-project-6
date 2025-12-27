import i18next from 'i18next';
import User from '../models/User.js';
import Task from '../models/Task.js';
import { encrypt } from '../lib/secure.js';

export default (app) => {
  app.get('/users', async (request, reply) => {
    const users = await User.query();
    return reply.render('users/index.pug', { users });
  });

  app.get('/users/new', async (request, reply) => {
    const user = new User();
    return reply.render('users/new.pug', { user, errors: {} });
  });

  app.post('/users', async (request, reply) => {
    const { data } = request.body;
    const errors = {};

    if (!data) {
      request.flash('error', i18next.t('flash.users.create.error'));
      return reply.code(422).render('users/new.pug', {
        user: {},
        errors: { firstName: [{ message: 'Данные не получены' }] },
      });
    }

    if (!data.password || data.password.length < 3) {
      errors.password = [{ message: 'Пароль должен содержать минимум 3 символа' }];
    }
    if (!data.firstName || data.firstName.length < 1) {
      errors.firstName = [{ message: 'Имя обязательно для заполнения' }];
    }
    if (!data.lastName || data.lastName.length < 1) {
      errors.lastName = [{ message: 'Фамилия обязательна для заполнения' }];
    }
    if (!data.email || !data.email.includes('@')) {
      errors.email = [{ message: 'Email должен быть корректным' }];
    }

    if (Object.keys(errors).length > 0) {
      request.flash('error', i18next.t('flash.users.create.error'));
      return reply.code(422).render('users/new.pug', {
        user: data,
        errors,
      });
    }

    const userData = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      passwordDigest: encrypt(data.password),
    };

    try {
      await User.query().insert(userData);
      request.flash('info', i18next.t('flash.users.create.success'));
      return reply.redirect('/');
    } catch (error) {
      request.flash('error', i18next.t('flash.users.create.error'));
      return reply.code(422).render('users/new.pug', {
        user: data,
        errors: error.data || {},
      });
    }
  });

  app.get('/users/:id/edit', async (request, reply) => {
    const { id } = request.params;
    const currentUser = request.currentUser;

    if (!currentUser) {
      request.flash('error', i18next.t('flash.authError'));
      return reply.redirect('/session/new');
    }

    if (currentUser.id !== Number(id)) {
      request.flash('error', i18next.t('flash.users.edit.accessError'));
      return reply.redirect('/users');
    }

    const user = await User.query().findById(id);
    if (!user) {
      request.flash('error', i18next.t('flash.users.edit.notFound'));
      return reply.redirect('/users');
    }

    return reply.render('users/edit.pug', { user, errors: {} });
  });

  app.patch('/users/:id', async (request, reply) => {
    const { id } = request.params;
    const currentUser = request.currentUser;

    if (!currentUser) {
      request.flash('error', i18next.t('flash.authError'));
      return reply.redirect('/session/new');
    }

    if (currentUser.id !== Number(id)) {
      request.flash('error', i18next.t('flash.users.edit.accessError'));
      return reply.redirect('/users');
    }

    const user = await User.query().findById(id);
    if (!user) {
      request.flash('error', i18next.t('flash.users.edit.notFound'));
      return reply.redirect('/users');
    }

    const { data } = request.body;
    if (!data) {
      request.flash('error', i18next.t('flash.users.edit.error'));
      return reply.code(422).render('users/edit.pug', {
        user,
        errors: {},
      });
    }

    const updateData = {
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
    };

    if (data.password) {
      updateData.password_digest = encrypt(data.password);
    }

    const knex = User.knex();
    await knex('users').where('id', id).update(updateData);
    request.flash('info', i18next.t('flash.users.edit.success'));
    return reply.redirect('/users');
  });

  app.delete('/users/:id', async (request, reply) => {
    const { id } = request.params;
    const currentUser = request.currentUser;

    if (!currentUser) {
      request.flash('error', i18next.t('flash.authError'));
      return reply.redirect('/session/new');
    }

    if (currentUser.id !== Number(id)) {
      request.flash('error', i18next.t('flash.users.delete.accessError'));
      return reply.redirect('/users');
    }

    const tasksCount = await Task.query()
      .where('creator_id', id)
      .orWhere('executor_id', id)
      .resultSize();

    if (tasksCount > 0) {
      request.flash('error', i18next.t('flash.users.delete.hasTasks'));
      return reply.redirect('/users');
    }

    await User.query().deleteById(id);
    request.logOut();
    request.flash('info', i18next.t('flash.users.delete.success'));
    return reply.redirect('/users');
  });
};
