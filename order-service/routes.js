const db = require('./db');
const { randomUUID } = require('crypto');

const orderItemSchema = {
  type: 'object',
  required: ['menuItemId', 'quantity'],
  properties: {
    menuItemId: { type: 'string' },
    quantity: { type: 'integer' }
  }
};

const orderSchema = {
  type: 'object',
  required: ['id', 'customerId', 'restaurantId', 'items', 'status'],
  properties: {
    id: { type: 'string' },
    customerId: { type: 'string' },
    restaurantId: { type: 'string' },
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
          customerId: { type: 'string' },
          restaurantId: { type: 'string' },
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
      const order = {
        id: randomUUID(),
        ...request.body,
        status: 'pending'
      };
      await db.createOrder(order);
      reply.code(201).send(order);
    }
  });

  fastify.route({
    method: 'GET',
    url: '/orders',
    schema: {
      querystring: {
        type: 'object',
        properties: {
          customerId: { type: 'string' },
          restaurantId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'array',
          items: orderSchema
        }
      }
    },
    handler: async (request, reply) => {
      const orders = await db.getAllOrders(request.query.customerId, request.query.restaurantId);
      reply.send(orders);
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
      const order = await db.getOrderById(request.params.id);
      if (!order) {
        reply.code(404).send({ error: 'Order not found' });
        return;
      }
      reply.send(order);
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
          status: { type: 'string' },
          courierId: { type: 'string' }
        },
        additionalProperties: false
      },
      response: {
        200: orderSchema,
        404: errorSchema
      }
    },
    handler: async (request, reply) => {
      const order = await db.updateOrderStatus(request.params.id, request.body.status, request.body.courierId);
      if (!order) {
        reply.code(404).send({ error: 'Order not found' });
        return;
      }
      reply.send(order);
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
      const success = await db.deleteOrder(request.params.id);
      if (!success) {
        reply.code(404).send({ error: 'Order not found' });
        return;
      }
      reply.send({ success: true });
    }
  });
};
