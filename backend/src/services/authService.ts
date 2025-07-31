import { User } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/password';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';
import { LoginCredentials, RegisterData, TokenPair } from '../types';
import { prisma } from '../utils/database';

export class AuthService {
  /**
   * Register a new user
   */
  async register(
    userData: RegisterData
  ): Promise<{ user: Omit<User, 'password'>; tokens: TokenPair }> {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: userData.email }, { username: userData.username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === userData.email) {
        throw new Error('User with this email already exists');
      }
      if (existingUser.username === userData.username) {
        throw new Error('Username is already taken');
      }
    }

    // Hash the password
    const hashedPassword = await hashPassword(userData.password);

    // Create the user
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        username: userData.username,
        firstName: userData.firstName,
        lastName: userData.lastName,
        password: hashedPassword,
      },
    });

    // Generate tokens
    const tokens = generateTokens(user);

    // Return user without password
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens,
    };
  }

  /**
   * Authenticate user login
   */
  async login(
    credentials: LoginCredentials
  ): Promise<{ user: Omit<User, 'password'>; tokens: TokenPair }> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: credentials.email },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await comparePassword(
      credentials.password,
      user.password
    );

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate tokens
    const tokens = generateTokens(user);

    // Return user without password
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<TokenPair> {
    try {
      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // Find user to ensure they still exist
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Generate new tokens
      const tokens = generateTokens(user);

      return tokens;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<Omit<User, 'password'> | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updateData: {
      firstName?: string;
      lastName?: string;
      avatar?: string | null;
    }
  ): Promise<Omit<User, 'password'>> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(
      currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });
  }

  /**
   * Delete user account
   */
  async deleteAccount(userId: string): Promise<void> {
    await prisma.user.delete({
      where: { id: userId },
    });
  }
}
