import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load .env from backend root directory (handles both dev and compiled dist scenarios)
dotenv.config({ path: join(__dirname, '../../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Increased from 2000 to 10000 for Render's network latency
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  process.exit(-1);
});

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;

  if (duration > 1000) {
    console.warn('Slow query detected:', { text, duration, rows: res.rowCount });
  }

  return res;
};

export const getClient = () => pool.connect();

export { pool };
export default pool;
