const db = require('./db');
const rabbitmq = require('./rabbitmq');

const restaurantSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    category: { type: 'string' }
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
    url: '/restaurants',
    schema: {
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          category: { type: 'string' }
        }
      },
      response: {
        201: restaurantSchema
      }
    },
    handler: async (request, reply) => {
      const restaurant = await db.createRestaurant(request.body.name, request.body.category);
      reply.code(201).send(restaurant);
    }
  });

  fastify.route({
    method: 'GET',
    url: '/restaurants',
    schema: {
      response: {
        200: {
          type: 'array',
          items: restaurantSchema
        }
      }
    },
    handler: async (request, reply) => {
      const restaurants = await db.getAllRestaurants();
      reply.send(restaurants);
    }
  });

  fastify.route({
    method: 'GET',
    url: '/restaurants/:id',
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      },
      response: {
        200: restaurantSchema,
        404: errorSchema
      }
    },
    handler: async (request, reply) => {
      const restaurant = await db.getRestaurantById(request.params.id);
      
      if (!restaurant) {
        reply.code(404).send({ error: 'Restaurant not found' });
        return;
      }
      
      reply.send({ id: restaurant.id, name: restaurant.name, category: restaurant.category });
    }
  });

  fastify.route({
    method: 'PUT',
    url: '/restaurants/:id',
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
          name: { type: 'string' },
          category: { type: 'string' }
        }
      },
      response: {
        200: restaurantSchema,
        404: errorSchema
      }
    },
    handler: async (request, reply) => {
      const restaurant = await db.updateRestaurant(
        request.params.id,
        request.body.name,
        request.body.category
      );
      
      if (!restaurant) {
        reply.code(404).send({ error: 'Restaurant not found' });
        return;
      }
      
      reply.send(restaurant);
    }
  });

  fastify.route({
    method: 'DELETE',
    url: '/restaurants/:id',
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
      const success = await db.deleteRestaurant(request.params.id);
      
      if (!success) {
        reply.code(404).send({ error: 'Restaurant not found' });
        return;
      }
      
      reply.send({ success: true });
    }
  });

  fastify.route({
    method: 'GET',
    url: '/orders',
    schema: {
      querystring: {
        type: 'object',
        properties: {
          restaurantId: { type: 'string' }
        }
      }
    },
    handler: async (request, reply) => {
      const orders = rabbitmq.getOrders(request.query.restaurantId);
      reply.send(orders);
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
        }
      }
    },
    handler: async (request, reply) => {
      const response = await fetch(`http://order-service:3000/api/order/orders/${request.params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.body)
      });
      const order = await response.json();
      reply.send(order);
    }
  });
};
