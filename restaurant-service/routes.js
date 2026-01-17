const restaurants = new Map();
let restaurantIdCounter = 1;

const restaurantSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
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
      const id = restaurantIdCounter++;
      const restaurant = {
        id: id,
        ...request.body
      };
      restaurants.set(id, restaurant);
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
      const allRestaurants = Array.from(restaurants.values());
      reply.code(200).send(allRestaurants);
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
      const id = parseInt(request.params.id);
      const restaurant = restaurants.get(id);
      if (!restaurant) {
        reply.code(404).send({ error: 'Restaurant not found' });
        return;
      }
      reply.code(200).send(restaurant);
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
      const id = parseInt(request.params.id);
      if (!restaurants.has(id)) {
        reply.code(404).send({ error: 'Restaurant not found' });
        return;
      }
      const restaurant = {
        id: id,
        ...request.body
      };
      restaurants.set(id, restaurant);
      reply.code(200).send(restaurant);
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
      const id = parseInt(request.params.id);
      if (!restaurants.has(id)) {
        reply.code(404).send({ error: 'Restaurant not found' });
        return;
      }
      restaurants.delete(id);
      reply.code(200).send({ success: true });
    }
  });
};

module.exports.restaurants = restaurants;
