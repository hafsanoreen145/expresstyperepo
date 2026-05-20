/**
 * API Routes Index
 * Central routing for all endpoints
 */

import { Router } from 'express';
import authRoutes from './v1/auth';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// Auth routes
router.use('/auth', authRoutes);

export default router;
