/**
 * Authentication Routes v1
 * /api/v1/auth
 */

import { Router, Request, Response } from 'express';
import { asyncHandler, validate, authMiddleware, ValidatedRequest } from '../../middleware';
import { AuthService } from '../../services';
import { oauthCallbackSchema } from '../../helpers/validators';
import { generateLinkedInAuthUrl, generateState } from '../../config/linkedin';
import { AppError } from '../../helpers/errors';
import { MESSAGES } from '../../constants/messages';
import { ErrorCode, CONFIG } from '../../constants';

const router = Router();

// Store state temporarily (in production, use Redis)
const stateStore = new Map<string, number>();

/**
 * GET /api/v1/auth/linkedin/start
 * Initiates the LinkedIn OAuth flow
 */
router.get('/linkedin/start', asyncHandler(async (req: Request, res: Response) => {
  const state = generateState();
  stateStore.set(state, Date.now());

  // Clean up old states
  stateStore.forEach((timestamp, key) => {
    if (Date.now() - timestamp > CONFIG.STATE_EXPIRY) {
      stateStore.delete(key);
    }
  });

  const authUrl = generateLinkedInAuthUrl(state);

  res.json({
    success: true,
    message: MESSAGES.LOGIN_INITIATED,
    data: {
      authUrl,
      state,
    },
  });
}));

/**
 * GET /api/v1/auth/linkedin/callback
 * Handles LinkedIn OAuth callback
 */
router.get('/linkedin/callback', validate({ query: oauthCallbackSchema }), asyncHandler(async (req: ValidatedRequest, res: Response) => {
  const { code, state, error } = req.validated?.query || {};

  if (error) {
    throw new AppError(ErrorCode.OAUTH_FAILED, `LinkedIn OAuth failed: ${error}`);
  }

  // Verify state
  const stateTimestamp = stateStore.get(state);
  if (!stateTimestamp || Date.now() - stateTimestamp > CONFIG.STATE_EXPIRY) {
    throw new AppError(ErrorCode.OAUTH_STATE_INVALID, 'Invalid or expired state parameter');
  }
  stateStore.delete(state);

  // Handle OAuth callback
  const result = await AuthService.handleOAuthCallback(code);

  res.json({
    success: true,
    message: MESSAGES.LOGIN_SUCCESS,
    data: result,
  });
}));

/**
 * POST /api/v1/auth/session/exchange
 * Exchange a valid token for a refreshed token
 */
router.post('/session/exchange', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    throw new AppError(ErrorCode.AUTH_UNAUTHORIZED, 'User ID not found');
  }

  const result = await AuthService.refreshSession(userId);

  res.json({
    success: true,
    message: MESSAGES.SESSION_EXCHANGED,
    data: result,
  });
}));

/**
 * GET /api/v1/auth/me
 * Get current authenticated user
 */
router.get('/me', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;

  const user = await AuthService.getCurrentUser(userId!);

  res.json({
    success: true,
    message: MESSAGES.USER_FETCHED,
    data: user,
  });
}));

/**
 * POST /api/v1/auth/logout
 * Logout the current user and invalidate session
 */
router.post('/logout', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const token = req.token;

  if (token) {
    await AuthService.logout(token);
  }

  res.json({
    success: true,
    message: MESSAGES.LOGOUT_SUCCESS,
  });
}));

export default router;
