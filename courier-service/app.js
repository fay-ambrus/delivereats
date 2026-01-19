const fastify = require('fastify')({ logger: true });
const db = require('./db');

fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  reply.code(500).send({ error: 'Internal server error' });
});

fastify.register(require('./routes'), { prefix: '/api/courier' });

const start = async () => {
  try {
    await db.connect();
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
