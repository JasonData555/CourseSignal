import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import trackingRoutes from './routes/tracking';
import scriptRoutes from './routes/script';
import kajabiRoutes from './routes/kajabi';
import teachableRoutes from './routes/teachable';
import webhooksRoutes from './routes/webhooks';
import analyticsRoutes from './routes/analytics';
import launchesRoutes from './routes/launches';
import publicRoutes from './routes/public';
import { apiLimiter } from './middleware/rateLimit';
import { startLaunchStatusUpdater } from './jobs/launchStatusUpdater';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.APP_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/launches', launchesRoutes);
app.use('/api/public', publicRoutes);

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
