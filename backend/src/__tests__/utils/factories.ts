import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { query } from './testDatabase';

/**
 * Factory for creating test users
 */
export interface UserFactory {
  email?: string;
  password?: string;
  emailVerified?: boolean;
  subscriptionStatus?: string;
  trialEndsAt?: Date;
}

export async function createUser(data: UserFactory = {}) {
  const email = data.email || `test-${uuidv4()}@example.com`;
  const password = data.password || 'Test123456';
  const passwordHash = await bcrypt.hash(password, 10);
  const emailVerified = data.emailVerified ?? false;
  const subscriptionStatus = data.subscriptionStatus || 'trial';
  const trialEndsAt = data.trialEndsAt || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const result = await query(
    `INSERT INTO users (email, password_hash, email_verified, subscription_status, trial_ends_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [email, passwordHash, emailVerified, subscriptionStatus, trialEndsAt]
  );

  return {
    ...result.rows[0],
    plainPassword: password, // Include plain password for testing
  };
}

/**
 * Factory for creating test visitors
 */
export interface VisitorFactory {
  userId?: string;
  visitorId?: string;
  email?: string;
  firstTouchData?: any;
  deviceFingerprint?: string;
}

export async function createVisitor(data: VisitorFactory = {}) {
  // Create user if not provided
  let userId = data.userId;
  if (!userId) {
    const user = await createUser();
    userId = user.id;
  }

  const visitorId = data.visitorId || `visitor-${uuidv4()}`;
  const email = data.email || null;
  const firstTouchData = data.firstTouchData || {
    source: 'google',
    medium: 'cpc',
    campaign: 'summer-sale',
    content: 'ad-1',
    term: 'online course',
    referrer: 'https://google.com',
    landing_page: 'https://example.com/landing',
  };
  const deviceFingerprint = data.deviceFingerprint || `fp-${uuidv4()}`;

  const result = await query(
    `INSERT INTO visitors (user_id, visitor_id, email, first_touch_data, device_fingerprint)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, visitorId, email, JSON.stringify(firstTouchData), deviceFingerprint]
  );

  return result.rows[0];
}

/**
 * Factory for creating test sessions
 */
export interface SessionFactory {
  visitorId?: string;
  sessionId?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  referrer?: string;
  landingPage?: string;
  timestamp?: Date;
}

