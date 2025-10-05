import { readFileSync } from 'fs';
import { join } from 'path';
import pool from './connection';

async function runMigration() {
  try {
    console.log('Running database migration...');

    const schemaSQL = readFileSync(join(__dirname, 'schema.sql'), 'utf8');

    await pool.query(schemaSQL);

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
