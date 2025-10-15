import { readFileSync } from 'fs';
import { join } from 'path';

// CHECK DATABASE_URL BEFORE IMPORTING CONNECTION
// This ensures the env var is set before Pool instantiation
if (!process.env.DATABASE_URL) {
  console.error('='.repeat(60));
  console.error('✗ DATABASE_URL environment variable is not set');
  console.error('='.repeat(60));
  console.error('NODE_ENV:', process.env.NODE_ENV);
  console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('DATA') || k.includes('SQL') || k.includes('PG')).join(', '));
  process.exit(1);
}

import pool from './connection';

const MAX_RETRIES = 5;
const RETRY_DELAY = 3000; // 3 seconds

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForDatabase(retries = MAX_RETRIES): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempting database connection (${i + 1}/${retries})...`);
      await pool.query('SELECT 1');
      console.log('Database connection successful!');
      return;
    } catch (error) {
      console.warn(`Connection attempt ${i + 1} failed:`, (error as any)?.message);
      if (i < retries - 1) {
        console.log(`Waiting ${RETRY_DELAY / 1000} seconds before retry...`);
        await sleep(RETRY_DELAY);
      }
    }
  }
  throw new Error(`Failed to connect to database after ${retries} attempts`);
}

async function runMigration() {
  try {
    console.log('='.repeat(60));
    console.log('Running database migration...');
    console.log('='.repeat(60));
    console.log('Current directory:', __dirname);
    console.log('NODE_ENV:', process.env.NODE_ENV);

    // Explicit check for DATABASE_URL
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    console.log('DATABASE_URL configured: ✓');
    console.log('DATABASE_URL format:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@')); // Mask password

    // Wait for database to be ready with retry logic
    await waitForDatabase();

    const schemaPath = join(__dirname, 'schema.sql');
    console.log('Reading schema from:', schemaPath);

    const schemaSQL = readFileSync(schemaPath, 'utf8');
    console.log(`Schema file loaded successfully. Size: ${schemaSQL.length} bytes`);

    console.log('Executing migration...');
    await pool.query(schemaSQL);

    console.log('='.repeat(60));
    console.log('✓ Migration completed successfully!');
    console.log('='.repeat(60));
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('='.repeat(60));
    console.error('✗ Migration failed!');
    console.error('='.repeat(60));
    console.error('Error:', error);
    console.error('Error details:', {
      name: (error as any)?.name,
      message: (error as any)?.message,
      code: (error as any)?.code,
      detail: (error as any)?.detail,
      hint: (error as any)?.hint,
    });
    await pool.end().catch(() => {});
    process.exit(1);
  }
}

runMigration();
