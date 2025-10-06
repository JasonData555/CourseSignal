import { query } from './connection';
import { v4 as uuidv4 } from 'uuid';

// Realistic data generators
const sources = [
  { source: 'google', medium: 'cpc', campaigns: ['brand-2024', 'course-launch', 'retargeting'] },
  { source: 'facebook', medium: 'social', campaigns: ['fb-ads-q1', 'lookalike-audience', 'engagement'] },
  { source: 'instagram', medium: 'social', campaigns: ['ig-stories', 'influencer-collab', 'reels'] },
  { source: 'youtube', medium: 'video', campaigns: ['yt-ads', 'tutorial-series', 'webinar'] },
  { source: 'email', medium: 'email', campaigns: ['newsletter', 'launch-sequence', 'cart-abandonment'] },
  { source: 'direct', medium: 'none', campaigns: [null] },
  { source: 'organic', medium: 'referral', campaigns: [null] },
  { source: 'linkedin', medium: 'social', campaigns: ['professional-network', 'b2b-campaign'] },
];

const firstNames = ['Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason', 'Isabella', 'William', 'Mia', 'James', 'Charlotte', 'Benjamin', 'Amelia', 'Lucas', 'Harper', 'Henry', 'Evelyn', 'Alexander'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee'];

const courseNames = [
  'Complete Web Development Bootcamp',
  'Master Digital Marketing',
  'Business Growth Accelerator',
  'Photography Masterclass',
  'Personal Finance Freedom',
  'Public Speaking Excellence',
  'Email Marketing Mastery',
  'SEO Fundamentals',
  'Freelancing Success Blueprint',
  'Content Creation Academy',
];

const coursePrices = [49, 97, 197, 297, 497, 697, 997];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysAgo: number, endDaysAgo: number = 0): Date {
  const start = Date.now() - daysAgo * 24 * 60 * 60 * 1000;
  const end = Date.now() - endDaysAgo * 24 * 60 * 60 * 1000;
  return new Date(start + Math.random() * (end - start));
}

function generateEmail(firstName: string, lastName: string): string {
  const providers = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
  const formats = [
    `${firstName.toLowerCase()}.${lastName.toLowerCase()}`,
    `${firstName.toLowerCase()}${lastName.toLowerCase()}`,
    `${firstName.toLowerCase()}${Math.floor(Math.random() * 999)}`,
  ];
  return `${randomElement(formats)}@${randomElement(providers)}`;
}

