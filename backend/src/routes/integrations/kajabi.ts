import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest, authenticate } from '../../middleware/auth';
import * as kajabiService from '../../services/integrations/kajabiService';
import { query } from '../../db/connection';

const router = Router();

// Initiate OAuth flow
router.get('/connect', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const state = uuidv4();

    // Store state for verification
    await query('UPDATE users SET password_reset_token = $1 WHERE id = $2', [
      state,
      req.user!.userId,
    ]);

    const authUrl = kajabiService.getOAuthUrl(state);

    res.json({ authUrl });
  } catch (error) {
    res.status(500).json({ error: 'Failed to initiate OAuth flow' });
  }
});

// OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({ error: 'Missing code or state' });
    }

    // Verify state
    const userResult = await query('SELECT id FROM users WHERE password_reset_token = $1', [
      state,
    ]);

    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid state' });
    }

    const userId = userResult.rows[0].id;

    // Exchange code for tokens
    const { accessToken, refreshToken } = await kajabiService.exchangeCodeForToken(
      code as string
    );

    // Save integration
    await kajabiService.saveIntegration(userId, accessToken, refreshToken);

    // Register webhook
    await kajabiService.registerWebhook(userId, accessToken);

    // Clear state
    await query('UPDATE users SET password_reset_token = NULL WHERE id = $1', [userId]);

    // Start background sync
    kajabiService.syncPurchases(userId).catch((error) => {
      console.error('Background sync failed:', error);
    });

    // Redirect to frontend
    res.redirect(`${process.env.APP_URL}/dashboard?kajabi=connected`);
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    res.redirect(`${process.env.APP_URL}/dashboard?error=kajabi_connection_failed`);
  }
});

// Trigger manual sync
router.post('/sync', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await kajabiService.syncPurchases(req.user!.userId);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Sync failed' });
  }
});

// Get sync status
router.get('/sync-status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const status = await kajabiService.getSyncStatus(req.user!.userId);

    res.json({ status });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sync status' });
  }
});

// Get integration status
router.get('/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const integration = await kajabiService.getIntegration(req.user!.userId);

    if (!integration) {
      return res.json({ connected: false });
    }

    res.json({
      connected: true,
      status: integration.status,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch integration status' });
  }
});

// Disconnect
router.delete('/disconnect', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await query(
      'UPDATE platform_integrations SET status = $1, updated_at = NOW() WHERE user_id = $2 AND platform = $3',
      ['disconnected', req.user!.userId, 'kajabi']
    );

    res.json({ message: 'Kajabi disconnected successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to disconnect Kajabi' });
  }
});

export default router;
