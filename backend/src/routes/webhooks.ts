import { Router } from 'express';
import * as kajabiService from '../services/kajabiService';

const router = Router();

// Kajabi webhook receiver
router.post('/kajabi/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // TODO: Verify webhook signature

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

    // TODO: Implement Teachable webhook handling

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Teachable webhook error:', error);
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
