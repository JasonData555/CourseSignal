import { Pool, PoolClient } from 'pg';
import fs from 'fs';
import path from 'path';

let testPool: Pool | null = null;

/**
 * Get or create a test database connection pool
 */
export function getTestPool(): Pool {
  if (!testPool) {
    testPool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/coursesignal_test',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    testPool.on('error', (err) => {
      console.error('Unexpected test database error:', err);
    });
  }

  return testPool;
}

/**
 * Execute a SQL query on the test database
 */
export async function query(text: string, params?: any[]) {
  const pool = getTestPool();
  return pool.query(text, params);
}

/**
 * Get a client from the pool for transactions
 */
export async function getClient(): Promise<PoolClient> {
  const pool = getTestPool();
  return pool.connect();
}

/**
 * Setup test database schema
 * Reads and executes the schema.sql file
 * This is idempotent - safe to call multiple times
 */
export async function setupTestDatabase() {
  const pool = getTestPool();
  const schemaPath = path.join(__dirname, '../../db/schema.sql');

  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found at ${schemaPath}`);
  }

  const schema = fs.readFileSync(schemaPath, 'utf8');

  // Check if tables already exist
  const tablesExist = await tableExists('users');

  if (tablesExist) {
    // Schema already applied, skip
    return;
  }

  // Execute schema in a transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(schema);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Clear all data from test database tables
 * Preserves schema, only deletes data
 */
export async function clearTestDatabase() {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Disable triggers temporarily to avoid foreign key issues
    await client.query('SET session_replication_role = replica');

    // Get all tables in public schema
    const result = await client.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
    `);

    // Truncate all tables
    for (const row of result.rows) {
      await client.query(`TRUNCATE TABLE ${row.tablename} CASCADE`);
    }

    // Re-enable triggers
    await client.query('SET session_replication_role = DEFAULT');

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Drop all tables in the test database
 * Use with caution - completely destroys database structure
 */
export async function dropTestDatabase() {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Drop all tables
    await client.query(`
      DROP SCHEMA public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO PUBLIC;
    `);

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Close the test database connection pool
 * Call this in afterAll hooks or global teardown
 */
export async function closeTestDatabase() {
  if (testPool) {
    await testPool.end();
    testPool = null;
  }
}

/**
 * Begin a transaction for isolated testing
 * Returns a client that should be committed or rolled back
 */
export async function beginTransaction(): Promise<PoolClient> {
  const client = await getClient();
  await client.query('BEGIN');
  return client;
}

/**
 * Rollback a transaction
 */
export async function rollbackTransaction(client: PoolClient) {
  try {
    await client.query('ROLLBACK');
  } finally {
    client.release();
  }
}

/**
 * Commit a transaction
 */
export async function commitTransaction(client: PoolClient) {
  try {
    await client.query('COMMIT');
  } finally {
    client.release();
  }
}

/**
 * Count rows in a table
 */
export async function countRows(tableName: string): Promise<number> {
  const result = await query(`SELECT COUNT(*) as count FROM ${tableName}`);
  return parseInt(result.rows[0].count, 10);
}

/**
 * Check if a table exists
 */
export async function tableExists(tableName: string): Promise<boolean> {
  const result = await query(
    `SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = $1
    )`,
    [tableName]
  );
  return result.rows[0].exists;
}

/**
 * Seed the test database with minimal data
 * Useful for tests that need baseline data
 */
export async function seedTestData() {
  // This is intentionally minimal - use factories for test-specific data
  // Add any baseline data needed for all tests here
}
