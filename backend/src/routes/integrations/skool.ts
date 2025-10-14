import { Router, Response } from 'express';
import { AuthRequest, authenticate } from '../../middleware/auth';
import * as skoolService from '../../services/integrations/skoolService';
import { query } from '../../db/connection';

const router = Router();

/**
 * Connect Skool using API key
 * Unlike Kajabi/Teachable, Skool doesn't use OAuth
 * User provides API key from SkoolAPI.com or Skool settings
 */
router.post('/connect', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { apiKey, communityId } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    // Test API key validity before saving
    const isValid = await skoolService.testApiKey(apiKey);

    if (!isValid) {
      return res.status(400).json({
        error: 'Invalid API key. Please check your Skool API credentials.',
      });
    }

    // Save integration
    await skoolService.saveIntegration(req.user!.userId, apiKey, communityId);

    // Generate webhook URL for user to configure in Skool/Zapier
    const webhookUrl = skoolService.getWebhookUrl(req.user!.userId);

    res.json({
      message: 'Skool connected successfully',
      webhookUrl,
      instructions: 'Copy the webhook URL and configure it in your Skool community settings or Zapier integration.',
    });
  } catch (error: any) {
    console.error('Skool connection error:', error);
    res.status(500).json({ error: error.message || 'Failed to connect Skool' });
  }
});

/**
 * Get webhook URL for configuring in Skool/Zapier
 */
router.get('/webhook-url', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const webhookUrl = skoolService.getWebhookUrl(req.user!.userId);

    res.json({ webhookUrl });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate webhook URL' });
  }
});

/**
 * Trigger manual sync
 * Note: This may have limited functionality depending on Skool API capabilities
 * Primary integration method is webhook-based
 */
router.post('/sync', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await skoolService.syncPurchases(req.user!.userId);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Sync failed',
      recommendation: 'For best results, use webhook-based integration via Zapier for real-time purchase tracking.',
    });
  }
});

/**
 * Get sync status
 */
router.get('/sync-status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const status = await skoolService.getSyncStatus(req.user!.userId);

    res.json({ status });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sync status' });
  }
});

/**
 * Get integration status
 */
router.get('/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const integration = await skoolService.getIntegration(req.user!.userId);

    if (!integration) {
      return res.json({ connected: false });
    }

    // Return webhook URL along with status
    const webhookUrl = skoolService.getWebhookUrl(req.user!.userId);

    res.json({
      connected: true,
      status: integration.status,
      webhookUrl,
      communityId: integration.communityId,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch integration status' });
  }
});

/**
 * Disconnect Skool integration
 */
router.delete('/disconnect', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await query(
      'UPDATE platform_integrations SET status = $1, updated_at = NOW() WHERE user_id = $2 AND platform = $3',
      ['disconnected', req.user!.userId, 'skool']
    );

    res.json({ message: 'Skool disconnected successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to disconnect Skool' });
  }
});

/**
 * Test API key validity
 */
router.post('/test-api-key', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    const isValid = await skoolService.testApiKey(apiKey);

    res.json({
      valid: isValid,
      message: isValid
        ? 'API key is valid'
        : 'Invalid API key. Please check your credentials.',
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to test API key' });
  }
});

export default router;
