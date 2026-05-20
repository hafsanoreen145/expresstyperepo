/**
 * Auth Service
 * Business logic for authentication and OAuth operations
 */

import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { exchangeCodeForToken, getLinkedInProfile, getLinkedInEmail } from '../config/oauth';
import { UserService } from './userService';
import { OAuthError, NotFoundError, AuthenticationError } from '../helpers/errors';
import { generateToken, verifyToken, DecodedToken } from '../helpers/jwt';
import { ErrorCode, CONFIG } from '../constants';

const prisma = new PrismaClient();

export class AuthService {
  /**
   * Exchange OAuth code for tokens and create/update user
   */
  static async handleOAuthCallback(code: string) {
    try {
      // Exchange code for LinkedIn token
      const tokenData = await exchangeCodeForToken(code);

      // Get LinkedIn profile
      const linkedinProfile = await getLinkedInProfile(tokenData.access_token);
      const email = await getLinkedInEmail(tokenData.access_token);

      // Find or create user
      let user = await UserService.getUserByLinkedInId(linkedinProfile.id);

      if (!user) {
        user = await UserService.createUser({
          linkedinId: linkedinProfile.id,
          email: email || `${linkedinProfile.id}@linkedin.placeholder`,
          name: `${linkedinProfile.localizedFirstName} ${linkedinProfile.localizedLastName}`,
          avatar: linkedinProfile.profilePicture?.displayImage,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          tokenExpiration: new Date(Date.now() + tokenData.expires_in * 1000),
        });
      } else {
        // Update existing user
        user = await UserService.updateUser(user.id, {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          tokenExpiration: new Date(Date.now() + tokenData.expires_in * 1000),
        });
      }

      // Create session
      const sessionToken = generateToken({ userId: user.id, email: user.email });

      await prisma.session.create({
        data: {
          userId: user.id,
          token: sessionToken,
          expiresAt: new Date(Date.now() + CONFIG.SESSION_DURATION),
        },
      });

      return {
        token: sessionToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
        },
      };
    } catch (error) {
      if (error instanceof OAuthError || error instanceof AuthenticationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new OAuthError(ErrorCode.OAUTH_FAILED, `OAuth callback failed: ${error}`);
    }
  }

  /**
   * Refresh session token
   */
  static async refreshSession(userId: string) {
    const user = await UserService.getUserById(userId);

    // Generate new token
    const newToken = generateToken({ userId: user.id, email: user.email });

    // Create new session
    await prisma.session.create({
      data: {
        userId: user.id,
        token: newToken,
        expiresAt: new Date(Date.now() + CONFIG.SESSION_DURATION),
      },
    });

    return { token: newToken };
  }

  /**
   * Validate session and get session data
   */
  static async validateSession(token: string): Promise<DecodedToken> {
    try {
      const decoded = verifyToken(token);

      // Check if session exists in database
      const session = await prisma.session.findUnique({
        where: { token },
      });

      if (!session || session.expiresAt < new Date()) {
        throw new AuthenticationError('Session expired or invalid');
      }

      return decoded;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      throw new AuthenticationError('Failed to validate session');
    }
  }

  /**
   * Logout user
   */
  static async logout(token: string) {
    await prisma.session.deleteMany({
      where: { token },
    });
  }

  /**
   * Get current user from token
   */
  static async getCurrentUser(userId: string) {
    return UserService.getUserById(userId);
  }
}
