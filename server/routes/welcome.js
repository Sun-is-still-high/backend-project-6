export default (app) => {
  app.get('/', async (request, reply) => reply.render('index.pug'));
};
