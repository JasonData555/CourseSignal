/**
 * Global teardown runs once after all test suites
 * Cleans up resources and closes connections
 */
export default async function globalTeardown() {
  console.log('\n🧹 Tearing down test environment...\n');

  // Any global cleanup can go here
  // Individual test files should handle their own database cleanup

  console.log('✅ Global teardown complete\n');
}
