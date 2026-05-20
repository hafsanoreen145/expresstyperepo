/**
 * User Service
 * Business logic for user operations
 */

import { PrismaClient } from '@prisma/client';
import { NotFoundError } from '../helpers/errors';

const prisma = new PrismaClient();

export class UserService {
  /**
   * Get user by ID
   */
  static async getUserById(userId: string) {
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
      throw new NotFoundError('User');
    }

    return user;
  }

  /**
   * Get user by LinkedIn ID
   */
  static async getUserByLinkedInId(linkedinId: string) {
    return prisma.user.findUnique({
      where: { linkedinId },
    });
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Create new user
   */
  static async createUser(data: {
    linkedinId: string;
    email: string;
    name: string;
    avatar?: string;
    accessToken: string;
    refreshToken?: string;
    tokenExpiration?: Date;
  }) {
    return prisma.user.create({
      data,
    });
  }

  /**
   * Update user
   */
  static async updateUser(
    userId: string,
    data: Partial<{
      linkedinId?: string;
      email?: string;
      name?: string;
      avatar?: string;
      accessToken?: string;
      refreshToken?: string;
      tokenExpiration?: Date;
    }>
  ) {
    return prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  /**
   * Delete user (use with caution)
   */
  static async deleteUser(userId: string) {
    return prisma.user.delete({
      where: { id: userId },
    });
  }
}
