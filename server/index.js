// @ts-check

import path from 'path';
import { fileURLToPath } from 'url';
import Fastify from 'fastify';
import view from '@fastify/view';
import fastifyStatic from '@fastify/static';
import formbody from '@fastify/formbody';
import fastifySecureSession from '@fastify/secure-session';
import fastifyPassport from '@fastify/passport';
import pug from 'pug';
import i18next from 'i18next';
import Knex from 'knex';
import { Model } from 'objection';

import en from './locales/en.js';
import ru from './locales/ru.js';
import addRoutes from './routes/index.js';
import * as knexConfig from '../knexfile.js';

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
  const knex = Knex(config);
  Model.knex(knex);
  app.decorate('knex', knex);
  return knex;
};

const registerPlugins = async (app) => {
  await app.register(fastifyStatic, {
    root: path.join(__dirname, '..', 'dist'),
    prefix: '/assets/',
  });

  await app.register(formbody);

  app.addHook('preHandler', async (request, reply) => {
    if (request.method === 'POST' && request.query._method) {
      request.raw.method = request.query._method.toUpperCase();
    }
  });

  await app.register(fastifySecureSession, {
    secret: process.env.SESSION_SECRET || 'a-secret-with-minimum-length-of-32',
    cookie: {
      path: '/',
    },
  });

  fastifyPassport.registerUserSerializer(async (user) => user.id);
  fastifyPassport.registerUserDeserializer(async (userId) => {
    const { default: models } = await import('./models/index.js');
    return models.User.query().findById(userId);
  });

  await app.register(fastifyPassport.initialize());
  await app.register(fastifyPassport.secureSession());

  app.decorateRequest('currentUser', null);
  app.addHook('preHandler', async (request) => {
    if (request.user) {
      request.currentUser = request.user;
    }
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
      flash,
    });
  });
};

const app = async (envName = process.env.NODE_ENV || 'development') => {
  await setupLocalization();

  const config = knexConfig[envName];

  const fastify = Fastify({
    logger: envName !== 'test',
  });

  setupDatabase(fastify, config);
  await registerPlugins(fastify);
  await addRoutes(fastify);

  return fastify;
};

export default app;
