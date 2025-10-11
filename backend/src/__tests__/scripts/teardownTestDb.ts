#!/usr/bin/env tsx

import dotenv from 'dotenv';
import path from 'path';
import { Pool } from 'pg';
import readline from 'readline';

// Load test environment
dotenv.config({ path: path.join(__dirname, '../../../.env.test') });

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/coursesignal_test';

async function confirm(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

async function teardownTestDatabase(force = false) {
  console.log('🧹 Tearing down test database...\n');

  // Extract database name from URL
  const dbName = DATABASE_URL.split('/').pop()?.split('?')[0];
  if (!dbName) {
    throw new Error('Could not extract database name from DATABASE_URL');
  }

  // Safety check: ensure we're not deleting production database
  if (!dbName.includes('test')) {
    console.error('❌ ERROR: Database name does not contain "test"');
    console.error(`   Database: ${dbName}`);
    console.error('   Refusing to delete for safety reasons.');
    process.exit(1);
  }

  // Confirm deletion unless force flag is set
  if (!force) {
    const confirmed = await confirm(
      `⚠️  This will PERMANENTLY DELETE database: ${dbName}\n   Are you sure? (y/N): `
    );

    if (!confirmed) {
      console.log('❌ Teardown cancelled');
      return;
    }
  }

  // Connect to postgres database to drop test database
  const adminUrl = DATABASE_URL.replace(`/${dbName}`, '/postgres');
  const adminPool = new Pool({ connectionString: adminUrl });

  try {
    console.log(`\n🗑️  Dropping database: ${dbName}`);

    // Terminate all connections to the database
    await adminPool.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = $1
        AND pid <> pg_backend_pid()
    `, [dbName]);

    // Drop database
    await adminPool.query(`DROP DATABASE IF EXISTS ${dbName}`);
    console.log(`✅ Database dropped: ${dbName}`);
  } catch (error) {
    console.error('❌ Error dropping database:', error);
    throw error;
  } finally {
    await adminPool.end();
  }

  console.log('\n✅ Test database teardown complete!\n');
}

// Run if executed directly
if (require.main === module) {
  const force = process.argv.includes('--force') || process.argv.includes('-f');

  teardownTestDatabase(force)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Teardown failed:', error);
      process.exit(1);
    });
}

export default teardownTestDatabase;
