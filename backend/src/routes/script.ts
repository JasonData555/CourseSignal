import { Router, Response } from 'express';
import { AuthRequest, authenticate } from '../middleware/auth';
import * as trackingService from '../services/trackingService';

const router = Router();

// Get or create tracking script for authenticated user
router.get('/generate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const scriptId = await trackingService.getOrCreateTrackingScript(req.user!.userId);

    const scriptContent = `
<!-- CourseSignal Tracking Script -->
<script>
(function() {
  var scriptId = '${scriptId}';
  var apiUrl = '${process.env.APP_URL || 'http://localhost:3000'}/api/tracking/event';

  // Load tracking library
  var script = document.createElement('script');
  script.src = '${process.env.APP_URL || 'http://localhost:3000'}/track.js';
  script.async = true;
  script.onload = function() {
    if (window.CourseSignal) {
      window.CourseSignal.init(scriptId, apiUrl);
    }
  };
  document.head.appendChild(script);
})();
</script>
    `.trim();

    res.json({
      scriptId,
      scriptContent,
      instructions: {
        kajabi: 'Go to Settings > Custom Code > Head Tracking Code and paste the script.',
        teachable: 'Go to Settings > Code Snippets > Head Code and paste the script.',
        general: 'Paste this script in the <head> section of your website.',
      },
    });
  } catch (error) {
    console.error('Script generation error:', error);
    res.status(500).json({ error: 'Failed to generate script' });
  }
});

// Get current script info
router.get('/info', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const scriptId = await trackingService.getOrCreateTrackingScript(req.user!.userId);

    res.json({
      scriptId,
      scriptUrl: `${process.env.APP_URL || 'http://localhost:3000'}/track.js`,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch script info' });
  }
});

export default router;
