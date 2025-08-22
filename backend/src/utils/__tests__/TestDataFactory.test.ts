import {
  PrismaClient,
  TaskStatus,
  TaskPriority,
  ProjectRole,
} from '@prisma/client';
import { TestDataFactory, createTestDataFactory } from '../TestDataFactory';
import {
  TestDatabaseManager,
  createTestDatabaseManager,
} from '../TestDatabaseManager';

describe('TestDataFactory', () => {
  let prisma: PrismaClient;
  let testDataFactory: TestDataFactory;
  let testDatabaseManager: TestDatabaseManager;

  beforeAll(async () => {
    prisma = new PrismaClient();
    testDataFactory = createTestDataFactory(prisma);
    testDatabaseManager = createTestDatabaseManager(prisma);
    await testDatabaseManager.setupTestDatabase();
  });

  afterAll(async () => {
    await testDatabaseManager.teardownTestDatabase();
  });

  beforeEach(async () => {
    await testDataFactory.cleanup();
  });

  afterEach(async () => {
    await testDataFactory.cleanup();
  });

  describe('User Creation', () => {
    it('should create a user with default values', async () => {
      const user = await testDataFactory.createUser();

      expect(user).toMatchObject({
        id: expect.any(String),
        email: expect.stringMatching(/^testuser_.*@example\.com$/),
        username: expect.stringMatching(/^testuser_.*$/),
        firstName: 'Test',
        lastName: 'User',
        avatar: null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      // Verify user exists in database
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      expect(dbUser).toBeTruthy();
    });

    it('should create a user with custom values', async () => {
      const customData = {
        firstName: 'Custom',
        lastName: 'Name',
        avatar: 'custom-avatar.jpg',
      };

      const user = await testDataFactory.createUser(customData);

      expect(user).toMatchObject({
        firstName: 'Custom',
        lastName: 'Name',
        avatar: 'custom-avatar.jpg',
      });
    });

    it('should create multiple users with unique identifiers', async () => {
      const user1 = await testDataFactory.createUser();
      const user2 = await testDataFactory.createUser();

      expect(user1.id).not.toBe(user2.id);
      expect(user1.email).not.toBe(user2.email);
      expect(user1.username).not.toBe(user2.username);
    });

    it('should hash custom passwords', async () => {
      const customPassword = 'CustomPassword123!';
      const user = await testDataFactory.createUser({
        password: customPassword,
      });

      // Password should be hashed, not plain text
      expect(user.password).not.toBe(customPassword);
      expect(user.password.length).toBeGreaterThan(50); // bcrypt hash length
    });
  });

  describe('Project Creation', () => {
    it('should create a project with user dependency', async () => {
      const user = await testDataFactory.createUser();
      const project = await testDataFactory.createProject(user.id);

      expect(project).toMatchObject({
        id: expect.any(String),
        name: expect.stringMatching(/^Test Project .*$/),
        description: expect.stringMatching(/^Test project description .*$/),
        color: '#0D65F2',
        ownerId: user.id,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      // Verify project exists in database with correct owner
      const dbProject = await prisma.project.findUnique({
        where: { id: project.id },
        include: { owner: true },
      });
      expect(dbProject?.owner.id).toBe(user.id);
    });

    it('should create a project with custom values', async () => {
      const user = await testDataFactory.createUser();
      const customData = {
        name: 'Custom Project',
        description: 'Custom description',
        color: '#FF0000',
      };

      const project = await testDataFactory.createProject(user.id, customData);

      expect(project).toMatchObject(customData);
    });

    it('should create multiple projects with unique identifiers', async () => {
      const user = await testDataFactory.createUser();
      const project1 = await testDataFactory.createProject(user.id);
      const project2 = await testDataFactory.createProject(user.id);

      expect(project1.id).not.toBe(project2.id);
      expect(project1.name).not.toBe(project2.name);
    });
  });

  describe('Task Creation', () => {
    it('should create a task with project dependency', async () => {
      const user = await testDataFactory.createUser();
      const project = await testDataFactory.createProject(user.id);
      const task = await testDataFactory.createTask(project.id);

      expect(task).toMatchObject({
        id: expect.any(String),
        title: expect.stringMatching(/^Test Task .*$/),
        description: expect.stringMatching(/^Test task description .*$/),
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        projectId: project.id,
        assigneeId: null,
        dueDate: null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      // Verify task exists in database with correct project
      const dbTask = await prisma.task.findUnique({
        where: { id: task.id },
        include: { project: true },
      });
      expect(dbTask?.project.id).toBe(project.id);
    });

    it('should create a task with assignee', async () => {
      const user = await testDataFactory.createUser();
      const assignee = await testDataFactory.createUser();
      const project = await testDataFactory.createProject(user.id);
      const task = await testDataFactory.createTask(project.id, {
        assigneeId: assignee.id,
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
      });

      expect(task).toMatchObject({
        assigneeId: assignee.id,
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
      });
    });

    it('should create multiple tasks with unique identifiers', async () => {
      const user = await testDataFactory.createUser();
      const project = await testDataFactory.createProject(user.id);
      const task1 = await testDataFactory.createTask(project.id);
      const task2 = await testDataFactory.createTask(project.id);

      expect(task1.id).not.toBe(task2.id);
      expect(task1.title).not.toBe(task2.title);
    });
  });

  describe('Comment Creation', () => {
    it('should create a comment with task and author dependencies', async () => {
      const user = await testDataFactory.createUser();
      const project = await testDataFactory.createProject(user.id);
      const task = await testDataFactory.createTask(project.id);
      const comment = await testDataFactory.createComment(task.id, user.id);

      expect(comment).toMatchObject({
        id: expect.any(String),
        content: expect.stringMatching(/^Test comment content .*$/),
        taskId: task.id,
        authorId: user.id,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      // Verify comment exists in database with correct relationships
      const dbComment = await prisma.comment.findUnique({
        where: { id: comment.id },
        include: { task: true, author: true },
      });
      expect(dbComment?.task.id).toBe(task.id);
      expect(dbComment?.author.id).toBe(user.id);
    });

    it('should create a comment with custom content', async () => {
      const user = await testDataFactory.createUser();
      const project = await testDataFactory.createProject(user.id);
      const task = await testDataFactory.createTask(project.id);
      const comment = await testDataFactory.createComment(task.id, user.id, {
        content: 'Custom comment content',
      });

      expect(comment.content).toBe('Custom comment content');
    });
  });

  describe('Project Member Creation', () => {
    it('should create a project member with default role', async () => {
      const owner = await testDataFactory.createUser();
      const member = await testDataFactory.createUser();
      const project = await testDataFactory.createProject(owner.id);
      const projectMember = await testDataFactory.createProjectMember(
        member.id,
        project.id
      );

      expect(projectMember).toMatchObject({
        id: expect.any(String),
        userId: member.id,
        projectId: project.id,
        role: ProjectRole.MEMBER,
        joinedAt: expect.any(Date),
      });
    });

    it('should create a project member with custom role', async () => {
      const owner = await testDataFactory.createUser();
      const admin = await testDataFactory.createUser();
      const project = await testDataFactory.createProject(owner.id);
      const projectMember = await testDataFactory.createProjectMember(
        admin.id,
        project.id,
        {
          role: ProjectRole.ADMIN,
        }
      );

      expect(projectMember.role).toBe(ProjectRole.ADMIN);
    });
  });

  describe('Complex Scenarios', () => {
    it('should create a complete scenario with proper dependencies', async () => {
      const scenario = await testDataFactory.createCompleteScenario();

      expect(scenario.user).toBeTruthy();
      expect(scenario.project).toBeTruthy();
      expect(scenario.task).toBeTruthy();

      // Verify relationships
      expect(scenario.project.ownerId).toBe(scenario.user.id);
      expect(scenario.task.projectId).toBe(scenario.project.id);
    });

    it('should create a complete scenario with custom data', async () => {
      const scenario = await testDataFactory.createCompleteScenario({
        user: { firstName: 'Custom', lastName: 'User' },
        project: { name: 'Custom Project' },
        task: { title: 'Custom Task', status: TaskStatus.DONE },
      });

      expect(scenario.user.firstName).toBe('Custom');
      expect(scenario.project.name).toBe('Custom Project');
      expect(scenario.task.title).toBe('Custom Task');
      expect(scenario.task.status).toBe(TaskStatus.DONE);
    });

    it('should create multiple users', async () => {
      const users = await testDataFactory.createMultipleUsers(3);

      expect(users).toHaveLength(3);
      expect(users[0].firstName).toBe('User1');
      expect(users[1].firstName).toBe('User2');
      expect(users[2].firstName).toBe('User3');

      // All should have unique identifiers
      const emails = users.map((u) => u.email);
      expect(new Set(emails).size).toBe(3);
    });

    it('should create a project with multiple members', async () => {
      const owner = await testDataFactory.createUser();
      const members = await testDataFactory.createMultipleUsers(2);
      const memberIds = members.map((m) => m.id);

      const result = await testDataFactory.createProjectWithMembers(
        owner.id,
        memberIds
      );

      expect(result.project.ownerId).toBe(owner.id);
      expect(result.members).toHaveLength(2);
      expect(result.members[0].userId).toBe(members[0].id);
      expect(result.members[1].userId).toBe(members[1].id);
    });

    it('should create multiple tasks for a project', async () => {
      const user = await testDataFactory.createUser();
      const project = await testDataFactory.createProject(user.id);
      const tasks = await testDataFactory.createMultipleTasks(
        project.id,
        4,
        user.id
      );

      expect(tasks).toHaveLength(4);

      // Should have different statuses and priorities
      const statuses = tasks.map((t) => t.status);
      const priorities = tasks.map((t) => t.priority);
      expect(new Set(statuses).size).toBeGreaterThan(1);
      expect(new Set(priorities).size).toBeGreaterThan(1);

      // All should be assigned to the user
      tasks.forEach((task) => {
        expect(task.assigneeId).toBe(user.id);
        expect(task.projectId).toBe(project.id);
      });
    });
  });

  describe('Cleanup and Tracking', () => {
    it('should track created entities', async () => {
      const user = await testDataFactory.createUser();
      const project = await testDataFactory.createProject(user.id);
      const task = await testDataFactory.createTask(project.id);

      const entities = testDataFactory.getCreatedEntities();

      expect(entities.users).toHaveLength(1);
      expect(entities.projects).toHaveLength(1);
      expect(entities.tasks).toHaveLength(1);
      expect(entities.users[0].id).toBe(user.id);
      expect(entities.projects[0].id).toBe(project.id);
      expect(entities.tasks[0].id).toBe(task.id);
    });

    it('should cleanup all created data', async () => {
      // Create test data
      const user = await testDataFactory.createUser();
      const project = await testDataFactory.createProject(user.id);
      const task = await testDataFactory.createTask(project.id);
      const comment = await testDataFactory.createComment(task.id, user.id);

      // Verify data exists
      expect(
        await prisma.user.findUnique({ where: { id: user.id } })
      ).toBeTruthy();
      expect(
        await prisma.project.findUnique({ where: { id: project.id } })
      ).toBeTruthy();
      expect(
        await prisma.task.findUnique({ where: { id: task.id } })
      ).toBeTruthy();
      expect(
        await prisma.comment.findUnique({ where: { id: comment.id } })
      ).toBeTruthy();

      // Cleanup
      await testDataFactory.cleanup();

      // Verify data is deleted
      expect(
        await prisma.user.findUnique({ where: { id: user.id } })
      ).toBeNull();
      expect(
        await prisma.project.findUnique({ where: { id: project.id } })
      ).toBeNull();
      expect(
        await prisma.task.findUnique({ where: { id: task.id } })
      ).toBeNull();
      expect(
        await prisma.comment.findUnique({ where: { id: comment.id } })
      ).toBeNull();

      // Verify tracking arrays are cleared
      const entities = testDataFactory.getCreatedEntities();
      expect(entities.users).toHaveLength(0);
      expect(entities.projects).toHaveLength(0);
      expect(entities.tasks).toHaveLength(0);
      expect(entities.comments).toHaveLength(0);
    });

    it('should reset tracking without database cleanup', async () => {
      const user = await testDataFactory.createUser();

      // Verify tracking
      expect(testDataFactory.getCreatedEntities().users).toHaveLength(1);

      // Reset tracking
      testDataFactory.reset();

      // Verify tracking is cleared but data still exists in database
      expect(testDataFactory.getCreatedEntities().users).toHaveLength(0);
      expect(
        await prisma.user.findUnique({ where: { id: user.id } })
      ).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle foreign key constraint violations gracefully', async () => {
      // Try to create a project with non-existent user ID
      await expect(
        testDataFactory.createProject('non-existent-user-id')
      ).rejects.toThrow();
    });

    it('should handle cleanup errors gracefully', async () => {
      // Create some data
      const user = await testDataFactory.createUser();

      // Manually delete the user to cause a potential cleanup issue
      await prisma.user.delete({ where: { id: user.id } });

      // Cleanup should not throw even if some data is already deleted
      await expect(testDataFactory.cleanup()).resolves.not.toThrow();
    });
  });
});
