import { PrismaClient } from '@prisma/client';
import {
  TestDatabaseManager,
  createTestDatabaseManager,
} from '../TestDatabaseManager';
import { TestDataFactory, createTestDataFactory } from '../TestDataFactory';

describe('TestDatabaseManager', () => {
  let prisma: PrismaClient;
  let testDatabaseManager: TestDatabaseManager;
  let testDataFactory: TestDataFactory;

  beforeAll(async () => {
    prisma = new PrismaClient();
    testDatabaseManager = createTestDatabaseManager(prisma);
    testDataFactory = createTestDataFactory(prisma);
  });

  afterAll(async () => {
    await testDatabaseManager.teardownTestDatabase();
  });

  describe('Database Connection Management', () => {
    it('should setup test database successfully', async () => {
      await expect(
        testDatabaseManager.setupTestDatabase()
      ).resolves.not.toThrow();

      // Verify connection is working
      const isConnected = await testDatabaseManager.isConnected();
      expect(isConnected).toBe(true);
    });

    it('should check database connection status', async () => {
      const isConnected = await testDatabaseManager.isConnected();
      expect(typeof isConnected).toBe('boolean');
    });
  });

  describe('Data Cleanup Operations', () => {
    beforeEach(async () => {
      await testDatabaseManager.cleanupTestData();
    });

    it('should cleanup test data successfully', async () => {
      // Create some test data
      const user = await testDataFactory.createUser();
      const project = await testDataFactory.createProject(user.id);
      const task = await testDataFactory.createTask(project.id);

      // Verify data exists
      const statsBefore = await testDatabaseManager.getDatabaseStats();
      expect(statsBefore.users).toBeGreaterThan(0);
      expect(statsBefore.projects).toBeGreaterThan(0);
      expect(statsBefore.tasks).toBeGreaterThan(0);

      // Cleanup
      await testDatabaseManager.cleanupTestData();

      // Verify data is cleaned up
      const statsAfter = await testDatabaseManager.getDatabaseStats();
      expect(statsAfter.users).toBe(0);
      expect(statsAfter.projects).toBe(0);
      expect(statsAfter.tasks).toBe(0);
      expect(statsAfter.comments).toBe(0);
      expect(statsAfter.projectMembers).toBe(0);
    });

    it('should truncate all tables successfully', async () => {
      // Create some test data
      const user = await testDataFactory.createUser();
      const project = await testDataFactory.createProject(user.id);
      await testDataFactory.createTask(project.id);

      // Verify data exists
      const statsBefore = await testDatabaseManager.getDatabaseStats();
      expect(statsBefore.users).toBeGreaterThan(0);

      // Truncate
      await testDatabaseManager.truncateAllTables();

      // Verify data is truncated
      const statsAfter = await testDatabaseManager.getDatabaseStats();
      expect(statsAfter.users).toBe(0);
      expect(statsAfter.projects).toBe(0);
      expect(statsAfter.tasks).toBe(0);
    });

    it('should reset sequences without errors', async () => {
      // This should not throw even if there are no sequences to reset
      await expect(testDatabaseManager.resetSequences()).resolves.not.toThrow();
    });
  });

  describe('Database Statistics', () => {
    beforeEach(async () => {
      await testDatabaseManager.cleanupTestData();
    });

    it('should return accurate database statistics', async () => {
      // Initially should be empty
      const initialStats = await testDatabaseManager.getDatabaseStats();
      expect(initialStats).toEqual({
        users: 0,
        projects: 0,
        tasks: 0,
        comments: 0,
        projectMembers: 0,
      });

      // Create some data
      const user1 = await testDataFactory.createUser();
      const user2 = await testDataFactory.createUser();
      const project = await testDataFactory.createProject(user1.id);
      const task = await testDataFactory.createTask(project.id);
      await testDataFactory.createComment(task.id, user1.id);
      await testDataFactory.createProjectMember(user2.id, project.id);

      // Check updated stats
      const updatedStats = await testDatabaseManager.getDatabaseStats();
      expect(updatedStats).toEqual({
        users: 2,
        projects: 1,
        tasks: 1,
        comments: 1,
        projectMembers: 1,
      });
    });

    it('should handle database errors gracefully when getting stats', async () => {
      // Disconnect to simulate error
      await prisma.$disconnect();

      const stats = await testDatabaseManager.getDatabaseStats();

      // Should return zeros instead of throwing
      expect(stats).toEqual({
        users: 0,
        projects: 0,
        tasks: 0,
        comments: 0,
        projectMembers: 0,
      });

      // Reconnect for other tests
      await prisma.$connect();
    });
  });

  describe('Error Handling', () => {
    it('should handle cleanup errors gracefully', async () => {
      // This should not throw even if there are issues
      await expect(
        testDatabaseManager.cleanupTestData()
      ).resolves.not.toThrow();
    });

    it('should handle teardown errors gracefully', async () => {
      // This should not throw even if there are connection issues
      await expect(
        testDatabaseManager.teardownTestDatabase()
      ).resolves.not.toThrow();
    });

    it('should handle truncate fallback', async () => {
      // Create some data first
      const user = await testDataFactory.createUser();

      // Truncate should work or fall back to deleteMany
      await expect(
        testDatabaseManager.truncateAllTables()
      ).resolves.not.toThrow();

      // Verify data is cleaned up
      const stats = await testDatabaseManager.getDatabaseStats();
      expect(stats.users).toBe(0);
    });
  });

  describe('Integration with TestDataFactory', () => {
    it('should work seamlessly with TestDataFactory cleanup', async () => {
      // Create data using factory
      const user = await testDataFactory.createUser();
      const project = await testDataFactory.createProject(user.id);

      // Use database manager to cleanup
      await testDatabaseManager.cleanupTestData();

      // Verify factory tracking is not affected (factory should handle its own tracking)
      const entities = testDataFactory.getCreatedEntities();
      expect(entities.users).toHaveLength(1); // Factory still tracks, but DB is clean

      // Verify database is actually clean
      const stats = await testDatabaseManager.getDatabaseStats();
      expect(stats.users).toBe(0);
      expect(stats.projects).toBe(0);

      // Factory cleanup should handle the tracking
      await testDataFactory.cleanup();
      const entitiesAfter = testDataFactory.getCreatedEntities();
      expect(entitiesAfter.users).toHaveLength(0);
    });
  });
});
