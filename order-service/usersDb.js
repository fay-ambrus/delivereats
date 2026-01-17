const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'postgres',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'users',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres'
});

async function connect() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL
    )
  `);
  console.log('Connected to PostgreSQL (users database)');
}

async function createUser(user) {
  await pool.query(
    'INSERT INTO users (id, name) VALUES ($1, $2)',
    [user.id, user.name]
  );
  return user;
}

async function getAllUsers() {
  const result = await pool.query('SELECT id, name FROM users');
  return result.rows;
}

async function getUserById(id) {
  const result = await pool.query('SELECT id, name FROM users WHERE id = $1', [id]);
  return result.rows[0];
}

module.exports = {
  connect,
  createUser,
  getAllUsers,
  getUserById
};
