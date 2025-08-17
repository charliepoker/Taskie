import { PrismaClient } from '@prisma/client';

/**
 * TestDatabaseManager handles database lifecycle management for tests
 */
export class TestDatabaseManager {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Set up test database connection
   */
  async setupTestDatabase(): Promise<void> {
    try {
      await this.prisma.$connect();
      await this.cleanupTestData();
    } catch (error) {
      console.error('Error setting up test database:', error);
      throw error;
    }
  }

  /**
   * Clean up all test data in proper order to respect foreign key constraints
   */
  async cleanupTestData(): Promise<void> {
    try {
      // Delete in order to respect foreign key constraints
      await this.prisma.comment.deleteMany();
      await this.prisma.task.deleteMany();
      await this.prisma.projectMember.deleteMany();
      await this.prisma.project.deleteMany();
      await this.prisma.user.deleteMany();
    } catch (error) {
      console.error('Error during database cleanup:', error);
      // Don't throw here as this might be called during teardown
    }
  }

  /**
   * Truncate all tables and reset sequences
   */
  async truncateAllTables(): Promise<void> {
    try {
      // Use raw SQL for more efficient truncation
      await this.prisma
        .$executeRaw`TRUNCATE TABLE "comments" RESTART IDENTITY CASCADE`;
      await this.prisma
        .$executeRaw`TRUNCATE TABLE "tasks" RESTART IDENTITY CASCADE`;
      await this.prisma
        .$executeRaw`TRUNCATE TABLE "project_members" RESTART IDENTITY CASCADE`;
      await this.prisma
        .$executeRaw`TRUNCATE TABLE "projects" RESTART IDENTITY CASCADE`;
      await this.prisma
        .$executeRaw`TRUNCATE TABLE "users" RESTART IDENTITY CASCADE`;
    } catch (error) {
      console.error('Error truncating tables:', error);
      // Fall back to deleteMany if truncate fails
      await this.cleanupTestData();
    }
  }

  /**
   * Reset database sequences (useful after manual data insertion)
   */
  async resetSequences(): Promise<void> {
    try {
      // Reset any sequences if they exist (PostgreSQL specific)
      // Note: Since we're using UUIDs, this might not be necessary, but keeping for completeness
      const tables = [
        'users',
        'projects',
        'tasks',
        'comments',
        'project_members',
      ];

      for (const table of tables) {
        try {
          await this.prisma
            .$executeRaw`SELECT setval(pg_get_serial_sequence('${table}', 'id'), 1, false)`;
        } catch (error) {
          // Ignore errors for tables without sequences
        }
      }
    } catch (error) {
      console.error('Error resetting sequences:', error);
      // This is not critical, so don't throw
    }
  }

  /**
   * Tear down test database connection
   */
  async teardownTestDatabase(): Promise<void> {
    try {
      await this.cleanupTestData();
      await this.prisma.$disconnect();
    } catch (error) {
      console.error('Error tearing down test database:', error);
      // Still try to disconnect even if cleanup fails
      try {
        await this.prisma.$disconnect();
      } catch (disconnectError) {
        console.error('Error disconnecting from database:', disconnectError);
      }
    }
  }

  /**
   * Check if database is connected and ready
   */
  async isConnected(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get database statistics for debugging
   */
  async getDatabaseStats(): Promise<{
    users: number;
    projects: number;
    tasks: number;
    comments: number;
    projectMembers: number;
  }> {
    try {
      const [users, projects, tasks, comments, projectMembers] =
        await Promise.all([
          this.prisma.user.count(),
          this.prisma.project.count(),
          this.prisma.task.count(),
          this.prisma.comment.count(),
          this.prisma.projectMember.count(),
        ]);

      return {
        users,
        projects,
        tasks,
        comments,
        projectMembers,
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      return {
        users: 0,
        projects: 0,
        tasks: 0,
        comments: 0,
        projectMembers: 0,
      };
    }
  }
}

/**
 * Create a new TestDatabaseManager instance
 */
export function createTestDatabaseManager(
  prisma: PrismaClient
): TestDatabaseManager {
  return new TestDatabaseManager(prisma);
}
