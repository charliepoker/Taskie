import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import {
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  extractTokenFromHeader,
  JwtPayload,
} from '../jwt';

// Mock environment variables
const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = {
    ...originalEnv,
    JWT_SECRET: 'test-secret',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
    JWT_EXPIRES_IN: '15m',
    JWT_REFRESH_EXPIRES_IN: '7d',
  };
});

afterEach(() => {
  process.env = originalEnv;
});

describe('JWT Utils', () => {
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    password: 'hashedpassword',
    avatar: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', () => {
      const tokens = generateTokens(mockUser);

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
    });

    it('should generate tokens with correct payload', () => {
      const tokens = generateTokens(mockUser);

      const accessPayload = jwt.decode(tokens.accessToken) as JwtPayload;
      const refreshPayload = jwt.decode(tokens.refreshToken) as JwtPayload;

      expect(accessPayload.userId).toBe(mockUser.id);
      expect(accessPayload.email).toBe(mockUser.email);
      expect(accessPayload.username).toBe(mockUser.username);

      expect(refreshPayload.userId).toBe(mockUser.id);
      expect(refreshPayload.email).toBe(mockUser.email);
      expect(refreshPayload.username).toBe(mockUser.username);
    });

    it('should generate tokens with correct issuer and audience', () => {
      const tokens = generateTokens(mockUser);

      const accessPayload = jwt.decode(tokens.accessToken, {
        complete: true,
      }) as any;
      const refreshPayload = jwt.decode(tokens.refreshToken, {
        complete: true,
      }) as any;

      expect(accessPayload.payload.iss).toBe('taskie-api');
      expect(accessPayload.payload.aud).toBe('taskie-app');
      expect(refreshPayload.payload.iss).toBe('taskie-api');
      expect(refreshPayload.payload.aud).toBe('taskie-app');
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid access token', () => {
      const tokens = generateTokens(mockUser);
      const payload = verifyAccessToken(tokens.accessToken);

      expect(payload.userId).toBe(mockUser.id);
      expect(payload.email).toBe(mockUser.email);
      expect(payload.username).toBe(mockUser.username);
    });

    it('should throw error for expired token', () => {
      const expiredToken = jwt.sign(
        {
          userId: mockUser.id,
          email: mockUser.email,
          username: mockUser.username,
        },
        'test-secret',
        { expiresIn: '-1s', issuer: 'taskie-api', audience: 'taskie-app' }
      );

      expect(() => verifyAccessToken(expiredToken)).toThrow(
        'Access token has expired'
      );
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyAccessToken('invalid-token')).toThrow(
        'Invalid access token'
      );
    });

    it('should throw error for token with wrong secret', () => {
      const wrongSecretToken = jwt.sign(
        {
          userId: mockUser.id,
          email: mockUser.email,
          username: mockUser.username,
        },
        'wrong-secret',
        { expiresIn: '15m', issuer: 'taskie-api', audience: 'taskie-app' }
      );

      expect(() => verifyAccessToken(wrongSecretToken)).toThrow(
        'Invalid access token'
      );
    });

    it('should throw error for token with wrong issuer', () => {
      const wrongIssuerToken = jwt.sign(
        {
          userId: mockUser.id,
          email: mockUser.email,
          username: mockUser.username,
        },
        'test-secret',
        { expiresIn: '15m', issuer: 'wrong-issuer', audience: 'taskie-app' }
      );

      expect(() => verifyAccessToken(wrongIssuerToken)).toThrow(
        'Invalid access token'
      );
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token', () => {
      const tokens = generateTokens(mockUser);
      const payload = verifyRefreshToken(tokens.refreshToken);

      expect(payload.userId).toBe(mockUser.id);
      expect(payload.email).toBe(mockUser.email);
      expect(payload.username).toBe(mockUser.username);
    });

    it('should throw error for expired refresh token', () => {
      const expiredToken = jwt.sign(
        {
          userId: mockUser.id,
          email: mockUser.email,
          username: mockUser.username,
        },
        'test-refresh-secret',
        { expiresIn: '-1s', issuer: 'taskie-api', audience: 'taskie-app' }
      );

      expect(() => verifyRefreshToken(expiredToken)).toThrow(
        'Refresh token has expired'
      );
    });

    it('should throw error for invalid refresh token', () => {
      expect(() => verifyRefreshToken('invalid-token')).toThrow(
        'Invalid refresh token'
      );
    });

    it('should throw error for refresh token with wrong secret', () => {
      const wrongSecretToken = jwt.sign(
        {
          userId: mockUser.id,
          email: mockUser.email,
          username: mockUser.username,
        },
        'wrong-secret',
        { expiresIn: '7d', issuer: 'taskie-api', audience: 'taskie-app' }
      );

      expect(() => verifyRefreshToken(wrongSecretToken)).toThrow(
        'Invalid refresh token'
      );
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      const token = 'valid-jwt-token';
      const header = `Bearer ${token}`;

      const extracted = extractTokenFromHeader(header);
      expect(extracted).toBe(token);
    });

    it('should return null for undefined header', () => {
      const extracted = extractTokenFromHeader(undefined);
      expect(extracted).toBeNull();
    });

    it('should return null for empty header', () => {
      const extracted = extractTokenFromHeader('');
      expect(extracted).toBeNull();
    });

    it('should return null for header without Bearer prefix', () => {
      const extracted = extractTokenFromHeader('valid-jwt-token');
      expect(extracted).toBeNull();
    });

    it('should return null for header with wrong prefix', () => {
      const extracted = extractTokenFromHeader('Basic valid-jwt-token');
      expect(extracted).toBeNull();
    });

    it('should return null for malformed Bearer header', () => {
      const extracted = extractTokenFromHeader('Bearer');
      expect(extracted).toBeNull();
    });

    it('should return null for Bearer header with multiple spaces', () => {
      const extracted = extractTokenFromHeader('Bearer  token  extra');
      expect(extracted).toBeNull();
    });
  });
});