export async function createSession(data: SessionFactory = {}) {
  // Create visitor if not provided
  let visitorId = data.visitorId;
  if (!visitorId) {
    const visitor = await createVisitor();
    visitorId = visitor.id;
  }

  const sessionId = data.sessionId || `session-${uuidv4()}`;
  const source = data.source || 'google';
  const medium = data.medium || 'cpc';
  const campaign = data.campaign || 'test-campaign';
  const content = data.content || null;
  const term = data.term || null;
  const referrer = data.referrer || 'https://google.com';
  const landingPage = data.landingPage || 'https://example.com/landing';
  const timestamp = data.timestamp || new Date();

  const result = await query(
    `INSERT INTO sessions (visitor_id, session_id, source, medium, campaign, content, term, referrer, landing_page, timestamp)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [visitorId, sessionId, source, medium, campaign, content, term, referrer, landingPage, timestamp]
  );

  return result.rows[0];
}

/**
 * Factory for creating test purchases
 */
export interface PurchaseFactory {
  userId?: string;
  visitorId?: string;
  email?: string;
  amount?: number;
  currency?: string;
  courseName?: string;
  platform?: string;
  platformPurchaseId?: string;
  firstTouchSource?: string;
  firstTouchMedium?: string;
  firstTouchCampaign?: string;
  lastTouchSource?: string;
  lastTouchMedium?: string;
  lastTouchCampaign?: string;
  attributionStatus?: string;
  purchasedAt?: Date;
  launchId?: string;
}

export async function createPurchase(data: PurchaseFactory = {}) {
  // Create user if not provided
  let userId = data.userId;
  if (!userId) {
    const user = await createUser();
    userId = user.id;
  }

  const visitorId = data.visitorId || null;
  const email = data.email || `buyer-${uuidv4()}@example.com`;
  const amount = data.amount || 99.99;
  const currency = data.currency || 'USD';
  const courseName = data.courseName || 'Test Course';
  const platform = data.platform || 'kajabi';
  const platformPurchaseId = data.platformPurchaseId || `purchase-${uuidv4()}`;
  const firstTouchSource = data.firstTouchSource || 'google';
  const firstTouchMedium = data.firstTouchMedium || 'cpc';
  const firstTouchCampaign = data.firstTouchCampaign || 'test-campaign';
  const lastTouchSource = data.lastTouchSource || 'google';
  const lastTouchMedium = data.lastTouchMedium || 'cpc';
  const lastTouchCampaign = data.lastTouchCampaign || 'test-campaign';
  const attributionStatus = data.attributionStatus || 'matched';
  const purchasedAt = data.purchasedAt || new Date();
  const launchId = data.launchId || null;

  const result = await query(
    `INSERT INTO purchases (
      user_id, visitor_id, email, amount, currency, course_name, platform, platform_purchase_id,
      first_touch_source, first_touch_medium, first_touch_campaign,
      last_touch_source, last_touch_medium, last_touch_campaign,
      attribution_status, purchased_at, launch_id
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING *`,
    [
      userId, visitorId, email, amount, currency, courseName, platform, platformPurchaseId,
      firstTouchSource, firstTouchMedium, firstTouchCampaign,
      lastTouchSource, lastTouchMedium, lastTouchCampaign,
      attributionStatus, purchasedAt, launchId
    ]
  );

  return result.rows[0];
}

/**
 * Factory for creating test launches
 */
export interface LaunchFactory {
  userId?: string;
  title?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  revenueGoal?: number;
  salesGoal?: number;
  status?: string;
  shareEnabled?: boolean;
  shareToken?: string;
}

export async function createLaunch(data: LaunchFactory = {}) {
  // Create user if not provided
  let userId = data.userId;
  if (!userId) {
    const user = await createUser();
    userId = user.id;
  }

  const title = data.title || 'Test Launch';
  const description = data.description || 'A test launch for testing purposes';
  const startDate = data.startDate || new Date();
  const endDate = data.endDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const revenueGoal = data.revenueGoal || 10000;
  const salesGoal = data.salesGoal || 100;
  const status = data.status || 'upcoming';
  const shareEnabled = data.shareEnabled ?? false;
  const shareToken = data.shareToken || null;

  const result = await query(
    `INSERT INTO launches (
      user_id, title, description, start_date, end_date, revenue_goal, sales_goal, status, share_enabled, share_token
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *`,
    [userId, title, description, startDate, endDate, revenueGoal, salesGoal, status, shareEnabled, shareToken]
  );

  return result.rows[0];
}

/**
 * Factory for creating test platform integrations
 */
export interface PlatformIntegrationFactory {
  userId?: string;
  platform?: string;
  accessToken?: string;
  refreshToken?: string;
  apiKey?: string;
  status?: string;
}

export async function createPlatformIntegration(data: PlatformIntegrationFactory = {}) {
  // Create user if not provided
  let userId = data.userId;
  if (!userId) {
    const user = await createUser();
    userId = user.id;
  }

  const platform = data.platform || 'kajabi';
  const accessToken = data.accessToken || `access-${uuidv4()}`;
  const refreshToken = data.refreshToken || `refresh-${uuidv4()}`;
  const apiKey = data.apiKey || null;
  const status = data.status || 'connected';

  const result = await query(
    `INSERT INTO platform_integrations (user_id, platform, access_token, refresh_token, api_key, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, platform, accessToken, refreshToken, apiKey, status]
  );

  return result.rows[0];
}

/**
 * Factory for creating test tracking scripts
 */
export interface TrackingScriptFactory {
  userId?: string;
  scriptId?: string;
}

export async function createTrackingScript(data: TrackingScriptFactory = {}) {
  // Create user if not provided
  let userId = data.userId;
  if (!userId) {
    const user = await createUser();
    userId = user.id;
  }

  const scriptId = data.scriptId || `script-${uuidv4()}`;

  const result = await query(
    `INSERT INTO tracking_scripts (user_id, script_id)
     VALUES ($1, $2)
     RETURNING *`,
    [userId, scriptId]
  );

  return result.rows[0];
}

/**
 * Factory for creating test refresh tokens
 */
export interface RefreshTokenFactory {
  userId?: string;
  token?: string;
  expiresAt?: Date;
}

export async function createRefreshToken(data: RefreshTokenFactory = {}) {
  // Create user if not provided
  let userId = data.userId;
  if (!userId) {
    const user = await createUser();
    userId = user.id;
  }

  const token = data.token || `token-${uuidv4()}`;
  const expiresAt = data.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const result = await query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, token, expiresAt]
  );

  return result.rows[0];
}

/**
 * Create a complete visitor journey (user -> visitor -> sessions -> purchase)
 * Useful for testing attribution logic
 */
export async function createVisitorJourney(options: {
  email?: string;
  sessions?: number;
  purchase?: boolean;
} = {}) {
  const email = options.email || `journey-${uuidv4()}@example.com`;
  const sessionCount = options.sessions || 2;
  const includePurchase = options.purchase ?? true;

  // Create user
  const user = await createUser({ email });

  // Create visitor
  const visitor = await createVisitor({
    userId: user.id,
    email,
    firstTouchData: {
      source: 'google',
      medium: 'cpc',
      campaign: 'first-campaign',
      referrer: 'https://google.com',
      landing_page: 'https://example.com/landing',
    },
  });

  // Create sessions
  const sessions = [];
  for (let i = 0; i < sessionCount; i++) {
    const session = await createSession({
      visitorId: visitor.id,
      source: i === 0 ? 'google' : 'facebook',
      medium: i === 0 ? 'cpc' : 'social',
      campaign: `campaign-${i + 1}`,
      timestamp: new Date(Date.now() + i * 60 * 60 * 1000), // 1 hour apart
    });
    sessions.push(session);
  }

  // Create purchase if requested
  let purchase = null;
  if (includePurchase) {
    const lastSession = sessions[sessions.length - 1];
    purchase = await createPurchase({
      userId: user.id,
      visitorId: visitor.id,
      email,
      firstTouchSource: 'google',
      firstTouchMedium: 'cpc',
      firstTouchCampaign: 'first-campaign',
      lastTouchSource: lastSession.source,
      lastTouchMedium: lastSession.medium,
      lastTouchCampaign: lastSession.campaign,
      attributionStatus: 'matched',
      purchasedAt: new Date(Date.now() + (sessionCount + 1) * 60 * 60 * 1000),
    });
  }

  return {
    user,
    visitor,
    sessions,
    purchase,
  };
}
