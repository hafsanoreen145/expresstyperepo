/**
 * Authentication Middleware
 * Verifies JWT tokens and validates sessions
 */

import { Request, Response, NextFunction } from 'express';
import { extractTokenFromHeader, verifyToken } from '../helpers/jwt';
import { asyncHandler } from './errorHandler';
import { AuthenticationError } from '../helpers/errors';
import { AuthService } from '../services';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: any;
      token?: string;
    }
  }
}

/**
 * Required authentication middleware
 * Will throw error if token is missing or invalid
 */
export const authMiddleware = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = extractTokenFromHeader(req.headers.authorization) || req.cookies?.token;

    if (!token) {
      throw new AuthenticationError('No authentication token provided');
    }

    // Validate token and session
    const decoded = await AuthService.validateSession(token);

    req.userId = decoded.userId;
    req.token = token;
    req.user = { id: decoded.userId };

    next();
  }
);

/**
 * Optional authentication middleware
 * Will not throw error if token is missing
 * Sets userId if valid token is provided
 */
export const optionalAuth = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = extractTokenFromHeader(req.headers.authorization) || req.cookies?.token;

      if (token) {
        const decoded = await AuthService.validateSession(token);
        req.userId = decoded.userId;
        req.token = token;
      }
    } catch (error) {
      // Silently fail for optional auth
    }

    next();
  }
);
