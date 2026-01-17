const users = new Map();
let userIdCounter = 0;

const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
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
      const id = userIdCounter++;
      const user = {
        id: id,
        ...request.body
      };
      users.set(id, user);
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
      const allUsers = Array.from(users.values());
      reply.code(200).send(allUsers);
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
      const id = parseInt(request.params.id);
      const user = users.get(id);
      if (!user) {
        reply.code(404).send({ error: 'User not found' });
        return;
      }
      reply.code(200).send(user);
    }
  });
};

module.exports.users = users;
