const db = require('./db');
const { randomUUID } = require('crypto');

const courierSchema = {
  type: 'object',
  required: ['id', 'name'],
  properties: {
    id: { type: 'string' },
    name: { type: 'string' }
  }
};

const errorSchema = {
  type: 'object',
  required: ['error'],
  properties: {
    error: { type: 'string' }
  }
};

module.exports = async function (fastify, opts) {
  fastify.route({
    method: 'POST',
    url: '/couriers',
    schema: {
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' }
        }
      },
      response: {
        201: courierSchema
      }
    },
    handler: async (request, reply) => {
      const courier = {
        id: randomUUID(),
        name: request.body.name
      };
      await db.createCourier(courier);
      reply.code(201).send(courier);
    }
  });

  fastify.route({
    method: 'GET',
    url: '/couriers',
    schema: {
      response: {
        200: {
          type: 'array',
          items: courierSchema
        }
      }
    },
    handler: async (request, reply) => {
      const couriers = await db.getAllCouriers();
      reply.send(couriers);
    }
  });

  fastify.route({
    method: 'GET',
    url: '/couriers/:id',
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      },
      response: {
        200: courierSchema,
        404: errorSchema
      }
    },
    handler: async (request, reply) => {
      const courier = await db.getCourierById(request.params.id);
      if (!courier) {
        reply.code(404).send({ error: 'Courier not found' });
        return;
      }
      reply.send(courier);
    }
  });

  fastify.route({
    method: 'PUT',
    url: '/couriers/:id',
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' }
        }
      },
      response: {
        200: courierSchema,
        404: errorSchema
      }
    },
    handler: async (request, reply) => {
      const courier = await db.updateCourier(request.params.id, request.body);
      if (!courier) {
        reply.code(404).send({ error: 'Courier not found' });
        return;
      }
      reply.send(courier);
    }
  });

  fastify.route({
    method: 'DELETE',
    url: '/couriers/:id',
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          required: ['success'],
          properties: {
            success: { type: 'boolean' }
          }
        },
        404: errorSchema
      }
    },
    handler: async (request, reply) => {
      const success = await db.deleteCourier(request.params.id);
      if (!success) {
        reply.code(404).send({ error: 'Courier not found' });
        return;
      }
      reply.send({ success: true });
    }
  });
};
