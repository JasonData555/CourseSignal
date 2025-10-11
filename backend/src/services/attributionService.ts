import { query } from '../db/connection';
import * as trackingService from './trackingService';

export interface Purchase {
  email: string;
  amount: number;
  currency?: string;
  courseName?: string;
  platform: 'kajabi' | 'teachable' | 'stripe';
  platformPurchaseId: string;
  purchasedAt: Date;
  deviceFingerprint?: string;
}

export interface AttributionResult {
  purchaseId: string;
  status: 'matched' | 'unmatched' | 'pending';
  visitorId?: string;
  firstTouch?: any;
  lastTouch?: any;
}

export async function attributePurchase(
  userId: string,
  purchase: Purchase
): Promise<AttributionResult> {
  // Try to match by email first (primary method)
  let visitor = await trackingService.findVisitorByEmail(userId, purchase.email);

  let attributionStatus: 'matched' | 'unmatched' | 'pending' = 'unmatched';
  let firstTouch: any = null;
  let lastTouch: any = null;
  let matchMethod = 'none';

  if (visitor) {
    attributionStatus = 'matched';
    matchMethod = 'email';

    // Get first touch attribution
    firstTouch = visitor.firstTouchData;

    // Get last touch attribution (most recent session before purchase)
    const sessions = await trackingService.getVisitorSessions(visitor.id);

    if (sessions.length > 0) {
      const lastSession = sessions[sessions.length - 1];
      lastTouch = {
        source: lastSession.source,
        medium: lastSession.medium,
        campaign: lastSession.campaign,
        content: lastSession.content,
        term: lastSession.term,
        referrer: lastSession.referrer,
        landingPage: lastSession.landing_page,
        timestamp: lastSession.timestamp,
      };
    } else {
      lastTouch = firstTouch; // Fallback to first touch if no sessions
    }
  }

  // If email match failed and we have a device fingerprint, try fingerprint matching
  // This catches cases where visitor used a different email at purchase, or multi-device journeys
  if (!visitor && purchase.deviceFingerprint) {
    visitor = await trackingService.findVisitorByFingerprint(
      userId,
      purchase.deviceFingerprint,
      24 // Match within 24 hours
    );

    if (visitor) {
      attributionStatus = 'matched';
      matchMethod = 'fingerprint';

      // Get attribution data
      firstTouch = visitor.firstTouchData;
      const sessions = await trackingService.getVisitorSessions(visitor.id);

      if (sessions.length > 0) {
        const lastSession = sessions[sessions.length - 1];
        lastTouch = {
          source: lastSession.source,
          medium: lastSession.medium,
          campaign: lastSession.campaign,
          content: lastSession.content,
          term: lastSession.term,
          referrer: lastSession.referrer,
          landingPage: lastSession.landing_page,
          timestamp: lastSession.timestamp,
        };
      } else {
        lastTouch = firstTouch;
      }
    }
  }

  // Insert purchase with attribution
  const result = await query(
    `INSERT INTO purchases (
      user_id, visitor_id, email, amount, currency, course_name, platform, platform_purchase_id,
      first_touch_source, first_touch_medium, first_touch_campaign,
      last_touch_source, last_touch_medium, last_touch_campaign,
      attribution_status, purchased_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    RETURNING id`,
    [
      userId,
      visitor ? visitor.id : null,
      purchase.email,
      purchase.amount,
      purchase.currency || 'USD',
      purchase.courseName,
      purchase.platform,
      purchase.platformPurchaseId,
      firstTouch?.source,
      firstTouch?.medium,
      firstTouch?.campaign,
      lastTouch?.source,
      lastTouch?.medium,
      lastTouch?.campaign,
      attributionStatus,
      purchase.purchasedAt,
    ]
  );

  const purchaseId = result.rows[0].id;

  // Auto-assign to active launch if purchase falls within launch date range
  await query(
    `UPDATE purchases p
     SET launch_id = l.id
     FROM launches l
     WHERE p.id = $1
       AND l.user_id = $2
       AND p.purchased_at BETWEEN l.start_date AND l.end_date
       AND l.status IN ('active', 'completed')
     ORDER BY l.start_date DESC
     LIMIT 1`,
    [purchaseId, userId]
  );

  return {
    purchaseId,
    status: attributionStatus,
    visitorId: visitor?.visitorId,
    firstTouch,
    lastTouch,
  };
}

export async function reattributePurchase(purchaseId: string) {
  // Get purchase details
  const purchaseResult = await query(
    'SELECT user_id, email, platform_purchase_id FROM purchases WHERE id = $1',
    [purchaseId]
  );

  if (purchaseResult.rows.length === 0) {
    throw new Error('Purchase not found');
  }

  const { user_id, email } = purchaseResult.rows[0];

  // Try to find visitor
  const visitor = await trackingService.findVisitorByEmail(user_id, email);

  if (!visitor) {
    return { status: 'still_unmatched' };
  }

  // Get attribution data
  const firstTouch = visitor.firstTouchData;
  const sessions = await trackingService.getVisitorSessions(visitor.id);

  let lastTouch = firstTouch;
  if (sessions.length > 0) {
    const lastSession = sessions[sessions.length - 1];
    lastTouch = {
      source: lastSession.source,
      medium: lastSession.medium,
      campaign: lastSession.campaign,
    };
  }

  // Update purchase
  await query(
    `UPDATE purchases SET
      visitor_id = $1,
      first_touch_source = $2,
      first_touch_medium = $3,
      first_touch_campaign = $4,
      last_touch_source = $5,
      last_touch_medium = $6,
      last_touch_campaign = $7,
      attribution_status = 'matched',
      updated_at = NOW()
    WHERE id = $8`,
    [
      visitor.id,
      firstTouch?.source,
      firstTouch?.medium,
      firstTouch?.campaign,
      lastTouch?.source,
      lastTouch?.medium,
      lastTouch?.campaign,
      purchaseId,
    ]
  );

  return {
    status: 'matched',
    visitorId: visitor.visitorId,
    firstTouch,
    lastTouch,
  };
}

export async function getMatchRate(userId: string): Promise<number> {
  const result = await query(
    `SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE attribution_status = 'matched') as matched
    FROM purchases
    WHERE user_id = $1`,
    [userId]
  );

  const { total, matched } = result.rows[0];

  if (total === 0) return 0;

  return Math.round((matched / total) * 100);
}
