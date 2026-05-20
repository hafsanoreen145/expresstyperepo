/**
 * API v1 Routes Index
 * Central routing for all endpoints
 */

import { Router } from 'express';
import authRoutes from './auth';

const router = Router();

// Auth routes
router.use('/auth', authRoutes);

export default router;
