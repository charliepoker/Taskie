import {
  prisma,
  connectDatabase,
  disconnectDatabase,
  healthCheck,
} from '../utils/database';
import { redisService, sessionManager } from '../utils/redis';

describe('Database and Redis Setup', () => {
  beforeAll(async () => {
    await connectDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('Database Connection', () => {
    it('should connect to PostgreSQL successfully', async () => {
      const health = await healthCheck();
      expect(health.database).toBe(true);
    });

    it('should be able to query the database', async () => {
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      expect(result).toBeDefined();
    });

    it('should have the correct database schema', async () => {
      // Test that all tables exist by querying them
      const users = await prisma.user.findMany({ take: 1 });
      const projects = await prisma.project.findMany({ take: 1 });
      const tasks = await prisma.task.findMany({ take: 1 });
      const comments = await prisma.comment.findMany({ take: 1 });

      expect(Array.isArray(users)).toBe(true);
      expect(Array.isArray(projects)).toBe(true);
      expect(Array.isArray(tasks)).toBe(true);
      expect(Array.isArray(comments)).toBe(true);
    });
  });

  describe('Redis Connection', () => {
    it('should connect to Redis successfully', async () => {
      const health = await healthCheck();
      expect(health.redis).toBe(true);
    });

    it('should be able to set and get values', async () => {
      const testKey = 'test:key';
      const testValue = 'test value';

      await redisService.set(testKey, testValue, 60);
      const retrievedValue = await redisService.get(testKey);

      expect(retrievedValue).toBe(testValue);

      // Clean up
      await redisService.del(testKey);
    });

    it('should be able to work with JSON data', async () => {
      const testKey = 'test:json';
      const testData = { id: 1, name: 'Test User', active: true };

      await redisService.setJSON(testKey, testData, 60);
      const retrievedData = await redisService.getJSON(testKey);

      expect(retrievedData).toEqual(testData);

      // Clean up
      await redisService.del(testKey);
    });

    it('should handle key expiration', async () => {
      const testKey = 'test:expiration';
      const testValue = 'expires soon';

      await redisService.set(testKey, testValue, 1); // 1 second expiration

      // Should exist immediately
      const exists = await redisService.exists(testKey);
      expect(exists).toBe(true);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const existsAfterExpiration = await redisService.exists(testKey);
      expect(existsAfterExpiration).toBe(false);
    });
  });

  describe('Session Management', () => {
    it('should create and retrieve sessions', async () => {
      const sessionId = 'test-session-123';
      const userId = 'user-123';
      const sessionData = { role: 'user', permissions: ['read'] };

      await sessionManager.createSession(sessionId, userId, sessionData, 300);
      const retrievedSession = await sessionManager.getSession(sessionId);

      expect(retrievedSession).toMatchObject({
        userId,
        ...sessionData,
      });

      // Clean up
      await sessionManager.deleteSession(sessionId);
    });

    it('should manage user sessions', async () => {
      const userId = 'user-456';
      const sessionId1 = 'session-1';
      const sessionId2 = 'session-2';

      await sessionManager.createSession(sessionId1, userId, {}, 300);
      await sessionManager.createSession(sessionId2, userId, {}, 300);

      const userSessions = await sessionManager.getUserSessions(userId);
      expect(userSessions).toContain(sessionId1);
      expect(userSessions).toContain(sessionId2);

      // Clean up all user sessions
      await sessionManager.deleteUserSessions(userId);

      const userSessionsAfterDelete =
        await sessionManager.getUserSessions(userId);
      expect(userSessionsAfterDelete).toHaveLength(0);
    });
  });

  describe('Data Models', () => {
    it('should create and retrieve a user', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        password: 'hashedpassword123',
      };

      const user = await prisma.user.create({ data: userData });
      expect(user.id).toBeDefined();
      expect(user.email).toBe(userData.email);

      // Clean up
      await prisma.user.delete({ where: { id: user.id } });
    });

    it('should create a project with relationships', async () => {
      // First create a user
      const user = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          username: 'owner',
          firstName: 'Project',
          lastName: 'Owner',
          password: 'hashedpassword123',
        },
      });

      const projectData = {
        name: 'Test Project',
        description: 'A test project',
        color: '#0D65F2',
        ownerId: user.id,
      };

      const project = await prisma.project.create({ data: projectData });
      expect(project.id).toBeDefined();
      expect(project.name).toBe(projectData.name);

      // Clean up
      await prisma.project.delete({ where: { id: project.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });
  });
});
