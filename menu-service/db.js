const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'postgres',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'menu',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres'
});

async function connect() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS menu_item_events (
      id SERIAL PRIMARY KEY,
      type VARCHAR(50) NOT NULL,
      menu_item_id VARCHAR(36) NOT NULL,
      timestamp TIMESTAMP NOT NULL,
      data JSONB NOT NULL
    )
  `);
  console.log('Connected to PostgreSQL (menu database)');
}

async function rebuildMenuItemState(menuItemId) {
  const result = await pool.query(
    'SELECT type, data FROM menu_item_events WHERE menu_item_id = $1 ORDER BY timestamp ASC',
    [menuItemId]
  );
  
  let state = null;
  for (const event of result.rows) {
    if (event.type === 'MenuItemCreated') {
      state = { id: menuItemId, ...event.data };
    } else if (event.type === 'MenuItemUpdated' && state) {
      state = { ...state, ...event.data };
    } else if (event.type === 'MenuItemDeleted') {
      state = null;
    }
  }
  
  return state;
}

async function createMenuItem(menuItem) {
  await pool.query(
    'INSERT INTO menu_item_events (type, menu_item_id, timestamp, data) VALUES ($1, $2, $3, $4)',
    ['MenuItemCreated', menuItem.id, new Date(), JSON.stringify({ name: menuItem.name, restaurantId: menuItem.restaurantId, priceHUF: menuItem.priceHUF })]
  );
  
  return await rebuildMenuItemState(menuItem.id);
}

async function getAllMenuItems() {
  const result = await pool.query('SELECT DISTINCT menu_item_id FROM menu_item_events');
  const menuItems = [];
  
  for (const row of result.rows) {
    const state = await rebuildMenuItemState(row.menu_item_id);
    if (state) menuItems.push(state);
  }
  
  return menuItems;
}

async function getMenuItemById(id) {
  return await rebuildMenuItemState(id);
}

async function getMenuItemsByRestaurant(restaurantId) {
  const result = await pool.query('SELECT DISTINCT menu_item_id FROM menu_item_events');
  const menuItems = [];
  
  for (const row of result.rows) {
    const state = await rebuildMenuItemState(row.menu_item_id);
    if (state && state.restaurantId === restaurantId) {
      menuItems.push(state);
    }
  }
  
  return menuItems;
}

async function updateMenuItem(id, menuItem) {
  const existing = await rebuildMenuItemState(id);
  if (!existing) return null;
  
  await pool.query(
    'INSERT INTO menu_item_events (type, menu_item_id, timestamp, data) VALUES ($1, $2, $3, $4)',
    ['MenuItemUpdated', id, new Date(), JSON.stringify({ name: menuItem.name, restaurantId: menuItem.restaurantId, priceHUF: menuItem.priceHUF })]
  );
  
  return await rebuildMenuItemState(id);
}

async function deleteMenuItem(id) {
  const existing = await rebuildMenuItemState(id);
  if (!existing) return false;
  
  await pool.query(
    'INSERT INTO menu_item_events (type, menu_item_id, timestamp, data) VALUES ($1, $2, $3, $4)',
    ['MenuItemDeleted', id, new Date(), '{}']
  );
  
  return true;
}

module.exports = {
  connect,
  createMenuItem,
  getAllMenuItems,
  getMenuItemById,
  getMenuItemsByRestaurant,
  updateMenuItem,
  deleteMenuItem
};
