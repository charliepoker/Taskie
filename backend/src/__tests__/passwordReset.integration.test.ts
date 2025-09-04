import request from 'supertest';
import app from '../app';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../services/authService';
import { hashPassword } from '../utils/password';

const prisma = new PrismaClient();
const authService = new AuthService();

describe('Password Reset Integration Tests', () => {
  let testUser: any;
  let resetToken: string;

  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.passwordResetToken.deleteMany({
      where: {
        user: {
          email: {
            contains: 'passwordreset',
          },
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'passwordreset',
        },
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.passwordResetToken.deleteMany({
      where: {
        user: {
          email: {
            contains: 'passwordreset',
          },
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'passwordreset',
        },
      },
    });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Create a test user for password reset tests
    const hashedPassword = await hashPassword('OriginalPassword123!');
    testUser = await prisma.user.create({
      data: {
        email: 'passwordreset@example.com',
        username: 'passwordresetuser',
        firstName: 'Password',
        lastName: 'Reset',
        password: hashedPassword,
      },
    });
  });

  afterEach(async () => {
    // Clean up after each test
    await prisma.passwordResetToken.deleteMany({
      where: { userId: testUser?.id },
    });
    if (testUser) {
      await prisma.user.delete({
        where: { id: testUser.id },
      });
      testUser = null;
    }
  });

  describe('Password Reset Request Flow', () => {
    it('should request password reset successfully', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: testUser.email,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('password reset');

      // Verify reset token was created in database
      const resetTokenRecord = await prisma.passwordResetToken.findFirst({
        where: { userId: testUser.id },
      });

      expect(resetTokenRecord).toBeTruthy();
      expect(resetTokenRecord?.used).toBe(false);
      expect(resetTokenRecord?.expiresAt).toBeInstanceOf(Date);
      expect(resetTokenRecord?.expiresAt.getTime()).toBeGreaterThan(Date.now());

      resetToken = resetTokenRecord!.token;
    });

    it('should handle password reset request for non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'nonexistent@example.com',
        })
        .expect(200);

      // Should return success to prevent email enumeration
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('password reset');

      // Verify no reset token was created
      const resetTokenRecord = await prisma.passwordResetToken.findFirst({
        where: {
          user: {
            email: 'nonexistent@example.com',
          },
        },
      });

      expect(resetTokenRecord).toBeNull();
    });

    it('should handle invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'invalid-email',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('email');
    });

    it('should handle missing email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('email');
    });

    it('should replace existing unused reset tokens', async () => {
      // Create first reset token
      await authService.requestPasswordReset(testUser.email);

      const firstToken = await prisma.passwordResetToken.findFirst({
        where: { userId: testUser.id },
      });

      expect(firstToken).toBeTruthy();

      // Create second reset token
      await authService.requestPasswordReset(testUser.email);

      const allTokens = await prisma.passwordResetToken.findMany({
        where: { userId: testUser.id },
      });

      // Should only have one token (the new one)
      expect(allTokens).toHaveLength(1);
      expect(allTokens[0].token).not.toBe(firstToken!.token);
    });
  });

  describe('Password Reset Confirmation Flow', () => {
    beforeEach(async () => {
      // Create a reset token for each test
      await authService.requestPasswordReset(testUser.email);
      const resetTokenRecord = await prisma.passwordResetToken.findFirst({
        where: { userId: testUser.id },
      });
      resetToken = resetTokenRecord!.token;
    });

    it('should reset password successfully with valid token', async () => {
      const newPassword = 'NewPassword123!';

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: newPassword,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('password has been reset');

      // Verify token is marked as used
      const resetTokenRecord = await prisma.passwordResetToken.findUnique({
        where: { token: resetToken },
      });

      expect(resetTokenRecord?.used).toBe(true);

      // Verify user can login with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          newPassword: newPassword,
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.user.email).toBe(testUser.email);

      // Verify user cannot login with old password
      await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'OriginalPassword123!',
        })
        .expect(401);
    });

    it('should reject invalid reset token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-token',
          newPassword: 'NewPassword123!',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid or expired');
    });

    it('should reject already used reset token', async () => {
      const newPassword = 'NewPassword123!';

      // Use the token once
      await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: newPassword,
        })
        .expect(200);

      // Try to use the same token again
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'AnotherPassword123!',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid or expired');
    });

    it('should reject expired reset token', async () => {
      // Manually expire the token
      await prisma.passwordResetToken.update({
        where: { token: resetToken },
        data: { expiresAt: new Date(Date.now() - 1000) }, // 1 second ago
      });

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'NewPassword123!',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid or expired');
    });

    it('should validate new password strength', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'weak',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('password');
    });

    it('should handle missing token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          newPassword: 'NewPassword123!',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('token');
    });

    it('should handle missing password', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('password');
    });
  });

  describe('Password Reset Token Validation', () => {
    beforeEach(async () => {
      await authService.requestPasswordReset(testUser.email);
      const resetTokenRecord = await prisma.passwordResetToken.findFirst({
        where: { userId: testUser.id },
      });
      resetToken = resetTokenRecord!.token;
    });

    it('should validate valid reset token', async () => {
      const isValid = await authService.validateResetToken(resetToken);
      expect(isValid).toBe(true);
    });

    it('should invalidate non-existent token', async () => {
      const isValid =
        await authService.validateResetToken('non-existent-token');
      expect(isValid).toBe(false);
    });

    it('should invalidate used token', async () => {
      // Use the token
      await authService.resetPassword(resetToken, 'NewPassword123!');

      // Validate should return false
      const isValid = await authService.validateResetToken(resetToken);
      expect(isValid).toBe(false);
    });

    it('should invalidate expired token', async () => {
      // Manually expire the token
      await prisma.passwordResetToken.update({
        where: { token: resetToken },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });

      const isValid = await authService.validateResetToken(resetToken);
      expect(isValid).toBe(false);
    });
  });

  describe('Password Reset Rate Limiting', () => {
    it('should handle multiple reset requests for same email', async () => {
      // Make multiple requests in quick succession
      const requests = Array(5)
        .fill(null)
        .map(() =>
          request(app)
            .post('/api/auth/forgot-password')
            .send({ email: testUser.email })
        );

      const responses = await Promise.all(requests);

      // All should succeed (rate limiting would be handled by middleware)
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      // Should only have one active token
      const tokens = await prisma.passwordResetToken.findMany({
        where: { userId: testUser.id },
      });

      expect(tokens).toHaveLength(1);
    });
  });

  describe('Password Reset Security Measures', () => {
    beforeEach(async () => {
      await authService.requestPasswordReset(testUser.email);
      const resetTokenRecord = await prisma.passwordResetToken.findFirst({
        where: { userId: testUser.id },
      });
      resetToken = resetTokenRecord!.token;
    });

    it('should generate cryptographically secure tokens', async () => {
      // Request multiple tokens and verify they are different
      const tokens = new Set();

      for (let i = 0; i < 10; i++) {
        await authService.requestPasswordReset(testUser.email);
        const tokenRecord = await prisma.passwordResetToken.findFirst({
          where: { userId: testUser.id },
        });
        tokens.add(tokenRecord!.token);
      }

      // All tokens should be unique
      expect(tokens.size).toBe(10);

      // Tokens should be of expected length (64 hex characters)
      const lastToken = Array.from(tokens)[9] as string;
      expect(lastToken).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should set appropriate token expiration', async () => {
      const tokenRecord = await prisma.passwordResetToken.findUnique({
        where: { token: resetToken },
      });

      const now = new Date();
      const expiresAt = tokenRecord!.expiresAt;
      const timeDiff = expiresAt.getTime() - now.getTime();

      // Should expire in approximately 1 hour (allowing for test execution time)
      expect(timeDiff).toBeGreaterThan(55 * 60 * 1000); // At least 55 minutes
      expect(timeDiff).toBeLessThan(65 * 60 * 1000); // At most 65 minutes
    });

    it('should not reveal user existence in error messages', async () => {
      // Request reset for non-existent email
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'nonexistent@example.com',
        });

      // Should return same success message as for existing email
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('password reset');
    });

    it('should clean up old tokens when creating new ones', async () => {
      // Create multiple tokens
      await authService.requestPasswordReset(testUser.email);
      await authService.requestPasswordReset(testUser.email);
      await authService.requestPasswordReset(testUser.email);

      // Should only have one token
      const tokens = await prisma.passwordResetToken.findMany({
        where: { userId: testUser.id },
      });

      expect(tokens).toHaveLength(1);
      expect(tokens[0].used).toBe(false);
    });
  });

  describe('Complete Password Reset Flow End-to-End', () => {
    it('should complete full password reset flow successfully', async () => {
      const originalPassword = 'OriginalPassword123!';
      const newPassword = 'NewSecurePassword123!';

      // Step 1: Verify user can login with original password
      const originalLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: originalPassword,
        })
        .expect(200);

      expect(originalLoginResponse.body.success).toBe(true);

      // Step 2: Request password reset
      const resetRequestResponse = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: testUser.email,
        })
        .expect(200);

      expect(resetRequestResponse.body.success).toBe(true);

      // Step 3: Get the reset token from database
      const resetTokenRecord = await prisma.passwordResetToken.findFirst({
        where: { userId: testUser.id },
      });

      expect(resetTokenRecord).toBeTruthy();
      const token = resetTokenRecord!.token;

      // Step 4: Validate the token
      const isValid = await authService.validateResetToken(token);
      expect(isValid).toBe(true);

      // Step 5: Reset the password
      const resetResponse = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: token,
          newPassword: newPassword,
        })
        .expect(200);

      expect(resetResponse.body.success).toBe(true);

      // Step 6: Verify old password no longer works
      await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: originalPassword,
        })
        .expect(401);

      // Step 7: Verify new password works
      const newLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          newPassword: newPassword,
        })
        .expect(200);

      expect(newLoginResponse.body.success).toBe(true);
      expect(newLoginResponse.body.data.user.email).toBe(testUser.email);

      // Step 8: Verify token is now invalid
      const isValidAfterUse = await authService.validateResetToken(token);
      expect(isValidAfterUse).toBe(false);

      // Step 9: Verify token cannot be reused
      await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: token,
          newPassword: 'AnotherPassword123!',
        })
        .expect(400);
    });
  });
});
