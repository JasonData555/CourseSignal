import { query } from './connection';

async function clearData() {
  console.log('🧹 Starting data cleanup...\n');

  try {
    // Get the first user
    const userResult = await query('SELECT id, email FROM users LIMIT 1');

    if (userResult.rows.length === 0) {
      console.log('⚠️  No users found in database.');
      process.exit(0);
    }

    const userId = userResult.rows[0].id;
    const userEmail = userResult.rows[0].email;

    console.log(`🎯 Clearing data for user: ${userEmail} (${userId})\n`);

    // Get counts before deletion
    const beforePurchases = await query('SELECT COUNT(*) as count FROM purchases WHERE user_id = $1', [userId]);
    const beforeVisitors = await query('SELECT COUNT(*) as count FROM visitors WHERE user_id = $1', [userId]);
    const beforeSessions = await query(
      'SELECT COUNT(*) as count FROM sessions WHERE visitor_id IN (SELECT id FROM visitors WHERE user_id = $1)',
      [userId]
    );

    console.log('📊 Current data:');
    console.log(`   Purchases: ${beforePurchases.rows[0].count}`);
    console.log(`   Visitors: ${beforeVisitors.rows[0].count}`);
    console.log(`   Sessions: ${beforeSessions.rows[0].count}\n`);

    // Confirm deletion
    console.log('⚠️  This will delete all tracking data, purchases, visitors, and sessions.');
    console.log('   User accounts will NOT be deleted.\n');

    // Delete in correct order (respecting foreign key constraints)
    console.log('🗑️  Deleting purchases...');
    const deletedPurchases = await query('DELETE FROM purchases WHERE user_id = $1', [userId]);
    console.log(`✅ Deleted ${deletedPurchases.rowCount} purchases`);

    console.log('🗑️  Deleting sessions...');
    const deletedSessions = await query(
      'DELETE FROM sessions WHERE visitor_id IN (SELECT id FROM visitors WHERE user_id = $1)',
      [userId]
    );
    console.log(`✅ Deleted ${deletedSessions.rowCount} sessions`);

    console.log('🗑️  Deleting visitors...');
    const deletedVisitors = await query('DELETE FROM visitors WHERE user_id = $1', [userId]);
    console.log(`✅ Deleted ${deletedVisitors.rowCount} visitors`);

    console.log('🗑️  Deleting tracking events...');
    const deletedEvents = await query('DELETE FROM tracking_events WHERE user_id = $1', [userId]);
    console.log(`✅ Deleted ${deletedEvents.rowCount} tracking events`);

    console.log('\n✅ Data cleanup completed successfully! 🎉\n');
    console.log('You can now run the seed script to generate fresh test data.\n');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

clearData();
