export default (app) => {
  app.get('/', async (request, reply) => {
    return reply.render('index.pug');
  });
};