async function seedDatabase() {
  console.log('🌱 Starting database seed...\n');

  // Get the most recently created user from the database (or create a test user)
  let userResult = await query('SELECT id, email FROM users ORDER BY created_at DESC LIMIT 1');

  if (userResult.rows.length === 0) {
    console.log('⚠️  No users found. Creating a test user...');
    const testUser = await query(
      `INSERT INTO users (email, password_hash, email_verified, subscription_status)
       VALUES ($1, $2, true, 'active')
       RETURNING id, email`,
      ['test@example.com', '$2a$10$test.hash.placeholder']
    );
    userResult = testUser;
  }

  const userId = userResult.rows[0].id;
  const userEmail = userResult.rows[0].email;
  console.log(`✅ Using user: ${userEmail} (${userId})\n`);

  // Clear existing test data for this user
  console.log('🧹 Clearing existing test data...');
  await query('DELETE FROM purchases WHERE user_id = $1', [userId]);
  await query('DELETE FROM sessions WHERE visitor_id IN (SELECT id FROM visitors WHERE user_id = $1)', [userId]);
  await query('DELETE FROM visitors WHERE user_id = $1', [userId]);
  console.log('✅ Cleared existing data\n');

  // Generate visitors
  console.log('👥 Creating visitors...');
  const visitors: any[] = [];
  const visitorCount = 80;

  for (let i = 0; i < visitorCount; i++) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const email = Math.random() > 0.3 ? generateEmail(firstName, lastName) : null; // 70% have emails
    const visitorId = uuidv4();

    const sourceData = randomElement(sources);
    const campaign = randomElement(sourceData.campaigns);

    const firstTouchData = {
      source: sourceData.source,
      medium: sourceData.medium,
      campaign: campaign,
      referrer: sourceData.source === 'direct' ? null : `https://${sourceData.source}.com`,
      landing_page: '/sales-page',
    };

    const deviceFingerprint = uuidv4().slice(0, 16);
    const createdAt = randomDate(90, 1);

    const result = await query(
      `INSERT INTO visitors (id, user_id, visitor_id, email, first_touch_data, device_fingerprint, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
       RETURNING id, visitor_id, email, first_touch_data, created_at`,
      [uuidv4(), userId, visitorId, email, JSON.stringify(firstTouchData), deviceFingerprint, createdAt]
    );

    visitors.push(result.rows[0]);
  }

  console.log(`✅ Created ${visitors.length} visitors\n`);

  // Generate sessions (1-4 sessions per visitor)
  console.log('📊 Creating sessions...');
  let totalSessions = 0;

  for (const visitor of visitors) {
    const sessionCount = Math.floor(Math.random() * 4) + 1;

    for (let i = 0; i < sessionCount; i++) {
      const sourceData = randomElement(sources);
      const campaign = randomElement(sourceData.campaigns);
      const sessionId = uuidv4();

      // Sessions should be after visitor creation
      const visitorCreated = new Date(visitor.created_at);
      const sessionTimestamp = new Date(
        visitorCreated.getTime() + Math.random() * (Date.now() - visitorCreated.getTime())
      );

      await query(
        `INSERT INTO sessions (visitor_id, session_id, source, medium, campaign, referrer, landing_page, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          visitor.id,
          sessionId,
          sourceData.source,
          sourceData.medium,
          campaign,
          sourceData.source === 'direct' ? null : `https://${sourceData.source}.com`,
          i === 0 ? '/sales-page' : Math.random() > 0.5 ? '/checkout' : '/pricing',
          sessionTimestamp,
        ]
      );

      totalSessions++;
    }
  }

  console.log(`✅ Created ${totalSessions} sessions\n`);

  // Generate purchases (30-40% of visitors with emails convert)
  console.log('💰 Creating purchases...');
  const purchasers = visitors.filter(v => v.email && Math.random() > 0.6);
  const platforms = ['kajabi', 'teachable'];

  for (const visitor of purchasers) {
    const courseName = randomElement(courseNames);
    const amount = randomElement(coursePrices);
    const platform = randomElement(platforms);

    const firstTouch = visitor.first_touch_data;

    // Get the last session for this visitor
    const lastSessionResult = await query(
      `SELECT source, medium, campaign FROM sessions
       WHERE visitor_id = $1
       ORDER BY timestamp DESC
       LIMIT 1`,
      [visitor.id]
    );

    const lastTouch = lastSessionResult.rows.length > 0
      ? lastSessionResult.rows[0]
      : firstTouch;

    const purchasedAt = randomDate(60, 0);

    await query(
      `INSERT INTO purchases (
        user_id, visitor_id, email, amount, currency, course_name, platform, platform_purchase_id,
        first_touch_source, first_touch_medium, first_touch_campaign,
        last_touch_source, last_touch_medium, last_touch_campaign,
        attribution_status, purchased_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        userId,
        visitor.id,
        visitor.email,
        amount,
        'USD',
        courseName,
        platform,
        `${platform}_${uuidv4().slice(0, 8)}`,
        firstTouch.source,
        firstTouch.medium,
        firstTouch.campaign,
        lastTouch.source,
        lastTouch.medium,
        lastTouch.campaign,
        'matched',
        purchasedAt,
      ]
    );
  }

  console.log(`✅ Created ${purchasers.length} purchases\n`);

  // Add some unmatched purchases (purchases without visitor data)
  console.log('📧 Creating unmatched purchases...');
  const unmatchedCount = Math.floor(purchasers.length * 0.15); // 15% unmatched

  for (let i = 0; i < unmatchedCount; i++) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const email = generateEmail(firstName, lastName);
    const courseName = randomElement(courseNames);
    const amount = randomElement(coursePrices);
    const platform = randomElement(platforms);
    const purchasedAt = randomDate(60, 0);

    await query(
      `INSERT INTO purchases (
        user_id, visitor_id, email, amount, currency, course_name, platform, platform_purchase_id,
        attribution_status, purchased_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        userId,
        null,
        email,
        amount,
        'USD',
        courseName,
        platform,
        `${platform}_${uuidv4().slice(0, 8)}`,
        'unmatched',
        purchasedAt,
      ]
    );
  }

  console.log(`✅ Created ${unmatchedCount} unmatched purchases\n`);

  // Summary
  const summaryResult = await query(
    `SELECT
      COUNT(*) as total_purchases,
      SUM(amount) as total_revenue,
      COUNT(DISTINCT email) as unique_customers,
      COUNT(*) FILTER (WHERE attribution_status = 'matched') as matched_purchases,
      COUNT(*) FILTER (WHERE attribution_status = 'unmatched') as unmatched_purchases
     FROM purchases
     WHERE user_id = $1`,
    [userId]
  );

  const summary = summaryResult.rows[0];

  console.log('📈 Seed Summary:');
  console.log(`   Visitors: ${visitors.length}`);
  console.log(`   Sessions: ${totalSessions}`);
  console.log(`   Total Purchases: ${summary.total_purchases}`);
  console.log(`   Matched: ${summary.matched_purchases}`);
  console.log(`   Unmatched: ${summary.unmatched_purchases}`);
  console.log(`   Total Revenue: $${parseFloat(summary.total_revenue).toLocaleString()}`);
  console.log(`   Unique Customers: ${summary.unique_customers}`);
  console.log(`   Match Rate: ${((summary.matched_purchases / summary.total_purchases) * 100).toFixed(1)}%\n`);

  console.log('✅ Database seeded successfully! 🎉\n');
  console.log('You can now view the dashboard to see realistic data.\n');
}

// Run the seed
seedDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  });
