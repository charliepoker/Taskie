import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../app.test';
import { hashPassword } from '../utils/password';

describe('End-to-End Integration Tests', () => {
  let prisma: PrismaClient;
  let testUser: any;
  let testProject: any;
  let testTask: any;
  let accessToken: string;

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await prisma.comment.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.projectMember.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        password: await hashPassword('TestPassword123!'),
      },
    });

    // Get access token
    const loginResponse = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'TestPassword123!',
    });

    if (loginResponse.body.data?.tokens?.accessToken) {
      accessToken = loginResponse.body.data.tokens.accessToken;
    }
  });

  afterEach(async () => {
    // Clean up test data after each test
    try {
      await prisma.comment.deleteMany({});
      await prisma.task.deleteMany({});
      await prisma.projectMember.deleteMany({});
      await prisma.project.deleteMany({});
      await prisma.user.deleteMany({});
    } catch (error) {
      console.warn('Cleanup error:', error);
    }
  });

  describe('Authentication Flow', () => {
    it('should complete full authentication flow', async () => {
      // 1. Register new user
      const registerData = {
        email: 'newuser@example.com',
        username: 'newuser',
        firstName: 'New',
        lastName: 'User',
        password: 'NewPassword123!',
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.data.user.email).toBe(registerData.email);
      expect(registerResponse.body.data.tokens.accessToken).toBeDefined();

      // 2. Login with new user
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: registerData.email,
          password: registerData.password,
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      const newAccessToken = loginResponse.body.data.tokens.accessToken;

      // 3. Get current user
      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200);

      expect(meResponse.body.data.user.email).toBe(registerData.email);

      // 4. Update profile
      const updateResponse = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Name',
        })
        .expect(200);

      expect(updateResponse.body.data.user.firstName).toBe('Updated');

      // 5. Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200);
    });
  });

  describe('Project Management Flow', () => {
    it('should complete full project management flow', async () => {
      // 1. Create project
      const projectData = {
        name: 'Test Project',
        description: 'A test project for integration testing',
        color: '#0D65F2',
      };

      const createResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(projectData)
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data.project.name).toBe(projectData.name);
      testProject = createResponse.body.data.project;

      // 2. Get projects list
      const listResponse = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(listResponse.body.data.projects).toHaveLength(1);
      expect(listResponse.body.data.projects[0].id).toBe(testProject.id);

      // 3. Get project details
      const detailsResponse = await request(app)
        .get(`/api/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(detailsResponse.body.data.project.id).toBe(testProject.id);

      // 4. Update project
      const updateResponse = await request(app)
        .put(`/api/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Updated Project Name',
          description: 'Updated description',
        })
        .expect(200);

      expect(updateResponse.body.data.project.name).toBe(
        'Updated Project Name'
      );

      // 5. Delete project
      await request(app)
        .delete(`/api/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify project is deleted
      await request(app)
        .get(`/api/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('Task Management Flow', () => {
    beforeEach(async () => {
      // Create test project for tasks
      testProject = await prisma.project.create({
        data: {
          name: 'Test Project',
          description: 'A test project',
          color: '#0D65F2',
          ownerId: testUser.id,
        },
      });
    });

    it('should complete full task management flow', async () => {
      // 1. Create task
      const taskData = {
        title: 'Test Task',
        description: 'A test task for integration testing',
        status: 'TODO',
        priority: 'MEDIUM',
        projectId: testProject.id,
      };

      const createResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(taskData)
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data.task.title).toBe(taskData.title);
      testTask = createResponse.body.data.task;

      // 2. Get tasks list
      const listResponse = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(listResponse.body.data.tasks).toHaveLength(1);
      expect(listResponse.body.data.tasks[0].id).toBe(testTask.id);

      // 3. Get task details
      const detailsResponse = await request(app)
        .get(`/api/tasks/${testTask.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(detailsResponse.body.data.task.id).toBe(testTask.id);

      // 4. Update task
      const updateResponse = await request(app)
        .put(`/api/tasks/${testTask.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Updated Task Title',
          status: 'IN_PROGRESS',
          assigneeId: testUser.id,
        })
        .expect(200);

      expect(updateResponse.body.data.task.title).toBe('Updated Task Title');
      expect(updateResponse.body.data.task.status).toBe('IN_PROGRESS');

      // 5. Add comment to task
      const commentResponse = await request(app)
        .post(`/api/tasks/${testTask.id}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'This is a test comment',
        })
        .expect(201);

      expect(commentResponse.body.success).toBe(true);
      expect(commentResponse.body.data.comment.content).toBe(
        'This is a test comment'
      );

      // 6. Get task comments
      const commentsResponse = await request(app)
        .get(`/api/tasks/${testTask.id}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(commentsResponse.body.data.comments).toHaveLength(1);

      // 7. Delete task
      await request(app)
        .delete(`/api/tasks/${testTask.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify task is deleted
      await request(app)
        .get(`/api/tasks/${testTask.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('Analytics Flow', () => {
    beforeEach(async () => {
      // Create test project and tasks for analytics
      testProject = await prisma.project.create({
        data: {
          name: 'Analytics Test Project',
          description: 'A test project for analytics',
          color: '#0D65F2',
          ownerId: testUser.id,
        },
      });

      // Create multiple tasks with different statuses
      await prisma.task.createMany({
        data: [
          {
            title: 'Task 1',
            status: 'TODO',
            priority: 'HIGH',
            projectId: testProject.id,
            assigneeId: testUser.id,
          },
          {
            title: 'Task 2',
            status: 'IN_PROGRESS',
            priority: 'MEDIUM',
            projectId: testProject.id,
            assigneeId: testUser.id,
          },
          {
            title: 'Task 3',
            status: 'DONE',
            priority: 'LOW',
            projectId: testProject.id,
            assigneeId: testUser.id,
          },
        ],
      });
    });

    it('should provide analytics data', async () => {
      // 1. Get dashboard analytics
      const dashboardResponse = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(dashboardResponse.body.success).toBe(true);
      expect(dashboardResponse.body.data.totalProjects).toBe(1);
      expect(dashboardResponse.body.data.totalTasks).toBe(3);

      // 2. Get task status distribution
      const statusResponse = await request(app)
        .get('/api/analytics/tasks-by-status')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(statusResponse.body.success).toBe(true);
      expect(statusResponse.body.data.statusDistribution).toBeDefined();

      // 3. Get user productivity
      const productivityResponse = await request(app)
        .get('/api/analytics/user-productivity')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(productivityResponse.body.success).toBe(true);
      expect(productivityResponse.body.data.productivity).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors properly', async () => {
      // Test without token
      await request(app).get('/api/projects').expect(401);

      // Test with invalid token
      await request(app)
        .get('/api/projects')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should handle validation errors properly', async () => {
      // Test invalid project data
      await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          // Missing required name field
          description: 'Invalid project',
        })
        .expect(400);

      // Test invalid task data
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          // Missing required fields
          description: 'Invalid task',
        })
        .expect(400);
    });

    it('should handle not found errors properly', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await request(app)
        .get(`/api/projects/${nonExistentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      await request(app)
        .get(`/api/tasks/${nonExistentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('Authorization Checks', () => {
    let otherUser: any;
    let otherUserToken: string;

    beforeEach(async () => {
      // Create another user
      otherUser = await prisma.user.create({
        data: {
          email: 'other@example.com',
          username: 'otheruser',
          firstName: 'Other',
          lastName: 'User',
          password: await hashPassword('OtherPassword123!'),
        },
      });

      // Get token for other user
      const loginResponse = await request(app).post('/api/auth/login').send({
        email: 'other@example.com',
        password: 'OtherPassword123!',
      });

      otherUserToken = loginResponse.body.data.tokens.accessToken;

      // Create test project owned by first user
      testProject = await prisma.project.create({
        data: {
          name: 'Private Project',
          description: 'A private project',
          color: '#0D65F2',
          ownerId: testUser.id,
        },
      });
    });

    it('should enforce project access control', async () => {
      // Other user should not be able to access private project
      await request(app)
        .get(`/api/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);

      // Other user should not be able to update private project
      await request(app)
        .put(`/api/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ name: 'Hacked Project' })
        .expect(403);

      // Other user should not be able to delete private project
      await request(app)
        .delete(`/api/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);
    });

    it('should enforce task access control', async () => {
      // Create task in private project
      testTask = await prisma.task.create({
        data: {
          title: 'Private Task',
          status: 'TODO',
          priority: 'MEDIUM',
          projectId: testProject.id,
        },
      });

      // Other user should not be able to access task
      await request(app)
        .get(`/api/tasks/${testTask.id}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);

      // Other user should not be able to update task
      await request(app)
        .put(`/api/tasks/${testTask.id}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ title: 'Hacked Task' })
        .expect(403);

      // Other user should not be able to delete task
      await request(app)
        .delete(`/api/tasks/${testTask.id}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);
    });
  });

  describe('Data Validation', () => {
    it('should validate user registration data', async () => {
      // Test invalid email
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          password: 'TestPassword123!',
        })
        .expect(400);

      // Test weak password
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          password: 'weak',
        })
        .expect(400);

      // Test duplicate email
      await request(app)
        .post('/api/auth/register')
        .send({
          email: testUser.email, // Already exists
          username: 'newuser',
          firstName: 'New',
          lastName: 'User',
          password: 'TestPassword123!',
        })
        .expect(409);
    });

    it('should validate project data', async () => {
      // Test missing name
      await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          description: 'Project without name',
        })
        .expect(400);

      // Test invalid color format
      await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Project',
          color: 'invalid-color',
        })
        .expect(400);
    });

    it('should validate task data', async () => {
      // Create project first
      testProject = await prisma.project.create({
        data: {
          name: 'Test Project',
          ownerId: testUser.id,
        },
      });

      // Test missing title
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          projectId: testProject.id,
          description: 'Task without title',
        })
        .expect(400);

      // Test invalid status
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Test Task',
          projectId: testProject.id,
          status: 'INVALID_STATUS',
        })
        .expect(400);

      // Test invalid priority
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Test Task',
          projectId: testProject.id,
          priority: 'INVALID_PRIORITY',
        })
        .expect(400);
    });
  });
});
