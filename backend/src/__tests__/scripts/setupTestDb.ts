#!/usr/bin/env tsx

import dotenv from 'dotenv';
import path from 'path';
import { Pool } from 'pg';
import fs from 'fs';

// Load test environment
dotenv.config({ path: path.join(__dirname, '../../../.env.test') });

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/coursesignal_test';

async function setupTestDatabase() {
  console.log('🔧 Setting up test database...\n');

  // Extract database name from URL
  const dbName = DATABASE_URL.split('/').pop()?.split('?')[0];
  if (!dbName) {
    throw new Error('Could not extract database name from DATABASE_URL');
  }

  // Connect to postgres database to create test database
  const adminUrl = DATABASE_URL.replace(`/${dbName}`, '/postgres');
  const adminPool = new Pool({ connectionString: adminUrl });

  try {
    console.log(`📊 Creating database: ${dbName}`);

    // Check if database exists
    const checkDb = await adminPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (checkDb.rows.length === 0) {
      // Create database
      await adminPool.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Database created: ${dbName}`);
    } else {
      console.log(`ℹ️  Database already exists: ${dbName}`);
    }
  } catch (error) {
    console.error('❌ Error creating database:', error);
    throw error;
  } finally {
    await adminPool.end();
  }

  // Connect to test database and apply schema
  const testPool = new Pool({ connectionString: DATABASE_URL });

  try {
    console.log('\n📋 Applying database schema...');

    const schemaPath = path.join(__dirname, '../../db/schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at ${schemaPath}`);
    }

    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute schema
    const client = await testPool.connect();
    try {
      await client.query('BEGIN');
      await client.query(schema);
      await client.query('COMMIT');
      console.log('✅ Schema applied successfully');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error applying schema:', error);
    throw error;
  } finally {
    await testPool.end();
  }

  console.log('\n✅ Test database setup complete!\n');
  console.log(`Database: ${dbName}`);
  console.log(`URL: ${DATABASE_URL}\n`);
}

// Run if executed directly
if (require.main === module) {
  setupTestDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

export default setupTestDatabase;
