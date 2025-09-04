import { AuthDebugger } from '../authDebugger';

// Mock dependencies
jest.mock('../password', () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
}));

jest.mock('../jwt', () => ({
  generateTokens: jest.fn(),
  verifyAccessToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
}));

jest.mock('../database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('../authLogger', () => ({
  AuthLogger: {
    logPasswordOperation: jest.fn(),
    logTokenOperation: jest.fn(),
    logDatabaseOperation: jest.fn(),
    generateRequestId: jest.fn(() => 'test-request-id'),
  },
}));

import { hashPassword, comparePassword } from '../password';
import { generateTokens, verifyAccessToken, verifyRefreshToken } from '../jwt';
import { prisma } from '../database';

const mockedHashPassword = hashPassword as jest.MockedFunction<
  typeof hashPassword
>;
const mockedComparePassword = comparePassword as jest.MockedFunction<
  typeof comparePassword
>;
const mockedGenerateTokens = generateTokens as jest.MockedFunction<
  typeof generateTokens
>;
const mockedVerifyAccessToken = verifyAccessToken as jest.MockedFunction<
  typeof verifyAccessToken
>;
const mockedVerifyRefreshToken = verifyRefreshToken as jest.MockedFunction<
  typeof verifyRefreshToken
>;
const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

describe('AuthDebugger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('testPasswordHashing', () => {
    it('should test password hashing successfully', async () => {
      const testPassword = 'TestPassword123!';
      const hashedPassword = '$2a$12$hashedPasswordExample';

      mockedHashPassword.mockResolvedValue(hashedPassword);

      const result = await AuthDebugger.testPasswordHashing(testPassword);

      expect(result.success).toBe(true);
      expect(result.duration).toBeGreaterThan(0);
      expect(result.details).toBeDefined();
      expect(mockedHashPassword).toHaveBeenCalledWith(testPassword, undefined);
    });

    it('should handle password hashing errors', async () => {
      const testPassword = 'TestPassword123!';

      mockedHashPassword.mockRejectedValue(new Error('Hashing failed'));

      const result = await AuthDebugger.testPasswordHashing(testPassword);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Hashing failed');
      expect(result.duration).toBeGreaterThan(0);
    });
  });

  describe('testPasswordComparison', () => {
    it('should test password comparison successfully', async () => {
      const plainPassword = 'TestPassword123!';
      const hashedPassword = '$2a$12$hashedPasswordExample';

      mockedComparePassword.mockResolvedValue(true);

      const result = await AuthDebugger.testPasswordComparison(
        plainPassword,
        hashedPassword
      );

      expect(result.success).toBe(true);
      expect(result.duration).toBeGreaterThan(0);
      expect(result.details).toBeDefined();
      expect(result.details?.passwordsMatch).toBe(true);
      expect(mockedComparePassword).toHaveBeenCalledWith(
        plainPassword,
        hashedPassword,
        undefined
      );
    });

    it('should handle password comparison errors', async () => {
      const plainPassword = 'TestPassword123!';
      const hashedPassword = '$2a$12$hashedPasswordExample';

      mockedComparePassword.mockRejectedValue(new Error('Comparison failed'));

      const result = await AuthDebugger.testPasswordComparison(
        plainPassword,
        hashedPassword
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Comparison failed');
      expect(result.duration).toBeGreaterThan(0);
    });
  });

  describe('testUserLookup', () => {
    it('should test user lookup successfully when user exists', async () => {
      const testEmail = 'test@example.com';
      const mockUser = {
        id: 'user-123',
        email: testEmail,
        username: 'testuser',
        createdAt: new Date(),
      };

      mockedPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await AuthDebugger.testUserLookup(testEmail);

      expect(result.success).toBe(true);
      expect(result.duration).toBeGreaterThan(0);
      expect(result.result).toEqual(mockUser);
      expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: testEmail },
        select: {
          id: true,
          email: true,
          username: true,
          createdAt: true,
        },
      });
    });

    it('should test user lookup successfully when user does not exist', async () => {
      const testEmail = 'nonexistent@example.com';

      mockedPrisma.user.findUnique.mockResolvedValue(null);

      const result = await AuthDebugger.testUserLookup(testEmail);

      expect(result.success).toBe(true);
      expect(result.duration).toBeGreaterThan(0);
      expect(result.result).toBeNull();
    });

    it('should handle user lookup errors', async () => {
      const testEmail = 'test@example.com';

      mockedPrisma.user.findUnique.mockRejectedValue(
        new Error('Database error')
      );

      const result = await AuthDebugger.testUserLookup(testEmail);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
      expect(result.duration).toBeGreaterThan(0);
    });
  });

  describe('testJWTFlow', () => {
    it('should test JWT flow successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      };

      const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      };

      const mockPayload = {
        userId: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
      };

      mockedGenerateTokens.mockReturnValue(mockTokens);
      mockedVerifyAccessToken.mockReturnValue(mockPayload);
      mockedVerifyRefreshToken.mockReturnValue(mockPayload);

      const result = await AuthDebugger.testJWTFlow(mockUser);

      expect(result.overallSuccess).toBe(true);
      expect(result.generateTest.success).toBe(true);
      expect(result.verifyAccessTest.success).toBe(true);
      expect(result.verifyRefreshTest.success).toBe(true);
    });

    it('should handle JWT generation errors', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      };

      mockedGenerateTokens.mockImplementation(() => {
        throw new Error('Token generation failed');
      });

      const result = await AuthDebugger.testJWTFlow(mockUser);

      expect(result.overallSuccess).toBe(false);
      expect(result.generateTest.success).toBe(false);
      expect(result.generateTest.error).toBe('Token generation failed');
    });
  });
});
