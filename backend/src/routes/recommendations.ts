import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import {
  getRecommendations,
  getUserAIPreference,
  updateUserAIPreference,
  clearRecommendationCache,
} from '../services/recommendationService';

const router = Router();

/**
 * GET /api/recommendations
 * Get AI-powered recommendations for the current user
 * Query params:
 *   - range: Date range for analytics data
 *   - source: Optional source filter
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Get analytics data from request (passed from frontend or fetch here)
    const { summary, sources } = req.body;

    if (!summary || !sources) {
      return res.status(400).json({
        error: 'Missing required data. Please provide summary and sources.',
      });
    }

    // Check user's AI preference
    const useAI = await getUserAIPreference(userId);

    // Generate recommendations
    const recommendations = await getRecommendations(
      { userId, summary, sources },
      useAI
    );

    res.json({
      recommendations,
      aiEnabled: useAI,
      source: useAI && process.env.OPENAI_API_KEY ? 'ai' : 'rule-based',
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

/**
 * POST /api/recommendations/generate
 * Generate recommendations with provided analytics data
 */
router.post('/generate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { summary, sources } = req.body;

    if (!summary || !sources) {
      return res.status(400).json({
        error: 'Missing required data. Please provide summary and sources.',
      });
    }

    // Check user's AI preference
    const useAI = await getUserAIPreference(userId);

    // Generate recommendations
    const recommendations = await getRecommendations(
      { userId, summary, sources },
      useAI
    );

    res.json({
      recommendations,
      aiEnabled: useAI,
      source: useAI && process.env.OPENAI_API_KEY ? 'ai' : 'rule-based',
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

/**
 * GET /api/recommendations/preference
 * Get user's AI recommendation preference
 */
router.get('/preference', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const enabled = await getUserAIPreference(userId);

    res.json({
      aiEnabled: enabled,
      available: !!process.env.OPENAI_API_KEY,
    });
  } catch (error) {
    console.error('Error getting AI preference:', error);
    res.status(500).json({ error: 'Failed to get preference' });
  }
});

/**
 * PUT /api/recommendations/preference
 * Update user's AI recommendation preference
 */
router.put('/preference', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        error: 'Invalid request. Please provide "enabled" as boolean.',
      });
    }

    await updateUserAIPreference(userId, enabled);

    // Clear cache when preference changes
    clearRecommendationCache(userId);

    res.json({
      success: true,
      aiEnabled: enabled,
    });
  } catch (error) {
    console.error('Error updating AI preference:', error);
    res.status(500).json({ error: 'Failed to update preference' });
  }
});

/**
 * POST /api/recommendations/clear-cache
 * Clear recommendation cache for current user (useful after data changes)
 */
router.post('/clear-cache', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    clearRecommendationCache(userId);

    res.json({ success: true, message: 'Cache cleared' });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

export default router;
