import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/connection';

export interface TrackingEvent {
  visitorId: string;
  sessionId: string;
  eventType: 'visit' | 'pageview';
  eventData: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
    term?: string;
    referrer?: string;
    landingPage?: string;
    deviceFingerprint?: string;
  };
}

export interface VisitorData {
  id: string;
  visitorId: string;
  email?: string;
  firstTouchData: any;
}

export async function createOrUpdateVisitor(
  userId: string,
  visitorId: string,
  eventData: TrackingEvent['eventData'],
  email?: string
) {
  // Check if visitor exists
  const existing = await query(
    'SELECT id, first_touch_data FROM visitors WHERE user_id = $1 AND visitor_id = $2',
    [userId, visitorId]
  );

  if (existing.rows.length > 0) {
    // Update email if provided and not already set
    if (email && !existing.rows[0].email) {
      await query('UPDATE visitors SET email = $1, updated_at = NOW() WHERE id = $2', [
        email,
        existing.rows[0].id,
      ]);
    }
    return existing.rows[0];
  }

  // Create new visitor with first-touch attribution
  const firstTouchData = {
    source: eventData.source || 'direct',
    medium: eventData.medium || 'none',
    campaign: eventData.campaign,
    content: eventData.content,
    term: eventData.term,
    referrer: eventData.referrer,
    landingPage: eventData.landingPage,
    timestamp: new Date().toISOString(),
  };

  const result = await query(
    `INSERT INTO visitors (user_id, visitor_id, email, first_touch_data, device_fingerprint)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, visitor_id, first_touch_data`,
    [userId, visitorId, email, JSON.stringify(firstTouchData), eventData.deviceFingerprint]
  );

  return result.rows[0];
}

export async function createSession(
  visitorDbId: string,
  sessionId: string,
  eventData: TrackingEvent['eventData']
) {
  await query(
    `INSERT INTO sessions (visitor_id, session_id, source, medium, campaign, content, term, referrer, landing_page)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      visitorDbId,
      sessionId,
      eventData.source || 'direct',
      eventData.medium || 'none',
      eventData.campaign,
      eventData.content,
      eventData.term,
      eventData.referrer,
      eventData.landingPage,
    ]
  );
}

export async function recordTrackingEvent(userId: string, event: TrackingEvent) {
  // Create or update visitor
  const visitor = await createOrUpdateVisitor(userId, event.visitorId, event.eventData);

  // Create session
  await createSession(visitor.id, event.sessionId, event.eventData);

  // Store raw tracking event
  await query(
    `INSERT INTO tracking_events (user_id, visitor_id, session_id, event_type, event_data)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, event.visitorId, event.sessionId, event.eventType, JSON.stringify(event.eventData)]
  );

  return { success: true };
}

export async function getOrCreateTrackingScript(userId: string): Promise<string> {
  // Check if script exists
  const existing = await query('SELECT script_id FROM tracking_scripts WHERE user_id = $1', [
    userId,
  ]);

  if (existing.rows.length > 0) {
    return existing.rows[0].script_id;
  }

  // Create new script ID
  const scriptId = uuidv4();

  await query('INSERT INTO tracking_scripts (user_id, script_id) VALUES ($1, $2)', [
    userId,
    scriptId,
  ]);

  return scriptId;
}

export async function getUserByScriptId(scriptId: string): Promise<string | null> {
  const result = await query('SELECT user_id FROM tracking_scripts WHERE script_id = $1', [
    scriptId,
  ]);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0].user_id;
}

export async function findVisitorByEmail(
  userId: string,
  email: string
): Promise<VisitorData | null> {
  const result = await query(
    'SELECT id, visitor_id, email, first_touch_data FROM visitors WHERE user_id = $1 AND email = $2 ORDER BY created_at DESC LIMIT 1',
    [userId, email]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return {
    id: result.rows[0].id,
    visitorId: result.rows[0].visitor_id,
    email: result.rows[0].email,
    firstTouchData: result.rows[0].first_touch_data,
  };
}

export async function findVisitorByFingerprint(
  userId: string,
  fingerprint: string,
  withinHours: number = 24
): Promise<VisitorData | null> {
  const result = await query(
    `SELECT id, visitor_id, email, first_touch_data
     FROM visitors
     WHERE user_id = $1
       AND device_fingerprint = $2
       AND created_at > NOW() - INTERVAL '${withinHours} hours'
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId, fingerprint]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return {
    id: result.rows[0].id,
    visitorId: result.rows[0].visitor_id,
    email: result.rows[0].email,
    firstTouchData: result.rows[0].first_touch_data,
  };
}

export async function getVisitorSessions(visitorDbId: string) {
  const result = await query(
    `SELECT session_id, source, medium, campaign, content, term, referrer, landing_page, timestamp
     FROM sessions
     WHERE visitor_id = $1
     ORDER BY timestamp ASC`,
    [visitorDbId]
  );

  return result.rows;
}
