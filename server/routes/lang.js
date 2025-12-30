export default (app) => {
  app.post('/lang', async (request, reply) => {
    const { lang } = request.body;
    if (['ru', 'en'].includes(lang)) {
      request.session.set('lang', lang);
    }
    const referer = request.headers.referer || '/';
    return reply.redirect(referer);
  });
};
