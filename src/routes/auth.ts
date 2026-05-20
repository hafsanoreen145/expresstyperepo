import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { generateLinkedInAuthUrl, generateState, linkedinConfig } from '../config/linkedin';
import { exchangeCodeForToken, getLinkedInProfile, getLinkedInEmail } from '../config/oauth';
import { authMiddleware } from '../middleware/auth';
import { ApiResponse, AuthSession } from '../types';

const router = Router();
const prisma = new PrismaClient();

// Store state temporarily (in production, use Redis or database)
const stateStore = new Map<string, number>();
const STATE_EXPIRY = 10 * 60 * 1000; // 10 minutes

/**
 * GET /api/auth/linkedin/start
 * Initiates the LinkedIn OAuth flow
 */
router.get('/linkedin/start', (req: Request, res: Response) => {
  try {
    const state = generateState();
    stateStore.set(state, Date.now());

    // Clean up old states
    stateStore.forEach((timestamp, key) => {
      if (Date.now() - timestamp > STATE_EXPIRY) {
        stateStore.delete(key);
      }
    });

    const authUrl = generateLinkedInAuthUrl(state);
    
    res.json({
      success: true,
      data: {
        authUrl,
        state,
      },
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Failed to initiate OAuth: ${error}`,
    } as ApiResponse);
  }
});

/**
 * GET /api/auth/linkedin/callback
 * Handles LinkedIn OAuth callback
 */
router.get('/linkedin/callback', async (req: Request, res: Response) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.status(400).json({
        success: false,
        error: `LinkedIn auth failed: ${error}`,
      } as ApiResponse);
    }

    if (!code || !state) {
      return res.status(400).json({
        success: false,
        error: 'Missing code or state parameter',
      } as ApiResponse);
    }

    // Verify state
    const stateTimestamp = stateStore.get(state as string);
    if (!stateTimestamp || Date.now() - stateTimestamp > STATE_EXPIRY) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired state parameter',
      } as ApiResponse);
    }
    stateStore.delete(state as string);

    // Exchange code for token
    const tokenData = await exchangeCodeForToken(code as string);

    // Get LinkedIn profile
    const linkedinProfile = await getLinkedInProfile(tokenData.access_token);
    const email = await getLinkedInEmail(tokenData.access_token);

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { linkedinId: linkedinProfile.id },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          linkedinId: linkedinProfile.id,
          email: email || `${linkedinProfile.id}@linkedin.placeholder`,
          name: `${linkedinProfile.localizedFirstName} ${linkedinProfile.localizedLastName}`,
          avatar: linkedinProfile.profilePicture?.displayImage,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          tokenExpiration: new Date(Date.now() + tokenData.expires_in * 1000),
        },
      });
    } else {
      // Update existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          tokenExpiration: new Date(Date.now() + tokenData.expires_in * 1000),
        },
      });
    }

    // Create session
    const sessionToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token: sessionToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      success: true,
      data: {
        userId: user.id,
        token: sessionToken,
        email: user.email,
        name: user.name || '',
        avatar: user.avatar,
        linkedinId: user.linkedinId,
      },
    } as ApiResponse<AuthSession>);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({
      success: false,
      error: `OAuth callback failed: ${error}`,
    } as ApiResponse);
  }
});

/**
 * POST /api/auth/session/exchange
 * Exchange a valid token for a refreshed token
 */
router.post('/session/exchange', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID not found',
      } as ApiResponse);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      } as ApiResponse);
    }

    // Create new session token
    const newToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    await prisma.session.create({
      data: {
        userId: user.id,
        token: newToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      success: true,
      data: {
        token: newToken,
      },
      message: 'Token refreshed successfully',
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Session exchange failed: ${error}`,
    } as ApiResponse);
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        linkedinId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Failed to fetch user: ${error}`,
    } as ApiResponse);
  }
});

/**
 * POST /api/auth/logout
 * Logout the current user and invalidate session
 */
router.post('/logout', authMiddleware, async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;

    if (token) {
      await prisma.session.deleteMany({
        where: { token },
      });
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Logout failed: ${error}`,
    } as ApiResponse);
  }
});

export default router;
