import request from 'supertest';
import app from '../app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('User Management Endpoints', () => {
  let accessToken: string;
  let userId: string;
  let secondUserId: string;

  beforeAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'usertest',
        },
      },
    });

    // Create test users
    const firstUserResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'usertest1@example.com',
        username: 'usertest1',
        firstName: 'User',
        lastName: 'One',
        password: 'TestPassword123',
      });

    accessToken = firstUserResponse.body.data.tokens.accessToken;
    userId = firstUserResponse.body.data.user.id;

    const secondUserResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'usertest2@example.com',
        username: 'usertest2',
        firstName: 'User',
        lastName: 'Two',
        password: 'TestPassword123',
      });

    secondUserId = secondUserResponse.body.data.user.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'usertest',
        },
      },
    });
    await prisma.$disconnect();
  });

  describe('GET /api/users', () => {
    it('should get paginated list of users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.meta).toHaveProperty('total');
      expect(response.body.meta).toHaveProperty('page');
      expect(response.body.meta).toHaveProperty('limit');
      expect(response.body.meta).toHaveProperty('totalPages');
    });

    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/users?page=1&limit=5')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(5);
    });

    it('should handle search parameter', async () => {
      const response = await request(app)
        .get('/api/users?search=usertest1')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should handle sorting parameters', async () => {
      const response = await request(app)
        .get('/api/users?sortBy=firstName&sortOrder=asc')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should fail without authentication', async () => {
      const response = await request(app).get('/api/users').expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get user by ID', async () => {
      const response = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(userId);
      expect(response.body.data.user.email).toBe('usertest1@example.com');
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('USER_NOT_FOUND');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/api/users/${userId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update own profile successfully', async () => {
      const updateData = {
        firstName: 'UpdatedUser',
        lastName: 'UpdatedOne',
      };

      const response = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.firstName).toBe('UpdatedUser');
      expect(response.body.data.user.lastName).toBe('UpdatedOne');
    });

    it('should fail when trying to update another user', async () => {
      const updateData = {
        firstName: 'Hacker',
        lastName: 'Attempt',
      };

      const response = await request(app)
        .put(`/api/users/${secondUserId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should fail without authentication', async () => {
      const updateData = {
        firstName: 'Test',
        lastName: 'User',
      };

      const response = await request(app)
        .put(`/api/users/${userId}`)
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should validate update data', async () => {
      const invalidData = {
        firstName: '', // Empty string should fail validation
      };

      const response = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should fail when trying to delete another user', async () => {
      const response = await request(app)
        .delete(`/api/users/${secondUserId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .delete(`/api/users/${userId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    // Note: We don't test successful deletion as it would break other tests
    // In a real scenario, this would be tested with a separate test user
  });
});
