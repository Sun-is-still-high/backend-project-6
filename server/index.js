// @ts-check

import path from 'path';
import { fileURLToPath } from 'url';
import Fastify from 'fastify';
import view from '@fastify/view';
import fastifyStatic from '@fastify/static';
import pug from 'pug';
import i18next from 'i18next';

import en from './locales/en.js';
import ru from './locales/ru.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const setupLocalization = async () => {
  await i18next.init({
    lng: 'en',
    fallbackLng: 'en',
    resources: {
      en,
      ru,
    },
  });
};

const app = async () => {
  await setupLocalization();

  const fastify = Fastify({
    logger: true,
  });

  await fastify.register(fastifyStatic, {
    root: path.join(__dirname, '..', 'dist'),
    prefix: '/assets/',
  });

  await fastify.register(view, {
    engine: { pug },
    root: path.join(__dirname, 'views'),
    defaultContext: {
      t: (key) => i18next.t(key),
    },
  });

  fastify.get('/', async (request, reply) => {
    return reply.view('index.pug');
  });

  return fastify;
};

export default app;
