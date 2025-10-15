import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth';
import trackingRoutes from './routes/tracking';
import scriptRoutes from './routes/script';
import kajabiRoutes from './routes/integrations/kajabi';
import teachableRoutes from './routes/integrations/teachable';
import skoolRoutes from './routes/integrations/skool';
import webhooksRoutes from './routes/integrations/webhooks';
import analyticsRoutes from './routes/analytics';
import launchesRoutes from './routes/launches/launches';
import publicRoutes from './routes/launches/public';
import recommendationsRoutes from './routes/recommendations';
import { apiLimiter } from './middleware/rateLimit';
import { startLaunchStatusUpdater } from './jobs/launchStatusUpdater';

// Load environment variables from .env file (handles both dev and compiled dist scenarios)
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.APP_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve tracking script
app.use('/track.js', express.static(path.join(__dirname, 'public', 'track.js')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/script', scriptRoutes);
app.use('/api/kajabi', kajabiRoutes);
app.use('/api/teachable', teachableRoutes);
app.use('/api/skool', skoolRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/launches', launchesRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/recommendations', recommendationsRoutes);

// Apply rate limiting to API routes
app.use('/api', apiLimiter);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);

  // Start background jobs
  startLaunchStatusUpdater();
});

export default app;
