#!/usr/bin/env node
// @ts-check

import 'dotenv/config';
import app from '../server/index.js';

const port = process.env.PORT || 5000;
const host = process.env.HOST || '0.0.0.0';

const start = async () => {
  const fastify = await app();

  try {
    await fastify.listen({ port: Number(port), host });
    console.log(`Server is running on http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
