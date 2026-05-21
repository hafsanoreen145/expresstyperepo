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
      console.log('[AuthService] Starting OAuth callback handler');
      console.log('[AuthService] Received code:', code.substring(0, 20) + '...');

      // Exchange code for LinkedIn token
      console.log('[AuthService] Step 1: Exchanging code for LinkedIn token...');
      const tokenData = await exchangeCodeForToken(code);
      console.log('[AuthService] Step 1 ✓: Token exchange successful');
      console.log('[AuthService] Token data keys:', Object.keys(tokenData));

      // Get LinkedIn profile
      console.log('[AuthService] Step 2: Fetching LinkedIn profile...');
      const linkedinProfile = await getLinkedInProfile(tokenData.access_token);
      console.log('[AuthService] Step 2 ✓: Profile fetched successfully');
      console.log('[AuthService] LinkedIn Profile ID:', linkedinProfile.id);
      console.log('[AuthService] LinkedIn Profile Name:', linkedinProfile.localizedFirstName, linkedinProfile.localizedLastName);
      console.log('[AuthService] LinkedIn Email from profile:', linkedinProfile.email);

      // Email is already included in the profile from userinfo endpoint
      const email = linkedinProfile.email;
      console.log('[AuthService] Step 3: Email obtained from profile');
      console.log('[AuthService] Email:', email);

      // Find or create user
      console.log('[AuthService] Step 4: Checking if user exists...');
      let user = await UserService.getUserByLinkedInId(linkedinProfile.id);
      console.log('[AuthService] User exists:', !!user);

      if (!user) {
        console.log('[AuthService] Step 5a: Creating new user...');
        user = await UserService.createUser({
          linkedinId: linkedinProfile.id,
          email: email || `${linkedinProfile.id}@linkedin.placeholder`,
          name: `${linkedinProfile.localizedFirstName} ${linkedinProfile.localizedLastName}`,
          avatar: linkedinProfile.profilePicture?.displayImage,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          tokenExpiration: new Date(Date.now() + tokenData.expires_in * 1000),
        });
        console.log('[AuthService] Step 5a ✓: New user created with ID:', user.id);
      } else {
        console.log('[AuthService] Step 5b: Updating existing user...');
        // Update existing user
        user = await UserService.updateUser(user.id, {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          tokenExpiration: new Date(Date.now() + tokenData.expires_in * 1000),
        });
        console.log('[AuthService] Step 5b ✓: User updated with ID:', user.id);
      }

      // Create session
      console.log('[AuthService] Step 6: Creating session...');
      const sessionToken = generateToken({ userId: user.id, email: user.email });

      await prisma.session.create({
        data: {
          userId: user.id,
          token: sessionToken,
          expiresAt: new Date(Date.now() + CONFIG.SESSION_DURATION),
        },
      });
      console.log('[AuthService] Step 6 ✓: Session created');

      console.log('[AuthService] OAuth callback handler completed successfully');

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
      console.error('[AuthService] OAuth callback handler failed');
      console.error('[AuthService] Error type:', error?.constructor?.name);
      console.error('[AuthService] Error message:', (error as any)?.message);
      console.error('[AuthService] Full error:', error);

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
