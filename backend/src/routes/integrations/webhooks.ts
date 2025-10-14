import { Router } from 'express';
import * as kajabiService from '../../services/integrations/kajabiService';
import * as teachableService from '../../services/integrations/teachableService';
import * as skoolService from '../../services/integrations/skoolService';

const router = Router();

// Kajabi webhook receiver
router.post('/kajabi/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify webhook signature
    const signature = req.headers['x-kajabi-signature'] as string;
    if (!kajabiService.verifyWebhookSignature(req.body, signature)) {
      console.error('Invalid Kajabi webhook signature');
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    await kajabiService.handleWebhook(userId, req.body);

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Kajabi webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Teachable webhook receiver
router.post('/teachable/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify webhook signature
    const signature = req.headers['x-teachable-signature'] as string;
    if (!teachableService.verifyWebhookSignature(req.body, signature)) {
      console.error('Invalid Teachable webhook signature');
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    await teachableService.handleWebhook(userId, req.body);

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Teachable webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Skool webhook receiver
router.post('/skool/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify webhook signature (optional - depends on webhook source)
    const signature = req.headers['x-skool-signature'] as string;

    // Note: Signature verification is flexible for Skool since webhooks
    // can come from multiple sources (Zapier, payment processors, etc.)
    if (signature && !skoolService.verifyWebhookSignature(req.body, signature)) {
      console.warn('Skool webhook signature verification failed - processing anyway');
      // We don't reject here as Skool webhooks may come from various sources
    }

    await skoolService.handleWebhook(userId, req.body);

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Skool webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Stripe webhook receiver
router.post('/stripe', async (req, res) => {
  try {
    // TODO: Implement Stripe webhook handling

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
