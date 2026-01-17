const usersDb = require('../usersDb');
const { randomUUID } = require('crypto');

const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' }
  }
};

const errorSchema = {
  type: 'object',
  properties: {
    error: { type: 'string' }
  }
};

module.exports = async function (fastify, opts) {
  fastify.route({
    method: 'POST',
    url: '/users',
    schema: {
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' }
        }
      },
      response: {
        201: userSchema
      }
    },
    handler: async (request, reply) => {
      const user = {
        id: randomUUID(),
        ...request.body
      };
      await usersDb.createUser(user);
      reply.code(201).send(user);
    }
  });

  fastify.route({
    method: 'GET',
    url: '/users',
    schema: {
      response: {
        200: {
          type: 'array',
          items: userSchema
        }
      }
    },
    handler: async (request, reply) => {
      const users = await usersDb.getAllUsers();
      reply.send(users);
    }
  });

  fastify.route({
    method: 'GET',
    url: '/users/:id',
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      },
      response: {
        200: userSchema,
        404: errorSchema
      }
    },
    handler: async (request, reply) => {
      const user = await usersDb.getUserById(request.params.id);
      if (!user) {
        reply.code(404).send({ error: 'User not found' });
        return;
      }
      reply.send(user);
    }
  });
};
