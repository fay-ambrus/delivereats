const orders = new Map();
let orderIdCounter = 0;

const orderSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    customerId: { type: 'number' },
    restaurantId: { type: 'number' },
    items: { type: 'array' },
    status: { type: 'string' }
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
    url: '/orders',
    schema: {
      body: {
        type: 'object',
        required: ['customerId', 'restaurantId', 'items'],
        properties: {
          customerId: { type: 'number' },
          restaurantId: { type: 'number' },
          items: { type: 'array' }
        }
      },
      response: {
        201: orderSchema
      }
    },
    handler: async (request, reply) => {
      const id = orderIdCounter++;
      const order = {
        id: id,
        ...request.body,
        status: 'pending'
      };
      orders.set(id, order);
      reply.code(201).send(order);
    }
  });

  fastify.route({
    method: 'GET',
    url: '/orders',
    schema: {
      response: {
        200: {
          type: 'array',
          items: orderSchema
        }
      }
    },
    handler: async (request, reply) => {
      const allOrders = Array.from(orders.values());
      reply.code(200).send(allOrders);
    }
  });

  fastify.route({
    method: 'GET',
    url: '/orders/:id',
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      },
      response: {
        200: orderSchema,
        404: errorSchema
      }
    },
    handler: async (request, reply) => {
      const id = parseInt(request.params.id);
      const order = orders.get(id);
      if (!order) {
        reply.code(404).send({ error: 'Order not found' });
        return;
      }
      reply.code(200).send(order);
    }
  });

  fastify.route({
    method: 'PUT',
    url: '/orders/:id',
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['customerId', 'restaurantId', 'items', 'status'],
        properties: {
          customerId: { type: 'number' },
          restaurantId: { type: 'number' },
          items: { type: 'array' },
          status: { type: 'string' }
        }
      },
      response: {
        200: orderSchema,
        404: errorSchema
      }
    },
    handler: async (request, reply) => {
      const id = parseInt(request.params.id);
      if (!orders.has(id)) {
        reply.code(404).send({ error: 'Order not found' });
        return;
      }
      const order = {
        id: id,
        ...request.body
      };
      orders.set(id, order);
      reply.code(200).send(order);
    }
  });

  fastify.route({
    method: 'DELETE',
    url: '/orders/:id',
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
          properties: {
            success: { type: 'boolean' }
          }
        },
        404: errorSchema
      }
    },
    handler: async (request, reply) => {
      const id = parseInt(request.params.id);
      if (!orders.has(id)) {
        reply.code(404).send({ error: 'Order not found' });
        return;
      }
      orders.delete(id);
      reply.code(200).send({ success: true });
    }
  });
};
