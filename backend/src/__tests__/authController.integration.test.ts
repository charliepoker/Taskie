import request from 'supertest';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import app from '../app';
import {
  setupTestDatabase,
  cleanupDatabase,
  teardownTestDatabase,
} from '../utils/test-helpers';
import { hashPassword } from '../utils/password';

describe('Auth Controller Integration Tests', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    await setupTestDatabase();
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await cleanupDatabase();
  });

  describe('POST /api/auth/register', () => {
    const validRegistrationData = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
    };

    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistrationData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            email: validRegistrationData.email,
            username: validRegistrationData.username,
            firstName: validRegistrationData.firstName,
            lastName: validRegistrationData.lastName,
          },
          tokens: {
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
          },
        },
      });

      // Verify user was created in database
      const user = await prisma.user.findUnique({
        where: { email: validRegistrationData.email },
      });
      expect(user).toBeTruthy();
      expect(user?.email).toBe(validRegistrationData.email);
    });

    it('should return 409 when email already exists', async () => {
      // Create user first
      await prisma.user.create({
        data: {
          ...validRegistrationData,
          password: await hashPassword(validRegistrationData.password),
        },
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistrationData)
        .expect(409);

      expect(response.body).toMatchObject({
        success: false,
        code: 'USER_EXISTS',
      });
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validRegistrationData,
          email: 'invalid-email',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validRegistrationData,
          password: 'weak',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: validRegistrationData.email,
          // Missing other required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    const userData = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
    };

    beforeEach(async () => {
      // Create test user
      await prisma.user.create({
        data: {
          ...userData,
          password: await hashPassword(userData.password),
        },
      });
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            email: userData.email,
            username: userData.username,
            firstName: userData.firstName,
            lastName: userData.lastName,
          },
          tokens: {
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
          },
        },
      });
    });

    it('should return 401 for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@example.com',
          password: userData.password,
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });
    });

    it('should return 401 for invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });
    });

    it('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          // Missing password
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Create user and get tokens
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);

      refreshToken = registerResponse.body.data.tokens.refreshToken;
    });

    it('should refresh token successfully', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          tokens: {
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
          },
        },
      });
    });

    it('should return 401 for invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        code: 'TOKEN_REFRESH_FAILED',
      });
    });

    it('should return 400 for missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    let accessToken: string;
    let userId: string;

    beforeEach(async () => {
      // Create user and get tokens
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);

      accessToken = registerResponse.body.data.tokens.accessToken;
      userId = registerResponse.body.data.user.id;
    });

    it('should get current user successfully', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          user: {
            id: userId,
            email: 'test@example.com',
            username: 'testuser',
            firstName: 'Test',
            lastName: 'User',
          },
        },
      });
    });

    it('should return 401 without authorization header', async () => {
      const response = await request(app).get('/api/auth/me').expect(401);

      expect(response.body).toMatchObject({
        success: false,
        code: 'NOT_AUTHENTICATED',
      });
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/auth/profile', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Create user and get tokens
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);

      accessToken = registerResponse.body.data.tokens.accessToken;
    });

    it('should update profile successfully', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        avatar: 'new-avatar.jpg',
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: {
            firstName: updateData.firstName,
            lastName: updateData.lastName,
            avatar: updateData.avatar,
          },
        },
      });
    });

    it('should return 401 without authorization', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .send({ firstName: 'Updated' })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        code: 'NOT_AUTHENTICATED',
      });
    });
  });

  describe('POST /api/auth/change-password', () => {
    let accessToken: string;
    const originalPassword = 'TestPassword123!';

    beforeEach(async () => {
      // Create user and get tokens
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: originalPassword,
        firstName: 'Test',
        lastName: 'User',
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);

      accessToken = registerResponse.body.data.tokens.accessToken;
    });

    it('should change password successfully', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: originalPassword,
          newPassword: 'NewPassword123!',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Password changed successfully',
      });

      // Verify can login with new password
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'NewPassword123!',
        })
        .expect(200);
    });

    it('should return 400 for incorrect current password', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'NewPassword123!',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Current password is incorrect',
        code: 'INCORRECT_PASSWORD',
      });
    });

    it('should return 401 without authorization', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .send({
          currentPassword: originalPassword,
          newPassword: 'NewPassword123!',
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        code: 'NOT_AUTHENTICATED',
      });
    });
  });

  describe('POST /api/auth/logout', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Create user and get tokens
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);

      accessToken = registerResponse.body.data.tokens.accessToken;
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Logout successful',
      });
    });
  });

  describe('DELETE /api/auth/account', () => {
    let accessToken: string;
    let userId: string;

    beforeEach(async () => {
      // Create user and get tokens
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);

      accessToken = registerResponse.body.data.tokens.accessToken;
      userId = registerResponse.body.data.user.id;
    });

    it('should delete account successfully', async () => {
      const response = await request(app)
        .delete('/api/auth/account')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Account deleted successfully',
      });

      // Verify user was deleted from database
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      expect(user).toBeNull();
    });

    it('should return 401 without authorization', async () => {
      const response = await request(app)
        .delete('/api/auth/account')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        code: 'NOT_AUTHENTICATED',
      });
    });
  });
});
