// Diagnostic script to check environment variables
console.log('='.repeat(60));
console.log('Environment Variable Diagnostic');
console.log('='.repeat(60));
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
  console.log('DATABASE_URL format:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'));
} else {
  console.log('DATABASE_URL is NOT set');
}
console.log('PORT:', process.env.PORT);
console.log('All env vars:', Object.keys(process.env).sort().join(', '));
console.log('='.repeat(60));
