const db = require('./db');
const { randomUUID } = require('crypto');

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
      const menuItem = {
        id: randomUUID(),
        ...request.body
      };
      await db.createMenuItem(menuItem);
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
      const menuItems = await db.getAllMenuItems();
      reply.send(menuItems);
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
      const menuItem = await db.getMenuItemById(request.params.id);
      if (!menuItem) {
        reply.code(404).send({ error: 'Menu item not found' });
        return;
      }
      reply.send(menuItem);
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
      const menuItem = await db.updateMenuItem(request.params.id, request.body);
      if (!menuItem) {
        reply.code(404).send({ error: 'Menu item not found' });
        return;
      }
      reply.send(menuItem);
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
      const success = await db.deleteMenuItem(request.params.id);
      if (!success) {
        reply.code(404).send({ error: 'Menu item not found' });
        return;
      }
      reply.send({ success: true });
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
        }
      }
    },
    handler: async (request, reply) => {
      const items = await db.getMenuItemsByRestaurant(request.params.id);
      reply.send(items);
    }
  });
};
