import { Router } from 'express';
import { trackingLimiter } from '../middleware/rateLimit';
import { trackingEventSchema } from '../utils/validation';
import * as trackingService from '../services/trackingService';

const router = Router();

// Track event (public endpoint - uses script ID for auth)
router.post('/event', trackingLimiter, async (req, res) => {
  try {
    const { scriptId, ...eventData } = req.body;

    if (!scriptId) {
      return res.status(400).json({ error: 'Script ID is required' });
    }

    // Get user ID from script ID
    const userId = await trackingService.getUserByScriptId(scriptId);

    if (!userId) {
      return res.status(404).json({ error: 'Invalid script ID' });
    }

    // Validate event data
    const event = trackingEventSchema.parse(eventData);

    // Record tracking event
    await trackingService.recordTrackingEvent(userId, event);

    res.status(200).json({ success: true });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Tracking error:', error);
    res.status(500).json({ error: 'Failed to record event' });
  }
});

// Health check for tracking
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
