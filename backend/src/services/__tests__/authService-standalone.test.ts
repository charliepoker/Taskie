import { AuthService } from '../authService';
import { hashPassword, comparePassword } from '../../utils/password';
import { generateTokens, verifyRefreshToken } from '../../utils/jwt';
import { prisma } from '../../utils/database';
import { User } from '@prisma/client';

// Mock dependencies
jest.mock('../../utils/password');
jest.mock('../../utils/jwt');
jest.mock('../../utils/database', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    passwordResetToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

// Mock AuthLogger
jest.mock('../../utils/authLogger', () => ({
  AuthLogger: {
    logAuthAttempt: jest.fn(),
    logAuthError: jest.fn(),
    logDatabaseOperation: jest.fn(),
  },
}));

const mockedHashPassword = hashPassword as jest.MockedFunction<
  typeof hashPassword
>;
const mockedComparePassword = comparePassword as jest.MockedFunction<
  typeof comparePassword
>;
const mockedGenerateTokens = generateTokens as jest.MockedFunction<
  typeof generateTokens
>;
const mockedVerifyRefreshToken = verifyRefreshToken as jest.MockedFunction<
  typeof verifyRefreshToken
>;
const mockedPrisma = prisma as any;

describe('AuthService', () => {
  let authService: AuthService;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    password: 'hashedPassword123',
    avatar: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  };

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerData = {
      email: 'test@example.com',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      password: 'TestPassword123!',
    };

    it('should register a new user successfully', async () => {
      mockedPrisma.user.findFirst.mockResolvedValue(null);
      mockedHashPassword.mockResolvedValue('hashedPassword123');
      mockedPrisma.user.create.mockResolvedValue(mockUser);
      mockedGenerateTokens.mockReturnValue(mockTokens);

      const result = await authService.register(registerData);

      expect(mockedPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { email: registerData.email },
            { username: registerData.username },
          ],
        },
      });
      expect(mockedHashPassword).toHaveBeenCalledWith(
        registerData.password,
        undefined
      );
      expect(mockedPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: registerData.email,
          username: registerData.username,
          firstName: registerData.firstName,
          lastName: registerData.lastName,
          password: 'hashedPassword123',
        },
      });
      expect(mockedGenerateTokens).toHaveBeenCalledWith(mockUser, undefined);
      expect((result.user as any).password).toBeUndefined();
      expect(result.tokens).toEqual(mockTokens);
    });

    it('should register user with request ID', async () => {
      const requestId = 'test-request-123';
      mockedPrisma.user.findFirst.mockResolvedValue(null);
      mockedHashPassword.mockResolvedValue('hashedPassword123');
      mockedPrisma.user.create.mockResolvedValue(mockUser);
      mockedGenerateTokens.mockReturnValue(mockTokens);

      const result = await authService.register(registerData, requestId);

      expect(mockedHashPassword).toHaveBeenCalledWith(
        registerData.password,
        requestId
      );
      expect(mockedGenerateTokens).toHaveBeenCalledWith(mockUser, requestId);
      expect((result.user as any).password).toBeUndefined();
    });

    it('should throw error when user with email already exists', async () => {
      const existingUser = { ...mockUser, email: registerData.email };
      mockedPrisma.user.findFirst.mockResolvedValue(existingUser);

      await expect(authService.register(registerData)).rejects.toThrow(
        'User with this email already exists'
      );

      expect(mockedHashPassword).not.toHaveBeenCalled();
      expect(mockedPrisma.user.create).not.toHaveBeenCalled();
    });

    it('should throw error when username already exists', async () => {
      const existingUser = {
        ...mockUser,
        email: 'different@example.com',
        username: registerData.username,
      };
      mockedPrisma.user.findFirst.mockResolvedValue(existingUser);

      await expect(authService.register(registerData)).rejects.toThrow(
        'Username is already taken'
      );

      expect(mockedHashPassword).not.toHaveBeenCalled();
      expect(mockedPrisma.user.create).not.toHaveBeenCalled();
    });

    it('should handle password hashing failure', async () => {
      mockedPrisma.user.findFirst.mockResolvedValue(null);
      mockedHashPassword.mockRejectedValue(new Error('Hashing failed'));

      await expect(authService.register(registerData)).rejects.toThrow(
        'Hashing failed'
      );

      expect(mockedPrisma.user.create).not.toHaveBeenCalled();
    });

    it('should handle database creation failure', async () => {
      mockedPrisma.user.findFirst.mockResolvedValue(null);
      mockedHashPassword.mockResolvedValue('hashedPassword123');
      mockedPrisma.user.create.mockRejectedValue(new Error('Database error'));

      await expect(authService.register(registerData)).rejects.toThrow(
        'Database error'
      );
    });

    it('should handle database lookup failure', async () => {
      mockedPrisma.user.findFirst.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(authService.register(registerData)).rejects.toThrow(
        'Database connection failed'
      );

      expect(mockedHashPassword).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginCredentials = {
      email: 'test@example.com',
      password: 'TestPassword123!',
    };

    it('should login user successfully with valid credentials', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockedComparePassword.mockResolvedValue(true);
      mockedGenerateTokens.mockReturnValue(mockTokens);

      const result = await authService.login(loginCredentials);

      expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginCredentials.email },
      });
      expect(mockedComparePassword).toHaveBeenCalledWith(
        loginCredentials.password,
        mockUser.password,
        undefined
      );
      expect(mockedGenerateTokens).toHaveBeenCalledWith(mockUser, undefined);
      expect((result.user as any).password).toBeUndefined();
      expect(result.tokens).toEqual(mockTokens);
    });

    it('should login user with request ID', async () => {
      const requestId = 'test-request-456';
      mockedPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockedComparePassword.mockResolvedValue(true);
      mockedGenerateTokens.mockReturnValue(mockTokens);

      const result = await authService.login(loginCredentials, requestId);

      expect(mockedComparePassword).toHaveBeenCalledWith(
        loginCredentials.password,
        mockUser.password,
        requestId
      );
      expect(mockedGenerateTokens).toHaveBeenCalledWith(mockUser, requestId);
      expect((result.user as any).password).toBeUndefined();
    });

    it('should throw error when user not found', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.login(loginCredentials)).rejects.toThrow(
        'Invalid email or password'
      );

      expect(mockedComparePassword).not.toHaveBeenCalled();
      expect(mockedGenerateTokens).not.toHaveBeenCalled();
    });

    it('should throw error when password is invalid', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockedComparePassword.mockResolvedValue(false);

      await expect(authService.login(loginCredentials)).rejects.toThrow(
        'Invalid email or password'
      );

      expect(mockedGenerateTokens).not.toHaveBeenCalled();
    });

    it('should handle database lookup failure', async () => {
      mockedPrisma.user.findUnique.mockRejectedValue(
        new Error('Database error')
      );

      await expect(authService.login(loginCredentials)).rejects.toThrow(
        'Database error'
      );

      expect(mockedComparePassword).not.toHaveBeenCalled();
    });

    it('should handle password comparison failure', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockedComparePassword.mockRejectedValue(new Error('Comparison failed'));

      await expect(authService.login(loginCredentials)).rejects.toThrow(
        'Comparison failed'
      );

      expect(mockedGenerateTokens).not.toHaveBeenCalled();
    });

    it('should handle empty email', async () => {
      const emptyEmailCredentials = { email: '', password: 'TestPassword123!' };
      mockedPrisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.login(emptyEmailCredentials)).rejects.toThrow(
        'Invalid email or password'
      );
    });

    it('should handle empty password', async () => {
      const emptyPasswordCredentials = {
        email: 'test@example.com',
        password: '',
      };
      mockedPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockedComparePassword.mockResolvedValue(false);

      await expect(authService.login(emptyPasswordCredentials)).rejects.toThrow(
        'Invalid email or password'
      );
    });
  });

  describe('refreshToken', () => {
    const refreshToken = 'valid-refresh-token';
    const decodedToken = {
      userId: mockUser.id,
      email: mockUser.email,
      username: mockUser.username,
    };

    it('should refresh token successfully', async () => {
      mockedVerifyRefreshToken.mockReturnValue(decodedToken);
      mockedPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockedGenerateTokens.mockReturnValue(mockTokens);

      const result = await authService.refreshToken(refreshToken);

      expect(mockedVerifyRefreshToken).toHaveBeenCalledWith(
        refreshToken,
        undefined
      );
      expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: decodedToken.userId },
      });
      expect(mockedGenerateTokens).toHaveBeenCalledWith(mockUser, undefined);
      expect(result).toEqual(mockTokens);
    });

    it('should refresh token with request ID', async () => {
      const requestId = 'test-request-789';
      mockedVerifyRefreshToken.mockReturnValue(decodedToken);
      mockedPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockedGenerateTokens.mockReturnValue(mockTokens);

      const result = await authService.refreshToken(refreshToken, requestId);

      expect(mockedVerifyRefreshToken).toHaveBeenCalledWith(
        refreshToken,
        requestId
      );
      expect(mockedGenerateTokens).toHaveBeenCalledWith(mockUser, requestId);
      expect(result).toEqual(mockTokens);
    });

    it('should throw error when refresh token is invalid', async () => {
      mockedVerifyRefreshToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.refreshToken(refreshToken)).rejects.toThrow(
        'Invalid refresh token'
      );

      expect(mockedPrisma.user.findUnique).not.toHaveBeenCalled();
      expect(mockedGenerateTokens).not.toHaveBeenCalled();
    });

    it('should throw error when refresh token is expired', async () => {
      mockedVerifyRefreshToken.mockImplementation(() => {
        throw new Error('Token expired');
      });

      await expect(authService.refreshToken(refreshToken)).rejects.toThrow(
        'Invalid refresh token'
      );
    });

    it('should throw error when user no longer exists', async () => {
      mockedVerifyRefreshToken.mockReturnValue(decodedToken);
      mockedPrisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.refreshToken(refreshToken)).rejects.toThrow(
        'Invalid refresh token'
      );

      expect(mockedGenerateTokens).not.toHaveBeenCalled();
    });

    it('should handle database lookup failure', async () => {
      mockedVerifyRefreshToken.mockReturnValue(decodedToken);
      mockedPrisma.user.findUnique.mockRejectedValue(
        new Error('Database error')
      );

      await expect(authService.refreshToken(refreshToken)).rejects.toThrow(
        'Invalid refresh token'
      );
    });

    it('should handle empty refresh token', async () => {
      mockedVerifyRefreshToken.mockImplementation(() => {
        throw new Error('Token required');
      });

      await expect(authService.refreshToken('')).rejects.toThrow(
        'Invalid refresh token'
      );
    });

    it('should handle malformed refresh token', async () => {
      mockedVerifyRefreshToken.mockImplementation(() => {
        throw new Error('Malformed token');
      });

      await expect(authService.refreshToken('malformed-token')).rejects.toThrow(
        'Invalid refresh token'
      );
    });
  });

  describe('getUserById', () => {
    it('should return user without password', async () => {
      const userWithoutPassword = {
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        avatar: mockUser.avatar,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      };

      mockedPrisma.user.findUnique.mockResolvedValue(userWithoutPassword);

      const result = await authService.getUserById(mockUser.id);

      expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
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
      expect(result).toEqual(userWithoutPassword);
      expect((result as any)?.password).toBeUndefined();
    });

    it('should return null when user not found', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(null);

      const result = await authService.getUserById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should handle database error', async () => {
      mockedPrisma.user.findUnique.mockRejectedValue(
        new Error('Database error')
      );

      await expect(authService.getUserById(mockUser.id)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('updateProfile', () => {
    const updateData = {
      firstName: 'Updated',
      lastName: 'Name',
      avatar: 'new-avatar-url',
    };

    it('should update user profile successfully', async () => {
      const updatedUser = { ...mockUser, ...updateData };
      delete (updatedUser as any).password;

      mockedPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await authService.updateProfile(mockUser.id, updateData);

      expect(mockedPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
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
      expect(result).toEqual(updatedUser);
      expect((result as any).password).toBeUndefined();
    });

    it('should handle partial updates', async () => {
      const partialUpdate = { firstName: 'NewFirst' };
      const updatedUser = { ...mockUser, firstName: 'NewFirst' };
      delete (updatedUser as any).password;

      mockedPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await authService.updateProfile(
        mockUser.id,
        partialUpdate
      );

      expect(mockedPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: partialUpdate,
        select: expect.any(Object),
      });
      expect(result.firstName).toBe('NewFirst');
    });

    it('should handle database error', async () => {
      mockedPrisma.user.update.mockRejectedValue(new Error('Update failed'));

      await expect(
        authService.updateProfile(mockUser.id, updateData)
      ).rejects.toThrow('Update failed');
    });

    it('should handle user not found', async () => {
      mockedPrisma.user.update.mockRejectedValue(new Error('User not found'));

      await expect(
        authService.updateProfile('non-existent-id', updateData)
      ).rejects.toThrow('User not found');
    });
  });

  describe('changePassword', () => {
    const currentPassword = 'CurrentPassword123!';
    const newPassword = 'NewPassword123!';

    it('should change password successfully', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockedComparePassword.mockResolvedValue(true);
      mockedHashPassword.mockResolvedValue('newHashedPassword');
      mockedPrisma.user.update.mockResolvedValue(mockUser);

      await authService.changePassword(
        mockUser.id,
        currentPassword,
        newPassword
      );

      expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(mockedComparePassword).toHaveBeenCalledWith(
        currentPassword,
        mockUser.password
      );
      expect(mockedHashPassword).toHaveBeenCalledWith(newPassword);
      expect(mockedPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { password: 'newHashedPassword' },
      });
    });

    it('should throw error when user not found', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.changePassword(mockUser.id, currentPassword, newPassword)
      ).rejects.toThrow('User not found');

      expect(mockedComparePassword).not.toHaveBeenCalled();
      expect(mockedHashPassword).not.toHaveBeenCalled();
    });

    it('should throw error when current password is incorrect', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockedComparePassword.mockResolvedValue(false);

      await expect(
        authService.changePassword(mockUser.id, 'wrongPassword', newPassword)
      ).rejects.toThrow('Current password is incorrect');

      expect(mockedHashPassword).not.toHaveBeenCalled();
      expect(mockedPrisma.user.update).not.toHaveBeenCalled();
    });

    it('should handle password hashing failure', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockedComparePassword.mockResolvedValue(true);
      mockedHashPassword.mockRejectedValue(new Error('Hashing failed'));

      await expect(
        authService.changePassword(mockUser.id, currentPassword, newPassword)
      ).rejects.toThrow('Hashing failed');

      expect(mockedPrisma.user.update).not.toHaveBeenCalled();
    });

    it('should handle database update failure', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockedComparePassword.mockResolvedValue(true);
      mockedHashPassword.mockResolvedValue('newHashedPassword');
      mockedPrisma.user.update.mockRejectedValue(new Error('Update failed'));

      await expect(
        authService.changePassword(mockUser.id, currentPassword, newPassword)
      ).rejects.toThrow('Update failed');
    });
  });

  describe('deleteAccount', () => {
    it('should delete user account successfully', async () => {
      mockedPrisma.user.delete.mockResolvedValue(mockUser);

      await authService.deleteAccount(mockUser.id);

      expect(mockedPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
    });

    it('should handle user not found', async () => {
      mockedPrisma.user.delete.mockRejectedValue(new Error('User not found'));

      await expect(
        authService.deleteAccount('non-existent-id')
      ).rejects.toThrow('User not found');
    });

    it('should handle database error', async () => {
      mockedPrisma.user.delete.mockRejectedValue(new Error('Database error'));

      await expect(authService.deleteAccount(mockUser.id)).rejects.toThrow(
        'Database error'
      );
    });
  });
});
