import { readFileSync } from 'fs';
import { join } from 'path';
import pool from './connection';

async function runMigration() {
  try {
    console.log('Running database migration...');
    console.log('Current directory:', __dirname);
    console.log('DATABASE_URL configured:', !!process.env.DATABASE_URL);

    const schemaPath = join(__dirname, 'schema.sql');
    console.log('Reading schema from:', schemaPath);

    const schemaSQL = readFileSync(schemaPath, 'utf8');
    console.log('Schema file loaded successfully. Size:', schemaSQL.length, 'bytes');

    console.log('Executing migration...');
    await pool.query(schemaSQL);

    console.log('Migration completed successfully!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    console.error('Error details:', {
      name: (error as any)?.name,
      message: (error as any)?.message,
      code: (error as any)?.code,
      stack: (error as any)?.stack
    });
    await pool.end().catch(() => {});
    process.exit(1);
  }
}

runMigration();
