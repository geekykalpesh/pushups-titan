const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Support loading from both local and root .env/.env.local (e.g. from neon deploy)
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env.local') });
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED;

let poolConfig;
if (connectionString) {
  const isNeon = connectionString.includes('neon.tech');
  poolConfig = {
    connectionString,
    ssl: isNeon || connectionString.includes('sslmode=require')
      ? { rejectUnauthorized: false }
      : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
} else {
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'pushups_db',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('[PostgreSQL] Unexpected error on idle client', err);
});

// Auto-run schema migrations to ensure tables exist
const initializeDatabase = async () => {
  try {
    const client = await pool.connect();
    const dbTarget = connectionString
      ? 'Neon Cloud Postgres [' + (process.env.NEON_BRANCH || 'production') + ']'
      : (process.env.DB_NAME || 'pushups_db');
    console.log('[PostgreSQL] Connected to database:', dbTarget);
    
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      await client.query(sql);
      console.log('[PostgreSQL] Schema synchronized successfully. Tables are ready on Neon.');
    }
    client.release();
  } catch (err) {
    console.error('[PostgreSQL] Database initialization error:', err.message);
  }
};

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  initializeDatabase,
};
