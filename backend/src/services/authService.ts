import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/connection';
import { generateAccessToken, generateRefreshToken, getRefreshTokenExpiry } from '../utils/jwt';
import { sendVerificationEmail, sendPasswordResetEmail } from './emailService';

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  subscriptionStatus: string;
  trialEndsAt: Date | null;
}

export async function signup(email: string, password: string) {
  // Check if user exists
  const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);

  if (existingUser.rows.length > 0) {
    throw new Error('User already exists');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Generate verification token
  const verificationToken = uuidv4();

  // Set trial end date (14 days from now)
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  // Create user
  const result = await query(
    `INSERT INTO users (email, password_hash, email_verification_token, trial_ends_at, subscription_status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, email_verified, subscription_status, trial_ends_at`,
    [email, passwordHash, verificationToken, trialEndsAt, 'trial']
  );

  const user = result.rows[0];

  // Send verification email
  await sendVerificationEmail(email, verificationToken);

  return {
    user: {
      id: user.id,
      email: user.email,
      emailVerified: user.email_verified,
      subscriptionStatus: user.subscription_status,
      trialEndsAt: user.trial_ends_at,
    },
  };
}

export async function login(email: string, password: string) {
  // Find user
  const result = await query(
    'SELECT id, email, password_hash, email_verified, subscription_status, trial_ends_at FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid credentials');
  }

  const user = result.rows[0];

  // Verify password
  const isValid = await bcrypt.compare(password, user.password_hash);

  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  // Generate tokens
  const accessToken = generateAccessToken({ userId: user.id, email: user.email });
  const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

  // Store refresh token
  const expiresAt = getRefreshTokenExpiry();
  await query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [user.id, refreshToken, expiresAt]
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      emailVerified: user.email_verified,
      subscriptionStatus: user.subscription_status,
      trialEndsAt: user.trial_ends_at,
    },
    accessToken,
    refreshToken,
  };
}

export async function verifyEmail(token: string) {
  const result = await query(
    `UPDATE users SET email_verified = TRUE, email_verification_token = NULL
     WHERE email_verification_token = $1
     RETURNING id, email`,
    [token]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid or expired verification token');
  }

  return result.rows[0];
}

export async function requestPasswordReset(email: string) {
  const result = await query('SELECT id FROM users WHERE email = $1', [email]);

  if (result.rows.length === 0) {
    // Don't reveal if user exists
    return;
  }

  const resetToken = uuidv4();
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await query(
    'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE email = $3',
    [resetToken, resetExpires, email]
  );

  await sendPasswordResetEmail(email, resetToken);
}

export async function resetPassword(token: string, newPassword: string) {
  const result = await query(
    'SELECT id FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW()',
    [token]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid or expired reset token');
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await query(
    `UPDATE users
     SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL
     WHERE password_reset_token = $2`,
    [passwordHash, token]
  );
}

export async function getUserById(userId: string): Promise<User | null> {
  const result = await query(
    'SELECT id, email, email_verified, subscription_status, trial_ends_at FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const user = result.rows[0];
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.email_verified,
    subscriptionStatus: user.subscription_status,
    trialEndsAt: user.trial_ends_at,
  };
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  // Get user with current password hash
  const result = await query(
    'SELECT id, password_hash FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  const user = result.rows[0];

  // Verify current password
  const isValid = await bcrypt.compare(currentPassword, user.password_hash);

  if (!isValid) {
    throw new Error('Current password is incorrect');
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(newPassword, 10);

  // Update password
  await query(
    'UPDATE users SET password_hash = $1 WHERE id = $2',
    [newPasswordHash, userId]
  );

  return { message: 'Password changed successfully' };
}
