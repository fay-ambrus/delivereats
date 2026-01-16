const fastify = require('fastify')({ logger: true });

// Global error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  reply.code(500).send({ error: 'Internal server error' });
});

// Register routes
fastify.register(require('./routes/restaurants'), { prefix: '/api/menu' });
fastify.register(require('./routes/menuItems'), { prefix: '/api/menu' });

fastify.listen({ port: 3000, host: '0.0.0.0' }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
