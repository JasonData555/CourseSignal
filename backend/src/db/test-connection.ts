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

// Test connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 20000,
  ssl: { rejectUnauthorized: false },
});

console.log('\nAttempting connection...');

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Connection FAILED:', {
      message: err.message,
      code: err.code,
      errno: (err as any).errno,
      syscall: (err as any).syscall,
      address: (err as any).address,
      port: (err as any).port,
    });
    process.exit(1);
  }

  console.log('Connection SUCCESSFUL!');
  console.log('Database time:', res.rows[0].now);
  pool.end();
  process.exit(0);
});

// Timeout after 30 seconds
setTimeout(() => {
  console.error('Connection test timed out after 30 seconds');
  process.exit(1);
}, 30000);
