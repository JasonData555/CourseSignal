import dotenv from 'dotenv';
import path from 'path';
import { Pool } from 'pg';

// Load test environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.test') });

/**
 * Global setup runs once before all test suites
 * Sets up the test database and schema
 */
export default async function globalSetup() {
  console.log('\n🔧 Setting up test environment...\n');

  const databaseUrl = process.env.DATABASE_URL || 'postgresql://localhost:5432/coursesignal_test';

  // Create a connection to PostgreSQL
  const pool = new Pool({
    connectionString: databaseUrl,
  });

  try {
    // Check if we can connect
    const client = await pool.connect();
    console.log('✅ Connected to test database');

    // Check if database exists, if not create it
    const dbName = databaseUrl.split('/').pop()?.split('?')[0];
    if (!dbName) {
      throw new Error('Could not extract database name from DATABASE_URL');
    }

    // We'll let the setupTestDatabase function in testDatabase.ts handle schema creation
    // This is just to verify connection

    client.release();
    console.log('✅ Test database ready');
  } catch (error) {
    console.error('❌ Failed to setup test database:', error);
    throw error;
  } finally {
    await pool.end();
  }

  console.log('✅ Global setup complete\n');
}
