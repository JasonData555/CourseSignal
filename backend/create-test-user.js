const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://jasonowens@localhost:5432/coursesignal',
});

async function createTestUser() {
  const email = 'jason@clearmetrics.tech';
  const password = 'CourseSignal';

  try {
    // Check if user already exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

    if (existing.rows.length > 0) {
      console.log(`User ${email} already exists. Updating password and verifying email...`);

      const passwordHash = await bcrypt.hash(password, 10);
      await pool.query(
        `UPDATE users
         SET password_hash = $1,
             email_verified = TRUE,
             email_verification_token = NULL
         WHERE email = $2`,
        [passwordHash, email]
      );

      console.log('✅ User updated successfully!');
    } else {
      console.log(`Creating new user ${email}...`);

      const passwordHash = await bcrypt.hash(password, 10);
      const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

      await pool.query(
        `INSERT INTO users (email, password_hash, email_verified, trial_ends_at, subscription_status)
         VALUES ($1, $2, TRUE, $3, 'trial')`,
        [email, passwordHash, trialEndsAt]
      );

      console.log('✅ User created successfully!');
    }

    console.log('\nTest Credentials:');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Email Verified: YES');
    console.log('Subscription Status: trial (14 days)');

  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await pool.end();
  }
}

createTestUser();
