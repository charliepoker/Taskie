import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../app';
import { redisService } from '../utils/redis';
import { disconnectDatabase, disconnectRedis } from '../utils/database';

const prisma = new PrismaClient();

describe('Analytics Controller', () => {
  let authToken: string;
  let userId: string;
  let projectId: string;
  let taskId: string;

  beforeAll(async () => {
    // Clean up database
    await prisma.comment.deleteMany();
    await prisma.task.deleteMany();
    await prisma.projectMember.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();

    // Create test user
    const userResponse = await request(app).post('/api/auth/register').send({
      email: 'analytics@test.com',
      username: 'analyticsuser',
      firstName: 'Analytics',
      lastName: 'User',
      password: 'Password123',
    });

    // Check if registration was successful
    if (!userResponse.body.success) {
      console.error('Registration failed:', userResponse.body);
      throw new Error(`Registration failed: ${userResponse.body.error}`);
    }

    userId = userResponse.body.data.user.id;

    // Login to get token
    const loginResponse = await request(app).post('/api/auth/login').send({
      email: 'analytics@test.com',
      password: 'Password123',
    });

    authToken = loginResponse.body.data.tokens.accessToken;

    // Create test project
    const projectResponse = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Analytics Test Project',
        description: 'Project for analytics testing',
        color: '#0D65F2',
      });

    projectId = projectResponse.body.data.project.id;

    // Create test tasks with different statuses
    const taskResponse = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test Task 1',
        description: 'First test task',
        status: 'TODO',
        priority: 'HIGH',
        projectId: projectId,
        assigneeId: userId,
      });

    taskId = taskResponse.body.data.task.id;

    // Create additional tasks for better analytics data
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test Task 2',
        description: 'Second test task',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        projectId: projectId,
        assigneeId: userId,
      });

    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test Task 3',
        description: 'Third test task',
        status: 'DONE',
        priority: 'LOW',
        projectId: projectId,
        assigneeId: userId,
      });

    // Add a comment to create activity
    await request(app)
      .post(`/api/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        content: 'Test comment for analytics',
      });
  });

  afterAll(async () => {
    try {
      // Clean up database
      await prisma.comment.deleteMany();
      await prisma.task.deleteMany();
      await prisma.projectMember.deleteMany();
      await prisma.project.deleteMany();
      await prisma.user.deleteMany();

      // Clear Redis cache
      await redisService.flushAll();

      // Close connections properly
      await disconnectDatabase();
      await disconnectRedis();
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  });

  beforeEach(async () => {
    // Clear analytics cache before each test
    await redisService.deletePattern('dashboard:*');
    await redisService.deletePattern('tasks-by-status:*');
    await redisService.deletePattern('user-productivity:*');
  });

  describe('GET /api/analytics/dashboard', () => {
    it('should return dashboard metrics for authenticated user', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalProjects');
      expect(response.body.data).toHaveProperty('totalTasks');
      expect(response.body.data).toHaveProperty('completedTasks');
      expect(response.body.data).toHaveProperty('overdueTasks');
      expect(response.body.data).toHaveProperty('activeUsers');
      expect(response.body.data).toHaveProperty('tasksByStatus');
      expect(response.body.data).toHaveProperty('tasksByPriority');
      expect(response.body.data).toHaveProperty('recentActivity');

      // Verify data structure
      expect(response.body.data.totalProjects).toBe(1);
      expect(response.body.data.totalTasks).toBe(3);
      expect(response.body.data.completedTasks).toBe(1);
      expect(Array.isArray(response.body.data.tasksByStatus)).toBe(true);
      expect(Array.isArray(response.body.data.tasksByPriority)).toBe(true);
      expect(Array.isArray(response.body.data.recentActivity)).toBe(true);

      // Verify meta information
      expect(response.body.meta).toHaveProperty('generatedAt');
      expect(response.body.meta.dateRange).toBeNull();
    });

    it('should return dashboard metrics with date range filter', async () => {
      const startDate = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000
      ).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app)
        .get('/api/analytics/dashboard')
        .query({ startDate, endDate })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.meta.dateRange).toEqual({
        startDate,
        endDate,
      });
    });

    it('should return 400 for invalid date range', async () => {
      const startDate = new Date().toISOString();
      const endDate = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000
      ).toISOString();

      const response = await request(app)
        .get('/api/analytics/dashboard')
        .query({ startDate, endDate })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_DATE_RANGE');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('MISSING_TOKEN');
    });

    it('should use cached data on subsequent requests', async () => {
      // First request
      const response1 = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const generatedAt1 = response1.body.meta.generatedAt;

      // Second request (should be cached)
      const response2 = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const generatedAt2 = response2.body.meta.generatedAt;

      // Data should be identical (from cache)
      expect(response1.body.data).toEqual(response2.body.data);
    });
  });

  describe('GET /api/analytics/tasks-by-status', () => {
    it('should return tasks distribution by status', async () => {
      const response = await request(app)
        .get('/api/analytics/tasks-by-status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalTasks');
      expect(response.body.data).toHaveProperty('distribution');
      expect(response.body.data).toHaveProperty('trends');

      // Verify data structure
      expect(response.body.data.totalTasks).toBe(3);
      expect(Array.isArray(response.body.data.distribution)).toBe(true);
      expect(Array.isArray(response.body.data.trends)).toBe(true);

      // Verify distribution structure
      if (response.body.data.distribution.length > 0) {
        const firstDistribution = response.body.data.distribution[0];
        expect(firstDistribution).toHaveProperty('status');
        expect(firstDistribution).toHaveProperty('count');
        expect(firstDistribution).toHaveProperty('percentage');
      }
    });

    it('should return tasks by status with date range filter', async () => {
      const startDate = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000
      ).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app)
        .get('/api/analytics/tasks-by-status')
        .query({ startDate, endDate })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.meta.dateRange).toEqual({
        startDate,
        endDate,
      });
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/analytics/tasks-by-status')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('MISSING_TOKEN');
    });
  });

  describe('GET /api/analytics/user-productivity', () => {
    it('should return user productivity metrics', async () => {
      const response = await request(app)
        .get('/api/analytics/user-productivity')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('users');
      expect(response.body.data).toHaveProperty('summary');

      // Verify data structure
      expect(Array.isArray(response.body.data.users)).toBe(true);
      expect(response.body.data.summary).toHaveProperty('totalUsers');
      expect(response.body.data.summary).toHaveProperty(
        'averageCompletionRate'
      );
      expect(response.body.data.summary).toHaveProperty('mostProductiveUser');
      expect(response.body.data.summary).toHaveProperty('leastProductiveUser');

      // Verify user metrics structure
      if (response.body.data.users.length > 0) {
        const firstUser = response.body.data.users[0];
        expect(firstUser).toHaveProperty('userId');
        expect(firstUser).toHaveProperty('userName');
        expect(firstUser).toHaveProperty('email');
        expect(firstUser).toHaveProperty('tasksCreated');
        expect(firstUser).toHaveProperty('tasksCompleted');
        expect(firstUser).toHaveProperty('tasksInProgress');
        expect(firstUser).toHaveProperty('averageCompletionTime');
        expect(firstUser).toHaveProperty('completionRate');
        expect(firstUser).toHaveProperty('projectsInvolved');
        expect(firstUser).toHaveProperty('commentsCount');
      }
    });

    it('should return user productivity with date range filter', async () => {
      const startDate = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000
      ).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app)
        .get('/api/analytics/user-productivity')
        .query({ startDate, endDate })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.meta.dateRange).toEqual({
        startDate,
        endDate,
      });
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/analytics/user-productivity')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('MISSING_TOKEN');
    });
  });

  describe('DELETE /api/analytics/cache', () => {
    it('should clear analytics cache for authenticated user', async () => {
      // First, populate cache by making a request
      await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Clear cache
      const response = await request(app)
        .delete('/api/analytics/cache')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        'Analytics cache cleared successfully'
      );
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .delete('/api/analytics/cache')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('MISSING_TOKEN');
    });
  });

  describe('Analytics Data Accuracy', () => {
    it('should calculate task status distribution correctly', async () => {
      const response = await request(app)
        .get('/api/analytics/tasks-by-status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const distribution = response.body.data.distribution;
      const totalTasks = response.body.data.totalTasks;

      // Verify total count matches
      const sumOfCounts = distribution.reduce(
        (sum: number, item: any) => sum + item.count,
        0
      );
      expect(sumOfCounts).toBe(totalTasks);

      // Verify percentages add up to 100 (with some tolerance for rounding)
      const sumOfPercentages = distribution.reduce(
        (sum: number, item: any) => sum + item.percentage,
        0
      );
      expect(sumOfPercentages).toBeCloseTo(100, 1);
    });

    it('should calculate user productivity metrics correctly', async () => {
      const response = await request(app)
        .get('/api/analytics/user-productivity')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const users = response.body.data.users;
      const summary = response.body.data.summary;

      expect(summary.totalUsers).toBe(users.length);

      if (users.length > 0) {
        const user = users.find((u: any) => u.userId === userId);
        expect(user).toBeDefined();
        expect(user.tasksCreated).toBe(3);
        expect(user.tasksCompleted).toBe(1);
        expect(user.tasksInProgress).toBe(1);
        expect(user.completionRate).toBeCloseTo(33.33, 1);
        expect(user.projectsInvolved).toBe(1);
        expect(user.commentsCount).toBe(1);
      }
    });
  });
});
