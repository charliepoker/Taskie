import request from 'supertest';
import {
  PrismaClient,
  TaskStatus,
  TaskPriority,
  ProjectRole,
} from '@prisma/client';
import app from '../app';
import { generateTokens } from '../utils/jwt';
import { hashPassword } from '../utils/password';

const prisma = new PrismaClient();

describe('Task Controller', () => {
  let testUser1: any;
  let testUser2: any;
  let testUser3: any;
  let testProject: any;
  let testTask: any;
  let authToken1: string;
  let authToken2: string;
  let authToken3: string;

  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.comment.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.projectMember.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'tasktest1@example.com',
            'tasktest2@example.com',
            'tasktest3@example.com',
          ],
        },
      },
    });

    // Create test users
    const hashedPassword = await hashPassword('password123');

    testUser1 = await prisma.user.create({
      data: {
        email: 'tasktest1@example.com',
        username: 'tasktest1',
        firstName: 'Task',
        lastName: 'User1',
        password: hashedPassword,
      },
    });

    testUser2 = await prisma.user.create({
      data: {
        email: 'tasktest2@example.com',
        username: 'tasktest2',
        firstName: 'Task',
        lastName: 'User2',
        password: hashedPassword,
      },
    });

    testUser3 = await prisma.user.create({
      data: {
        email: 'tasktest3@example.com',
        username: 'tasktest3',
        firstName: 'Task',
        lastName: 'User3',
        password: hashedPassword,
      },
    });

    // Generate auth tokens
    const tokens1 = await generateTokens(testUser1);
    const tokens2 = await generateTokens(testUser2);
    const tokens3 = await generateTokens(testUser3);
    authToken1 = tokens1.accessToken;
    authToken2 = tokens2.accessToken;
    authToken3 = tokens3.accessToken;

    // Create test project with testUser1 as owner
    testProject = await prisma.project.create({
      data: {
        name: 'Test Task Project',
        description: 'Project for testing tasks',
        color: '#0D65F2',
        ownerId: testUser1.id,
      },
    });

    // Add testUser2 as a member
    await prisma.projectMember.create({
      data: {
        userId: testUser2.id,
        projectId: testProject.id,
        role: ProjectRole.MEMBER,
      },
    });

    // Create a test task
    testTask = await prisma.task.create({
      data: {
        title: 'Test Task',
        description: 'This is a test task',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        projectId: testProject.id,
        assigneeId: testUser2.id,
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.comment.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.projectMember.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'tasktest1@example.com',
            'tasktest2@example.com',
            'tasktest3@example.com',
          ],
        },
      },
    });
    await prisma.$disconnect();
  });

  describe('GET /api/tasks', () => {
    it('should get tasks with pagination and filtering', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken1}`)
        .query({
          page: 1,
          limit: 10,
          projectId: testProject.id,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.meta).toHaveProperty('page');
      expect(response.body.meta).toHaveProperty('total');
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter tasks by status', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken1}`)
        .query({
          status: TaskStatus.TODO,
          projectId: testProject.id,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      response.body.data.forEach((task: any) => {
        expect(task.status).toBe(TaskStatus.TODO);
      });
    });

    it('should filter tasks by assignee', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken1}`)
        .query({
          assigneeId: testUser2.id,
          projectId: testProject.id,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      response.body.data.forEach((task: any) => {
        expect(task.assigneeId).toBe(testUser2.id);
      });
    });

    it('should search tasks by title and description', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken1}`)
        .query({
          search: 'Test Task',
          projectId: testProject.id,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should not return tasks from projects user has no access to', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken3}`) // User3 has no access to testProject
        .query({
          projectId: testProject.id,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(0);
    });

    it('should require authentication', async () => {
      const response = await request(app).get('/api/tasks');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('MISSING_TOKEN');
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a new task successfully', async () => {
      const taskData = {
        title: 'New Test Task',
        description: 'This is a new test task',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        projectId: testProject.id,
        assigneeId: testUser2.id,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken1}`)
        .send(taskData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Task created successfully');
      expect(response.body.data.task.title).toBe(taskData.title);
      expect(response.body.data.task.description).toBe(taskData.description);
      expect(response.body.data.task.status).toBe(taskData.status);
      expect(response.body.data.task.priority).toBe(taskData.priority);
      expect(response.body.data.task.assigneeId).toBe(taskData.assigneeId);
    });

    it('should create task without optional fields', async () => {
      const taskData = {
        title: 'Minimal Task',
        projectId: testProject.id,
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken1}`)
        .send(taskData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.task.title).toBe(taskData.title);
      expect(response.body.data.task.status).toBe(TaskStatus.TODO);
      expect(response.body.data.task.priority).toBe(TaskPriority.MEDIUM);
      expect(response.body.data.task.assigneeId).toBeNull();
    });

    it('should fail when project does not exist', async () => {
      const taskData = {
        title: 'Task for Non-existent Project',
        projectId: '00000000-0000-0000-0000-000000000000',
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken1}`)
        .send(taskData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('PROJECT_NOT_FOUND');
    });

    it('should fail when user has no access to project', async () => {
      const taskData = {
        title: 'Unauthorized Task',
        projectId: testProject.id,
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken3}`) // User3 has no access
        .send(taskData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('PROJECT_NOT_FOUND');
    });

    it('should fail when assignee has no access to project', async () => {
      const taskData = {
        title: 'Task with Invalid Assignee',
        projectId: testProject.id,
        assigneeId: testUser3.id, // User3 has no access to project
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken1}`)
        .send(taskData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_ASSIGNEE');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail when due date is in the past', async () => {
      const taskData = {
        title: 'Task with Past Due Date',
        projectId: testProject.id,
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken1}`)
        .send(taskData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('should get task by ID with comments', async () => {
      const response = await request(app)
        .get(`/api/tasks/${testTask.id}`)
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.task.id).toBe(testTask.id);
      expect(response.body.data.task.title).toBe(testTask.title);
      expect(response.body.data.task).toHaveProperty('comments');
      expect(response.body.data.task).toHaveProperty('assignee');
      expect(response.body.data.task).toHaveProperty('project');
    });

    it('should fail when task does not exist', async () => {
      const response = await request(app)
        .get('/api/tasks/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('TASK_NOT_FOUND');
    });

    it('should fail when user has no access to task', async () => {
      const response = await request(app)
        .get(`/api/tasks/${testTask.id}`)
        .set('Authorization', `Bearer ${authToken3}`); // User3 has no access

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('TASK_NOT_FOUND');
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should update task successfully', async () => {
      const updateData = {
        title: 'Updated Task Title',
        description: 'Updated description',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
      };

      const response = await request(app)
        .put(`/api/tasks/${testTask.id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Task updated successfully');
      expect(response.body.data.task.title).toBe(updateData.title);
      expect(response.body.data.task.description).toBe(updateData.description);
      expect(response.body.data.task.status).toBe(updateData.status);
      expect(response.body.data.task.priority).toBe(updateData.priority);
    });

    it('should update task assignee', async () => {
      const updateData = {
        assigneeId: testUser1.id,
      };

      const response = await request(app)
        .put(`/api/tasks/${testTask.id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.task.assigneeId).toBe(updateData.assigneeId);
    });

    it('should allow updating task with past due date', async () => {
      const updateData = {
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      };

      const response = await request(app)
        .put(`/api/tasks/${testTask.id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(new Date(response.body.data.task.dueDate)).toEqual(
        new Date(updateData.dueDate)
      );
    });

    it('should fail when task does not exist', async () => {
      const response = await request(app)
        .put('/api/tasks/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('TASK_NOT_FOUND');
    });

    it('should fail when user has no access to task', async () => {
      const response = await request(app)
        .put(`/api/tasks/${testTask.id}`)
        .set('Authorization', `Bearer ${authToken3}`)
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('TASK_NOT_FOUND');
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    let taskToDelete: any;

    beforeEach(async () => {
      // Create a task to delete for each test
      taskToDelete = await prisma.task.create({
        data: {
          title: 'Task to Delete',
          description: 'This task will be deleted',
          status: TaskStatus.TODO,
          priority: TaskPriority.LOW,
          projectId: testProject.id,
          assigneeId: testUser2.id,
        },
      });
    });

    it('should delete task successfully as project owner', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${taskToDelete.id}`)
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Task deleted successfully');

      // Verify task is deleted
      const deletedTask = await prisma.task.findUnique({
        where: { id: taskToDelete.id },
      });
      expect(deletedTask).toBeNull();
    });

    it('should delete task successfully as assignee', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${taskToDelete.id}`)
        .set('Authorization', `Bearer ${authToken2}`); // testUser2 is assignee

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Task deleted successfully');
    });

    it('should fail when task does not exist', async () => {
      const response = await request(app)
        .delete('/api/tasks/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('TASK_NOT_FOUND');
    });

    it('should fail when user has no access to task', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${taskToDelete.id}`)
        .set('Authorization', `Bearer ${authToken3}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('TASK_NOT_FOUND');
    });
  });

  describe('POST /api/tasks/:id/comments', () => {
    it('should add comment to task successfully', async () => {
      const commentData = {
        content: 'This is a test comment',
      };

      const response = await request(app)
        .post(`/api/tasks/${testTask.id}/comments`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send(commentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Comment added successfully');
      expect(response.body.data.comment.content).toBe(commentData.content);
      expect(response.body.data.comment.authorId).toBe(testUser1.id);
      expect(response.body.data.comment.taskId).toBe(testTask.id);
    });

    it('should fail when task does not exist', async () => {
      const response = await request(app)
        .post('/api/tasks/00000000-0000-0000-0000-000000000000/comments')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ content: 'Comment on non-existent task' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('TASK_NOT_FOUND');
    });

    it('should fail when user has no access to task', async () => {
      const response = await request(app)
        .post(`/api/tasks/${testTask.id}/comments`)
        .set('Authorization', `Bearer ${authToken3}`)
        .send({ content: 'Unauthorized comment' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('TASK_NOT_FOUND');
    });

    it('should validate comment content', async () => {
      const response = await request(app)
        .post(`/api/tasks/${testTask.id}/comments`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ content: '' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/tasks/:id/comments', () => {
    let testComment: any;

    beforeAll(async () => {
      // Create a test comment
      testComment = await prisma.comment.create({
        data: {
          content: 'Test comment for retrieval',
          taskId: testTask.id,
          authorId: testUser1.id,
        },
      });
    });

    it('should get task comments with pagination', async () => {
      const response = await request(app)
        .get(`/api/tasks/${testTask.id}/comments`)
        .set('Authorization', `Bearer ${authToken1}`)
        .query({
          page: 1,
          limit: 20,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.meta).toHaveProperty('page');
      expect(response.body.meta).toHaveProperty('total');
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should fail when task does not exist', async () => {
      const response = await request(app)
        .get('/api/tasks/00000000-0000-0000-0000-000000000000/comments')
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('TASK_NOT_FOUND');
    });

    it('should fail when user has no access to task', async () => {
      const response = await request(app)
        .get(`/api/tasks/${testTask.id}/comments`)
        .set('Authorization', `Bearer ${authToken3}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('TASK_NOT_FOUND');
    });
  });
});
