import i18next from 'i18next';
import User from '../models/User.js';
import encrypt from '../lib/secure.js';

export default (app) => {
  app.get('/session/new', async (request, reply) => reply.render('session/new.pug', { errors: {} }));

  app.post('/session', async (request, reply) => {
    const { data } = request.body;

    if (!data) {
      request.flash('error', i18next.t('flash.session.create.error'));
      return reply.code(422).render('session/new.pug', {
        email: '',
        errors: { email: [{ message: 'Данные не получены' }] },
      });
    }

    const { email, password } = data;

    if (!email || !password) {
      request.flash('error', i18next.t('flash.session.create.error'));
      return reply.code(422).render('session/new.pug', {
        email: email || '',
        errors: { email: [{ message: i18next.t('flash.session.create.error') }] },
      });
    }

    const user = await User.query().findOne({ email });

    if (!user || user.passwordDigest !== encrypt(password)) {
      request.flash('error', i18next.t('flash.session.create.error'));
      return reply.code(422).render('session/new.pug', {
        email,
        errors: { email: [{ message: i18next.t('flash.session.create.error') }] },
      });
    }

    await request.logIn(user);
    request.flash('info', i18next.t('flash.session.create.success'));
    return reply.redirect('/');
  });

  app.delete('/session', async (request, reply) => {
    await request.logOut();
    request.flash('info', i18next.t('flash.session.delete.success'));
    return reply.redirect('/');
  });

  app.post('/session/delete', async (request, reply) => {
    await request.logOut();
    request.flash('info', i18next.t('flash.session.delete.success'));
    return reply.redirect('/');
  });
};
