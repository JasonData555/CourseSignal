/**
 * Tracking Service Tests
 *
 * Tests for visitor and session tracking, identification, and lookup functions.
 * This service handles the core tracking logic for the platform.
 */

import {
  setupTestDatabase,
  clearTestDatabase,
  closeTestDatabase,
  createUser,
  createVisitor,
  createSession,
  expectValidUUID,
  query,
} from '../utils';
import * as trackingService from '../../services/trackingService';
import { v4 as uuidv4 } from 'uuid';

describe('Tracking Service', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  describe('createOrUpdateVisitor', () => {
    it('should create a new visitor with first-touch attribution', async () => {
      const user = await createUser();
      const visitorId = `visitor-${uuidv4()}`;
      const eventData = {
        source: 'google',
        medium: 'cpc',
        campaign: 'summer-sale',
        content: 'ad-1',
        term: 'online courses',
        referrer: 'https://google.com/search',
        landingPage: 'https://example.com/landing',
        deviceFingerprint: 'fp-12345',
      };

      const result = await trackingService.createOrUpdateVisitor(
        user.id,
        visitorId,
        eventData,
        'test@example.com'
      );

      expect(result.id).toBeDefined();
      expect(result.visitor_id).toBe(visitorId);
      expect(result.first_touch_data).toMatchObject({
        source: 'google',
        medium: 'cpc',
        campaign: 'summer-sale',
        content: 'ad-1',
        term: 'online courses',
        referrer: 'https://google.com/search',
        landingPage: 'https://example.com/landing',
      });
      expect(result.first_touch_data.timestamp).toBeDefined();
    });

    it('should default source to "direct" and medium to "none" when not provided', async () => {
      const user = await createUser();
      const visitorId = `visitor-${uuidv4()}`;
      const eventData = {
        landingPage: 'https://example.com',
      };

      const result = await trackingService.createOrUpdateVisitor(
        user.id,
        visitorId,
        eventData
      );

      expect(result.first_touch_data.source).toBe('direct');
      expect(result.first_touch_data.medium).toBe('none');
    });

    it('should return existing visitor if already exists', async () => {
      const user = await createUser();
      const visitorId = `visitor-${uuidv4()}`;
      const eventData = {
        source: 'facebook',
        medium: 'social',
      };

      // Create visitor first time
      const first = await trackingService.createOrUpdateVisitor(
        user.id,
        visitorId,
        eventData
      );

      // Call again with same visitorId
      const second = await trackingService.createOrUpdateVisitor(
        user.id,
        visitorId,
        { source: 'google', medium: 'cpc' } // Different data
      );

      // Should return the same visitor (first-touch preserved)
      expect(second.id).toBe(first.id);
      expect(second.first_touch_data.source).toBe('facebook'); // Original source preserved
    });

    it('should update email if visitor exists but email is not set', async () => {
      const user = await createUser();
      const visitorId = `visitor-${uuidv4()}`;

      // Create visitor without email
      await trackingService.createOrUpdateVisitor(user.id, visitorId, {});

      // Update with email
      await trackingService.createOrUpdateVisitor(
        user.id,
        visitorId,
        {},
        'newemail@example.com'
      );

      // Verify email was updated
      const result = await query(
        'SELECT email FROM visitors WHERE user_id = $1 AND visitor_id = $2',
        [user.id, visitorId]
      );

      expect(result.rows[0].email).toBe('newemail@example.com');
    });

    it('should not overwrite existing email', async () => {
      const user = await createUser();
      const visitorId = `visitor-${uuidv4()}`;

      // Create with email
      await trackingService.createOrUpdateVisitor(
        user.id,
        visitorId,
        {},
        'original@example.com'
      );

      // Try to update with different email
      await trackingService.createOrUpdateVisitor(
        user.id,
        visitorId,
        {},
        'different@example.com'
      );

      // Verify original email is preserved
      const result = await query(
        'SELECT email FROM visitors WHERE user_id = $1 AND visitor_id = $2',
        [user.id, visitorId]
      );

      expect(result.rows[0].email).toBe('original@example.com');
    });
  });

  describe('createSession', () => {
    it('should create a session with UTM parameters', async () => {
      const user = await createUser();
      const visitor = await createVisitor({ userId: user.id });
      const sessionId = `session-${uuidv4()}`;
      const eventData = {
        source: 'instagram',
        medium: 'social',
        campaign: 'influencer-campaign',
        content: 'story-1',
        term: 'fitness',
        referrer: 'https://instagram.com',
        landingPage: 'https://example.com/promo',
      };

      await trackingService.createSession(visitor.id, sessionId, eventData);

      // Verify session was created
      const result = await query(
        'SELECT * FROM sessions WHERE visitor_id = $1 AND session_id = $2',
        [visitor.id, sessionId]
      );

      expect(result.rows.length).toBe(1);
      const session = result.rows[0];
      expect(session.source).toBe('instagram');
      expect(session.medium).toBe('social');
      expect(session.campaign).toBe('influencer-campaign');
      expect(session.content).toBe('story-1');
      expect(session.term).toBe('fitness');
      expect(session.referrer).toBe('https://instagram.com');
      expect(session.landing_page).toBe('https://example.com/promo');
    });

    it('should default source and medium if not provided', async () => {
      const user = await createUser();
      const visitor = await createVisitor({ userId: user.id });
      const sessionId = `session-${uuidv4()}`;

      await trackingService.createSession(visitor.id, sessionId, {});

      const result = await query(
        'SELECT source, medium FROM sessions WHERE session_id = $1',
        [sessionId]
      );

      expect(result.rows[0].source).toBe('direct');
      expect(result.rows[0].medium).toBe('none');
    });

    it('should allow multiple sessions for the same visitor', async () => {
      const user = await createUser();
      const visitor = await createVisitor({ userId: user.id });

      await trackingService.createSession(visitor.id, 'session-1', { source: 'google' });
      await trackingService.createSession(visitor.id, 'session-2', { source: 'facebook' });
      await trackingService.createSession(visitor.id, 'session-3', { source: 'email' });

      const result = await query(
        'SELECT COUNT(*) as count FROM sessions WHERE visitor_id = $1',
        [visitor.id]
      );

      expect(parseInt(result.rows[0].count)).toBe(3);
    });
  });

  describe('recordTrackingEvent', () => {
    it('should create visitor and session for visit event', async () => {
      const user = await createUser();
      const visitorId = `visitor-${uuidv4()}`;
      const sessionId = `session-${uuidv4()}`;

      const event = {
        visitorId,
        sessionId,
        eventType: 'visit' as const,
        eventData: {
          source: 'youtube',
          medium: 'video',
          campaign: 'tutorial',
          referrer: 'https://youtube.com',
          landingPage: 'https://example.com/course',
        },
      };

      const result = await trackingService.recordTrackingEvent(user.id, event);

      expect(result.success).toBe(true);

      // Verify visitor was created
      const visitorResult = await query(
        'SELECT * FROM visitors WHERE user_id = $1 AND visitor_id = $2',
        [user.id, visitorId]
      );
      expect(visitorResult.rows.length).toBe(1);

      // Verify session was created
      const sessionResult = await query(
        'SELECT * FROM sessions WHERE session_id = $1',
        [sessionId]
      );
      expect(sessionResult.rows.length).toBe(1);

      // Verify tracking event was stored
      const eventResult = await query(
        'SELECT * FROM tracking_events WHERE visitor_id = $1',
        [visitorId]
      );
      expect(eventResult.rows.length).toBe(1);
    });

    it('should handle identify event and update visitor email', async () => {
      const user = await createUser();
      const visitor = await createVisitor({
        userId: user.id,
        visitorId: 'visitor-identify',
      });

      const event = {
        visitorId: 'visitor-identify',
        sessionId: 'session-identify',
        eventType: 'identify' as const,
        eventData: {
          email: 'identified@example.com',
        },
      };

      const result = await trackingService.recordTrackingEvent(user.id, event);

      expect(result.success).toBe(true);

      // Verify email was updated
      const visitorResult = await query(
        'SELECT email FROM visitors WHERE visitor_id = $1',
        ['visitor-identify']
      );
      expect(visitorResult.rows[0].email).toBe('identified@example.com');

      // Verify identify event was stored
      const eventResult = await query(
        'SELECT * FROM tracking_events WHERE event_type = $1',
        ['identify']
      );
      expect(eventResult.rows.length).toBe(1);
    });

    it('should store event data as JSON', async () => {
      const user = await createUser();
      const visitorId = `visitor-${uuidv4()}`;
      const sessionId = `session-${uuidv4()}`;

      const eventData = {
        source: 'linkedin',
        medium: 'social',
        campaign: 'b2b-outreach',
        customField: 'custom-value',
      };

      const event = {
        visitorId,
        sessionId,
        eventType: 'pageview' as const,
        eventData,
      };

      await trackingService.recordTrackingEvent(user.id, event);

      const result = await query(
        'SELECT event_data FROM tracking_events WHERE visitor_id = $1',
        [visitorId]
      );

      const storedData = result.rows[0].event_data;
      expect(storedData).toMatchObject(eventData);
    });
  });

  describe('getOrCreateTrackingScript', () => {
    it('should create a new tracking script for user', async () => {
      const user = await createUser();

      const scriptId = await trackingService.getOrCreateTrackingScript(user.id);

      expectValidUUID(scriptId);

      // Verify it was stored
      const result = await query(
        'SELECT script_id FROM tracking_scripts WHERE user_id = $1',
        [user.id]
      );
      expect(result.rows[0].script_id).toBe(scriptId);
    });

    it('should return existing script ID if already exists', async () => {
      const user = await createUser();

      const firstCall = await trackingService.getOrCreateTrackingScript(user.id);
      const secondCall = await trackingService.getOrCreateTrackingScript(user.id);

      expect(firstCall).toBe(secondCall);
    });
  });

  describe('getUserByScriptId', () => {
    it('should return user ID for valid script ID', async () => {
      const user = await createUser();
      const scriptId = await trackingService.getOrCreateTrackingScript(user.id);

      const userId = await trackingService.getUserByScriptId(scriptId);

      expect(userId).toBe(user.id);
    });

    it('should return null for invalid script ID', async () => {
      const userId = await trackingService.getUserByScriptId('nonexistent-script-id');

      expect(userId).toBeNull();
    });
  });

  describe('findVisitorByEmail', () => {
    it('should find visitor by email', async () => {
      const user = await createUser();
      const visitor = await createVisitor({
        userId: user.id,
        email: 'findme@example.com',
      });

      const result = await trackingService.findVisitorByEmail(user.id, 'findme@example.com');

      expect(result).toBeDefined();
      expect(result?.id).toBe(visitor.id);
      expect(result?.visitorId).toBe(visitor.visitor_id);
      expect(result?.email).toBe('findme@example.com');
    });

    it('should return null if email not found', async () => {
      const user = await createUser();

      const result = await trackingService.findVisitorByEmail(user.id, 'notfound@example.com');

      expect(result).toBeNull();
    });

    it('should return most recent visitor if multiple visitors with same email', async () => {
      const user = await createUser();

      // Create two visitors with same email (edge case)
      const older = await createVisitor({
        userId: user.id,
        email: 'duplicate@example.com',
      });

      // Wait a bit to ensure different created_at timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      const newer = await createVisitor({
        userId: user.id,
        email: 'duplicate@example.com',
      });

      const result = await trackingService.findVisitorByEmail(user.id, 'duplicate@example.com');

      // Should return the newer one
      expect(result?.id).toBe(newer.id);
    });

    it('should only return visitors for the specified user', async () => {
      const user1 = await createUser();
      const user2 = await createUser();

      await createVisitor({
        userId: user1.id,
        email: 'user1@example.com',
      });

      const result = await trackingService.findVisitorByEmail(user2.id, 'user1@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findVisitorByFingerprint', () => {
    it('should find visitor by device fingerprint within time window', async () => {
      const user = await createUser();
      const fingerprint = 'fp-unique-12345';
      const visitor = await createVisitor({
        userId: user.id,
        deviceFingerprint: fingerprint,
      });

      const result = await trackingService.findVisitorByFingerprint(
        user.id,
        fingerprint,
        24
      );

      expect(result).toBeDefined();
      expect(result?.id).toBe(visitor.id);
      expect(result?.visitorId).toBe(visitor.visitor_id);
    });

    it('should return null if fingerprint not found', async () => {
      const user = await createUser();

      const result = await trackingService.findVisitorByFingerprint(
        user.id,
        'nonexistent-fp',
        24
      );

      expect(result).toBeNull();
    });

    it('should respect the time window parameter', async () => {
      const user = await createUser();
      const fingerprint = 'fp-old';

      // Create visitor with old timestamp (simulate by directly inserting)
      const visitorId = `visitor-${uuidv4()}`;
      await query(
        `INSERT INTO visitors (user_id, visitor_id, device_fingerprint, first_touch_data, created_at)
         VALUES ($1, $2, $3, $4, NOW() - INTERVAL '48 hours')`,
        [user.id, visitorId, fingerprint, JSON.stringify({ source: 'old' })]
      );

      // Search with 24-hour window - should not find
      const result24h = await trackingService.findVisitorByFingerprint(
        user.id,
        fingerprint,
        24
      );
      expect(result24h).toBeNull();

      // Search with 72-hour window - should find
      const result72h = await trackingService.findVisitorByFingerprint(
        user.id,
        fingerprint,
        72
      );
      expect(result72h).toBeDefined();
    });

    it('should only return visitors for the specified user', async () => {
      const user1 = await createUser();
      const user2 = await createUser();
      const fingerprint = 'fp-user1';

      await createVisitor({
        userId: user1.id,
        deviceFingerprint: fingerprint,
      });

      const result = await trackingService.findVisitorByFingerprint(
        user2.id,
        fingerprint,
        24
      );

      expect(result).toBeNull();
    });
  });

  describe('getVisitorSessions', () => {
    it('should return all sessions for a visitor ordered by timestamp', async () => {
      const user = await createUser();
      const visitor = await createVisitor({ userId: user.id });

      const now = new Date();
      await createSession({
        visitorId: visitor.id,
        source: 'google',
        timestamp: new Date(now.getTime() - 7200000), // 2 hours ago
      });
      await createSession({
        visitorId: visitor.id,
        source: 'facebook',
        timestamp: new Date(now.getTime() - 3600000), // 1 hour ago
      });
      await createSession({
        visitorId: visitor.id,
        source: 'email',
        timestamp: new Date(now.getTime() - 1800000), // 30 min ago
      });

      const sessions = await trackingService.getVisitorSessions(visitor.id);

      expect(sessions).toHaveLength(3);
      // Should be ordered by timestamp ascending
      expect(sessions[0].source).toBe('google');
      expect(sessions[1].source).toBe('facebook');
      expect(sessions[2].source).toBe('email');
    });

    it('should return empty array if visitor has no sessions', async () => {
      const user = await createUser();
      const visitor = await createVisitor({ userId: user.id });

      const sessions = await trackingService.getVisitorSessions(visitor.id);

      expect(sessions).toEqual([]);
    });

    it('should include all session fields', async () => {
      const user = await createUser();
      const visitor = await createVisitor({ userId: user.id });
      const sessionId = `session-${uuidv4()}`;

      await createSession({
        visitorId: visitor.id,
        sessionId,
        source: 'linkedin',
        medium: 'social',
        campaign: 'test-campaign',
        content: 'test-content',
        term: 'test-term',
        referrer: 'https://linkedin.com',
        landingPage: 'https://example.com/landing',
      });

      const sessions = await trackingService.getVisitorSessions(visitor.id);

      expect(sessions[0]).toMatchObject({
        session_id: sessionId,
        source: 'linkedin',
        medium: 'social',
        campaign: 'test-campaign',
        content: 'test-content',
        term: 'test-term',
        referrer: 'https://linkedin.com',
        landing_page: 'https://example.com/landing',
      });
      expect(sessions[0].timestamp).toBeDefined();
    });
  });
});
