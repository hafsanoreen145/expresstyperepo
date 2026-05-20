/**
 * JWT Utilities
 * Helper functions for JWT token generation and verification
 */

import jwt, { SignOptions } from 'jsonwebtoken';
import { CONFIG } from '../constants';
import { AuthenticationError } from './errors';

interface TokenPayload {
  userId: string;
  email?: string;
}

interface DecodedToken extends TokenPayload {
  iat: number;
  exp: number;
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-jwt-secret-change-in-production';

/**
 * Generate JWT token
 */
export function generateToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: CONFIG.JWT_EXPIRES_IN as any,
    algorithm: 'HS256',
  };
  return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): DecodedToken {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    }) as DecodedToken;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError('Invalid token format');
    }
    throw new AuthenticationError('Token verification failed');
  }
}

/**
 * Decode token without verification
 * Use only for debugging or when you trust the source
 */
export function decodeToken(token: string): DecodedToken | null {
  try {
    return jwt.decode(token, { complete: false }) as DecodedToken;
  } catch (error) {
    return null;
  }
}

/**
 * Extract token from authorization header
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  return parts[1];
}
