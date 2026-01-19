const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT),
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD
});

async function connect() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_events (
      id SERIAL PRIMARY KEY,
      type VARCHAR(50) NOT NULL,
      user_id VARCHAR(36) NOT NULL,
      timestamp TIMESTAMP NOT NULL,
      data JSONB NOT NULL
    )
  `);
  console.log('Connected to PostgreSQL (users database)');
}

async function rebuildUserState(userId) {
  const result = await pool.query(
    'SELECT type, data FROM user_events WHERE user_id = $1 ORDER BY timestamp ASC',
    [userId]
  );

  let state = null;
  for (const event of result.rows) {
    if (event.type === 'UserCreated') {
      state = { id: userId, ...event.data };
    } else if (event.type === 'UserDeleted') {
      state = null;
    }
  }

  return state;
}

async function createUser(user) {
  await pool.query(
    'INSERT INTO user_events (type, user_id, timestamp, data) VALUES ($1, $2, $3, $4)',
    ['UserCreated', user.id, new Date(), JSON.stringify({ name: user.name })]
  );

  return await rebuildUserState(user.id);
}

async function getAllUsers() {
  const result = await pool.query('SELECT DISTINCT user_id FROM user_events');
  const users = [];

  for (const row of result.rows) {
    const state = await rebuildUserState(row.user_id);
    if (state) users.push(state);
  }

  return users;
}

async function getUserById(id) {
  return await rebuildUserState(id);
}

module.exports = {
  connect,
  createUser,
  getAllUsers,
  getUserById
};
