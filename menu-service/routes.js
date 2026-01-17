const { randomUUID } = require('crypto');

const menuItems = new Map();

const menuItemSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    restaurantId: { type: 'string' },
    priceHUF: { type: 'integer' }
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
    url: '/menu-items',
    schema: {
      body: {
        type: 'object',
        required: ['name', 'restaurantId', 'priceHUF'],
        properties: {
          name: { type: 'string' },
          restaurantId: { type: 'string' },
          priceHUF: { type: 'integer' }
        }
      },
      response: {
        201: menuItemSchema
      }
    },
    handler: async (request, reply) => {
      const id = randomUUID();
      const menuItem = {
        id: id,
        ...request.body
      };
      menuItems.set(id, menuItem);
      reply.code(201).send(menuItem);
    }
  });

  fastify.route({
    method: 'GET',
    url: '/menu-items',
    schema: {
      response: {
        200: {
          type: 'array',
          items: menuItemSchema
        }
      }
    },
    handler: async (request, reply) => {
      const allMenuItems = Array.from(menuItems.values());
      reply.code(200).send(allMenuItems);
    }
  });

  fastify.route({
    method: 'GET',
    url: '/menu-items/:id',
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      },
      response: {
        200: menuItemSchema,
        404: errorSchema
      }
    },
    handler: async (request, reply) => {
      const menuItem = menuItems.get(request.params.id);
      if (!menuItem) {
        reply.code(404).send({ error: 'Menu item not found' });
        return;
      }
      reply.code(200).send(menuItem);
    }
  });

  fastify.route({
    method: 'PUT',
    url: '/menu-items/:id',
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['name', 'restaurantId', 'priceHUF'],
        properties: {
          name: { type: 'string' },
          restaurantId: { type: 'string' },
          priceHUF: { type: 'integer' }
        }
      },
      response: {
        200: menuItemSchema,
        404: errorSchema
      }
    },
    handler: async (request, reply) => {
      if (!menuItems.has(request.params.id)) {
        reply.code(404).send({ error: 'Menu item not found' });
        return;
      }
      const menuItem = {
        id: request.params.id,
        ...request.body
      };
      menuItems.set(request.params.id, menuItem);
      reply.code(200).send(menuItem);
    }
  });

  fastify.route({
    method: 'DELETE',
    url: '/menu-items/:id',
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
      if (!menuItems.has(request.params.id)) {
        reply.code(404).send({ error: 'Menu item not found' });
        return;
      }
      menuItems.delete(request.params.id);
      reply.code(200).send({ success: true });
    }
  });

  fastify.route({
    method: 'GET',
    url: '/restaurants/:id/menu-items',
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'array',
          items: menuItemSchema
        },
        404: errorSchema
      }
    },
    handler: async (request, reply) => {
      const items = Array.from(menuItems.values()).filter(item => item.restaurantId === request.params.id);
      reply.code(200).send(items);
    }
  });
};
