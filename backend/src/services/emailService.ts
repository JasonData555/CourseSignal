import nodemailer from 'nodemailer';

const APP_URL = process.env.APP_URL || 'http://localhost:5173';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${APP_URL}/verify-email?token=${token}`;

  try {
    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: email,
      subject: 'Verify your CourseSignal account',
      html: `
        <h1>Welcome to CourseSignal!</h1>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}">${verificationUrl}</a>
        <p>This link will expire in 24 hours.</p>
      `,
    });
  } catch (error) {
    // In development, log email errors but don't block signup
    console.error('Email sending failed (this is expected in dev):', error);
    console.log(`Verification URL for ${email}: ${verificationUrl}`);
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  try {
    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: email,
      subject: 'Reset your CourseSignal password',
      html: `
        <h1>Password Reset Request</h1>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });
  } catch (error) {
    // In development, log email errors but don't block password reset
    console.error('Email sending failed (this is expected in dev):', error);
    console.log(`Password reset URL for ${email}: ${resetUrl}`);
  }
}

export async function sendTrialEndingEmail(email: string, daysLeft: number) {
  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to: email,
    subject: `Your CourseSignal trial ends in ${daysLeft} days`,
    html: `
      <h1>Your trial is ending soon</h1>
      <p>Your CourseSignal trial will end in ${daysLeft} days.</p>
      <p>Subscribe now to continue tracking your revenue attribution.</p>
      <a href="${APP_URL}/billing">Subscribe Now</a>
    `,
  });
}

export async function sendPaymentFailedEmail(email: string) {
  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to: email,
    subject: 'Payment failed for your CourseSignal subscription',
    html: `
      <h1>Payment Failed</h1>
      <p>We couldn't process your recent payment. Please update your payment method.</p>
      <a href="${APP_URL}/billing">Update Payment Method</a>
    `,
  });
}
