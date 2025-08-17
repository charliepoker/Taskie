import {
  PrismaClient,
  User,
  Project,
  Task,
  Comment,
  ProjectMember,
  TaskStatus,
  TaskPriority,
  ProjectRole,
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

/**
 * TestDataFactory provides a consistent way to create test data with proper dependency order
 * and unique identifiers to prevent conflicts between tests.
 */
export class TestDataFactory {
  private prisma: PrismaClient;
  private createdUsers: User[] = [];
  private createdProjects: Project[] = [];
  private createdTasks: Task[] = [];
  private createdComments: Comment[] = [];
  private createdProjectMembers: ProjectMember[] = [];

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Generate unique identifier to prevent conflicts
   */
  private generateUniqueId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create a test user with unique identifiers
   */
  async createUser(
    overrides: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>> = {}
  ): Promise<User> {
    const uniqueId = this.generateUniqueId();

    const defaultUserData = {
      email: `testuser_${uniqueId}@example.com`,
      username: `testuser_${uniqueId}`,
      firstName: 'Test',
      lastName: 'User',
      password: await bcrypt.hash('TestPassword123!', 10),
      avatar: null,
    };

    const userData = { ...defaultUserData, ...overrides };

    // Hash password if it was overridden
    if (overrides.password) {
      userData.password = await bcrypt.hash(overrides.password, 10);
    }

    const user = await this.prisma.user.create({
      data: userData,
    });

    this.createdUsers.push(user);
    return user;
  }

  /**
   * Create a test project with proper user dependency
   */
  async createProject(
    userId: string,
    overrides: Partial<
      Omit<Project, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>
    > = {}
  ): Promise<Project> {
    const uniqueId = this.generateUniqueId();

    const defaultProjectData = {
      name: `Test Project ${uniqueId}`,
      description: `Test project description ${uniqueId}`,
      color: '#0D65F2',
    };

    const projectData = { ...defaultProjectData, ...overrides };

    const project = await this.prisma.project.create({
      data: {
        ...projectData,
        ownerId: userId,
      },
    });

    this.createdProjects.push(project);
    return project;
  }

  /**
   * Create a test task with proper project dependency
   */
  async createTask(
    projectId: string,
    overrides: Partial<
      Omit<Task, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>
    > = {}
  ): Promise<Task> {
    const uniqueId = this.generateUniqueId();

    const defaultTaskData = {
      title: `Test Task ${uniqueId}`,
      description: `Test task description ${uniqueId}`,
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      assigneeId: null,
      dueDate: null,
    };

    const taskData = { ...defaultTaskData, ...overrides };

    const task = await this.prisma.task.create({
      data: {
        ...taskData,
        projectId,
      },
    });

    this.createdTasks.push(task);
    return task;
  }

  /**
   * Create a test comment with proper task and user dependencies
   */
  async createComment(
    taskId: string,
    authorId: string,
    overrides: Partial<
      Omit<Comment, 'id' | 'taskId' | 'authorId' | 'createdAt' | 'updatedAt'>
    > = {}
  ): Promise<Comment> {
    const uniqueId = this.generateUniqueId();

    const defaultCommentData = {
      content: `Test comment content ${uniqueId}`,
    };

    const commentData = { ...defaultCommentData, ...overrides };

    const comment = await this.prisma.comment.create({
      data: {
        ...commentData,
        taskId,
        authorId,
      },
    });

    this.createdComments.push(comment);
    return comment;
  }

  /**
   * Create a project member relationship
   */
  async createProjectMember(
    userId: string,
    projectId: string,
    overrides: Partial<
      Omit<ProjectMember, 'id' | 'userId' | 'projectId' | 'joinedAt'>
    > = {}
  ): Promise<ProjectMember> {
    const defaultMemberData = {
      role: ProjectRole.MEMBER,
    };

    const memberData = { ...defaultMemberData, ...overrides };

    const projectMember = await this.prisma.projectMember.create({
      data: {
        ...memberData,
        userId,
        projectId,
      },
    });

    this.createdProjectMembers.push(projectMember);
    return projectMember;
  }

  /**
   * Create a complete test scenario with user, project, and task
   */
  async createCompleteScenario(
    overrides: {
      user?: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>;
      project?: Partial<
        Omit<Project, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>
      >;
      task?: Partial<
        Omit<Task, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>
      >;
    } = {}
  ): Promise<{ user: User; project: Project; task: Task }> {
    // Create user first (no dependencies)
    const user = await this.createUser(overrides.user);

    // Create project with user dependency
    const project = await this.createProject(user.id, overrides.project);

    // Create task with project dependency
    const task = await this.createTask(project.id, overrides.task);

    return { user, project, task };
  }

  /**
   * Create multiple users for testing scenarios requiring multiple users
   */
  async createMultipleUsers(count: number): Promise<User[]> {
    const users: User[] = [];
    for (let i = 0; i < count; i++) {
      const user = await this.createUser({
        firstName: `User${i + 1}`,
        lastName: `Test`,
      });
      users.push(user);
    }
    return users;
  }

  /**
   * Create a project with multiple members
   */
  async createProjectWithMembers(
    ownerId: string,
    memberIds: string[],
    projectOverrides: Partial<
      Omit<Project, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>
    > = {}
  ): Promise<{ project: Project; members: ProjectMember[] }> {
    const project = await this.createProject(ownerId, projectOverrides);

    const members: ProjectMember[] = [];
    for (const memberId of memberIds) {
      const member = await this.createProjectMember(memberId, project.id);
      members.push(member);
    }

    return { project, members };
  }

  /**
   * Create multiple tasks for a project
   */
  async createMultipleTasks(
    projectId: string,
    count: number,
    assigneeId?: string
  ): Promise<Task[]> {
    const tasks: Task[] = [];
    const statuses = [
      TaskStatus.TODO,
      TaskStatus.IN_PROGRESS,
      TaskStatus.IN_REVIEW,
      TaskStatus.DONE,
    ];
    const priorities = [
      TaskPriority.LOW,
      TaskPriority.MEDIUM,
      TaskPriority.HIGH,
      TaskPriority.URGENT,
    ];

    for (let i = 0; i < count; i++) {
      const task = await this.createTask(projectId, {
        title: `Task ${i + 1}`,
        status: statuses[i % statuses.length],
        priority: priorities[i % priorities.length],
        assigneeId,
      });
      tasks.push(task);
    }
    return tasks;
  }

  /**
   * Get all created entities for verification purposes
   */
  getCreatedEntities() {
    return {
      users: [...this.createdUsers],
      projects: [...this.createdProjects],
      tasks: [...this.createdTasks],
      comments: [...this.createdComments],
      projectMembers: [...this.createdProjectMembers],
    };
  }

  /**
   * Clean up all created test data in proper order (respecting foreign key constraints)
   */
  async cleanup(): Promise<void> {
    try {
      // Delete in reverse dependency order to avoid foreign key constraint violations

      // 1. Delete comments (depend on tasks and users)
      if (this.createdComments.length > 0) {
        const commentIds = this.createdComments.map((c) => c.id);
        await this.prisma.comment.deleteMany({
          where: { id: { in: commentIds } },
        });
      }

      // 2. Delete tasks (depend on projects and users)
      if (this.createdTasks.length > 0) {
        const taskIds = this.createdTasks.map((t) => t.id);
        await this.prisma.task.deleteMany({
          where: { id: { in: taskIds } },
        });
      }

      // 3. Delete project members (depend on projects and users)
      if (this.createdProjectMembers.length > 0) {
        const memberIds = this.createdProjectMembers.map((pm) => pm.id);
        await this.prisma.projectMember.deleteMany({
          where: { id: { in: memberIds } },
        });
      }

      // 4. Delete projects (depend on users)
      if (this.createdProjects.length > 0) {
        const projectIds = this.createdProjects.map((p) => p.id);
        await this.prisma.project.deleteMany({
          where: { id: { in: projectIds } },
        });
      }

      // 5. Delete users (no dependencies)
      if (this.createdUsers.length > 0) {
        const userIds = this.createdUsers.map((u) => u.id);
        await this.prisma.user.deleteMany({
          where: { id: { in: userIds } },
        });
      }

      // Clear tracking arrays
      this.createdUsers = [];
      this.createdProjects = [];
      this.createdTasks = [];
      this.createdComments = [];
      this.createdProjectMembers = [];
    } catch (error) {
      console.error('Error during TestDataFactory cleanup:', error);
      throw error;
    }
  }

  /**
   * Reset the factory state without database cleanup (useful for testing the factory itself)
   */
  reset(): void {
    this.createdUsers = [];
    this.createdProjects = [];
    this.createdTasks = [];
    this.createdComments = [];
    this.createdProjectMembers = [];
  }
}

/**
 * Create a new TestDataFactory instance
 */
export function createTestDataFactory(prisma: PrismaClient): TestDataFactory {
  return new TestDataFactory(prisma);
}
