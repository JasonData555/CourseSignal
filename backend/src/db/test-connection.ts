// Simple database connection test with detailed logging
import { Pool } from 'pg';

console.log('='.repeat(60));
console.log('Database Connection Test');
console.log('='.repeat(60));
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set!');
  process.exit(1);
}

// Show connection string format (mask password)
const dbUrl = process.env.DATABASE_URL;
const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');
console.log('DATABASE_URL format:', maskedUrl);

// Parse connection details
try {
  const url = new URL(dbUrl);
  console.log('Parsed connection details:', {
    protocol: url.protocol,
    hostname: url.hostname,
    port: url.port || '5432',
    database: url.pathname.substring(1),
    username: url.username,
  });
} catch (e) {
  console.error('Failed to parse DATABASE_URL:', (e as Error).message);
  process.exit(1);
}

// Test connection with different SSL configurations
console.log('\n--- Test 1: SSL with rejectUnauthorized: false ---');
const pool1 = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 20000,
  ssl: { rejectUnauthorized: false },
});

pool1.query('SELECT NOW()', (err, res) => {
  pool1.end();

  if (!err) {
    console.log('✓ Test 1 SUCCESS!');
    console.log('Database time:', res?.rows[0]?.now);
    console.log('\nUse this SSL config: { rejectUnauthorized: false }');
    process.exit(0);
  }

  console.log('✗ Test 1 failed:', err.message);

  // Try Test 2
  console.log('\n--- Test 2: No SSL (ssl: false) ---');
  const pool2 = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 20000,
    ssl: false,
  });

  pool2.query('SELECT NOW()', (err2, res2) => {
    pool2.end();

    if (!err2) {
      console.log('✓ Test 2 SUCCESS!');
      console.log('Database time:', res2?.rows[0]?.now);
      console.log('\nUse this SSL config: ssl: false (but this is unusual for Render)');
      process.exit(0);
    }

    console.log('✗ Test 2 failed:', err2?.message);

    // Try Test 3: Parse and modify connection string
    console.log('\n--- Test 3: Add sslmode=require to connection string ---');
    const dbUrlWithSsl = process.env.DATABASE_URL + '?sslmode=require';
    const pool3 = new Pool({
      connectionString: dbUrlWithSsl,
      connectionTimeoutMillis: 20000,
    });

    pool3.query('SELECT NOW()', (err3, res3) => {
      pool3.end();

      if (!err3) {
        console.log('✓ Test 3 SUCCESS!');
        console.log('Database time:', res3?.rows[0]?.now);
        console.log('\nUse this: append ?sslmode=require to DATABASE_URL');
        process.exit(0);
      }

      console.log('✗ Test 3 failed:', err3?.message);
      console.log('\n❌ All connection tests failed!');
      console.log('\nError details from Test 1:', {
        message: err.message,
        code: (err as any).code,
      });
      process.exit(1);
    });
  });
});

const pool = pool1; // For compatibility

// Timeout after 60 seconds
setTimeout(() => {
  console.error('\n⏱️  Connection test timed out after 60 seconds');
  process.exit(1);
}, 60000);
