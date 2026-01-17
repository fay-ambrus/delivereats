const fastify = require('fastify')({ logger: true });
const db = require('./db');
const usersDb = require('./usersDb');

// Global error handler
fastify.setErrorHandler((error, request, reply) => {
  if (error.validation) {
    if (error.validation[0].params.additionalProperty) {
      reply.code(400).send({ 
        error: 'Only the status field can be updated for orders' 
      });
      return;
    }
  }
  fastify.log.error(error);
  reply.code(500).send({ error: 'Internal server error' });
});

// Register routes
fastify.register(require('./routes/orders'), { prefix: '/api/order' });
fastify.register(require('./routes/users'), { prefix: '/api/customer' });

const start = async () => {
  try {
    await db.connect();
    await usersDb.connect();
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
