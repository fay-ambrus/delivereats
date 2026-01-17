const orders = new Map();
let orderIdCounter = 0;

const orderItemSchema = {
  type: 'object',
  required: ['menuItemId', 'quantity'],
  properties: {
    menuItemId: { type: 'integer' },
    quantity: { type: 'integer' }
  }
};

const orderSchema = {
  type: 'object',
  required: ['id', 'customerId', 'restaurantId', 'items', 'status'],
  properties: {
    id: { type: 'integer' },
    customerId: { type: 'integer' },
    restaurantId: { type: 'integer' },
    items: {
      type: 'array',
      items: orderItemSchema
    },
    status: { type: 'string' }
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
    url: '/orders',
    schema: {
      body: {
        type: 'object',
        required: ['customerId', 'restaurantId', 'items'],
        properties: {
          customerId: { type: 'integer' },
          restaurantId: { type: 'integer' },
          items: {
            type: 'array',
            items: orderItemSchema
          }
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
        required: ['status'],
        properties: {
          status: { type: 'string' }
        },
        additionalProperties: false
      },
      response: {
        200: orderSchema,
        404: errorSchema
      }
    },
    handler: async (request, reply) => {
      const id = parseInt(request.params.id);
      const existingOrder = orders.get(id);
      if (!existingOrder) {
        reply.code(404).send({ error: 'Order not found' });
        return;
      }
      const order = {
        ...existingOrder,
        status: request.body.status
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
          required: ['success'],
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
