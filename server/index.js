// @ts-check

import Fastify from 'fastify';

const app = async () => {
  const fastify = Fastify({
    logger: true,
  });

  fastify.get('/', async (request, reply) => {
    return 'Hello, World!';
  });

  return fastify;
};

export default app;
