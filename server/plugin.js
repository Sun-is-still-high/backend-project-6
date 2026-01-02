// @ts-check

import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import view from '@fastify/view';
import fastifyStatic from '@fastify/static';
import formbody from '@fastify/formbody';
import qs from 'qs';
import fastifySecureSession from '@fastify/secure-session';
import fastifyPassport from '@fastify/passport';
import pug from 'pug';
import i18next from 'i18next';
import Knex from 'knex';
import { Model } from 'objection';
import rollbar from './lib/rollbar.js';

import en from './locales/en.js';
import ru from './locales/ru.js';
import addRoutes from './routes/index.js';
import * as knexConfig from '../knexfile.js';
import User from './models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const setupLocalization = async () => {
  await i18next.init({
    lng: 'ru',
    fallbackLng: 'ru',
    resources: {
      en,
      ru,
    },
  });
};

const setupDatabase = (app, config) => {
  const knex = new Knex(config);
  Model.knex(knex);
  app.decorate('knex', knex);
  app.decorate('objection', { knex });
  return knex;
};

const registerPlugins = async (app) => {
  await app.register(fastifyStatic, {
    root: path.join(__dirname, '..', 'dist'),
    prefix: '/assets/',
  });

  await app.register(formbody, { parser: (str) => qs.parse(str) });

  await app.register(fastifySecureSession, {
    secret: process.env.SESSION_SECRET || 'a-secret-with-minimum-length-of-32',
    cookie: {
      path: '/',
    },
  });

  fastifyPassport.registerUserSerializer(async (user) => user.id);
  fastifyPassport.registerUserDeserializer(async (userId) => User.query().findById(userId));

  await app.register(fastifyPassport.initialize());
  await app.register(fastifyPassport.secureSession());

  if (!app.hasRequestDecorator('currentUser')) {
    app.decorateRequest('currentUser', null);
  }
  if (!app.hasRequestDecorator('lang')) {
    app.decorateRequest('lang', 'ru');
  }
  if (!app.hasRequestDecorator('flash')) {
    app.decorateRequest('flash', function (type, message) {
      const flash = this.session.get('flash') || {};
      flash[type] = message;
      this.session.set('flash', flash);
    });
  }
  app.addHook('preHandler', async (req) => {
    if (req.user) {
      req.currentUser = req.user;
    }
    const lang = req.session?.get('lang') || 'ru';
    await i18next.changeLanguage(lang);
    req.lang = lang;
  });

  await app.register(view, {
    engine: { pug },
    root: path.join(__dirname, 'views'),
    defaultContext: {
      t: (key) => i18next.t(key),
    },
  });

  app.decorateReply('render', function render(viewPath, data = {}) {
    const flash = this.request.session?.get('flash') || {};
    this.request.session?.set('flash', {});

    return this.view(viewPath, {
      ...data,
      currentUser: this.request.currentUser,
      currentLang: this.request.lang,
      flash,
    });
  });
};

export const options = {};

export default async (app, opts = {}) => {
  await setupLocalization();

  const envName = opts.envName || process.env.NODE_ENV || 'development';
  const config = knexConfig[envName] || knexConfig.development;

  setupDatabase(app, config);
  await registerPlugins(app);
  await addRoutes(app);

  app.setErrorHandler((error, request, reply) => {
    rollbar.error(error, request);
    app.log.error(error);
    reply.status(500).send({ error: 'Internal Server Error' });
  });

  app.setNotFoundHandler((request, reply) => {
    rollbar.warning(`404 Not Found: ${request.method} ${request.url}`, request);
    reply.status(404).send({ error: 'Not Found' });
  });

  return app;
};
