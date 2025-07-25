import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../app';
import { generateTokens } from '../utils/jwt';
import { hashPassword } from '../utils/password';

const prisma = new PrismaClient();

describe('Project Controller', () => {
  let testUser1: any;
  let testUser2: any;
  let testProject: any;
  let authToken1: string;
  let authToken2: string;

  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.comment.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.projectMember.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['test1@example.com', 'test2@example.com'],
        },
      },
    });

    // Create test users
    const hashedPassword = await hashPassword('password123');

    testUser1 = await prisma.user.create({
      data: {
        email: 'test1@example.com',
        username: 'testuser1',
        firstName: 'Test',
        lastName: 'User1',
        password: hashedPassword,
      },
    });

    testUser2 = await prisma.user.create({
      data: {
        email: 'test2@example.com',
        username: 'testuser2',
        firstName: 'Test',
        lastName: 'User2',
        password: hashedPassword,
      },
    });

    // Generate auth tokens
    authToken1 = generateTokens(testUser1).accessToken;
    authToken2 = generateTokens(testUser2).accessToken;
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
          in: ['test1@example.com', 'test2@example.com'],
        },
      },
    });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up projects before each test
    await prisma.comment.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.projectMember.deleteMany({});
    await prisma.project.deleteMany({});
  });

  describe('POST /api/projects', () => {
    it('should create a new project successfully', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'A test project',
        color: '#FF5733',
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken1}`)
        .send(projectData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.project.name).toBe(projectData.name);
      expect(response.body.data.project.description).toBe(
        projectData.description
      );
      expect(response.body.data.project.color).toBe(projectData.color);
      expect(response.body.data.project.ownerId).toBe(testUser1.id);
    });

    it('should create project with default color if not provided', async () => {
      const projectData = {
        name: 'Test Project Default Color',
        description: 'A test project with default color',
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken1}`)
        .send(projectData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.project.color).toBe('#0D65F2');
    });

    it('should fail without authentication', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'A test project',
      };

      await request(app).post('/api/projects').send(projectData).expect(401);
    });

    it('should fail with invalid project data', async () => {
      const projectData = {
        name: '', // Empty name should fail
        description: 'A test project',
      };

      await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken1}`)
        .send(projectData)
        .expect(400);
    });
  });

  describe('GET /api/projects', () => {
    beforeEach(async () => {
      // Create test projects
      testProject = await prisma.project.create({
        data: {
          name: 'Alpha Project',
          description: 'First project for testing',
          ownerId: testUser1.id,
        },
      });

      // Create a project owned by user2
      await prisma.project.create({
        data: {
          name: 'Beta Project',
          description: 'Second project for testing',
          ownerId: testUser2.id,
        },
      });

      // Add user1 as member to user2's project
      const user2Project = await prisma.project.findFirst({
        where: { ownerId: testUser2.id },
      });

      if (user2Project) {
        await prisma.projectMember.create({
          data: {
            userId: testUser1.id,
            projectId: user2Project.id,
            role: 'MEMBER',
          },
        });
      }
    });

    it('should get projects for authenticated user', async () => {
      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2); // User1 owns 1, member of 1
      expect(response.body.meta.total).toBe(2);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/projects?page=1&limit=1')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(1);
    });

    it('should support search', async () => {
      const response = await request(app)
        .get('/api/projects?search=Alpha')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Alpha Project');
    });

    it('should fail without authentication', async () => {
      await request(app).get('/api/projects').expect(401);
    });
  });

  describe('GET /api/projects/:id', () => {
    beforeEach(async () => {
      testProject = await prisma.project.create({
        data: {
          name: 'Test Project Detail',
          description: 'Project for detail testing',
          ownerId: testUser1.id,
        },
      });
    });

    it('should get project details for owner', async () => {
      const response = await request(app)
        .get(`/api/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.project.id).toBe(testProject.id);
      expect(response.body.data.project.name).toBe(testProject.name);
      expect(response.body.data.project.owner).toBeDefined();
      expect(response.body.data.project.members).toBeDefined();
    });

    it('should deny access to non-member', async () => {
      await request(app)
        .get(`/api/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(404);
    });

    it('should fail with invalid project ID', async () => {
      await request(app)
        .get('/api/projects/invalid-id')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(400);
    });
  });

  describe('PUT /api/projects/:id', () => {
    beforeEach(async () => {
      testProject = await prisma.project.create({
        data: {
          name: 'Test Project Update',
          description: 'Project for update testing',
          ownerId: testUser1.id,
        },
      });
    });

    it('should update project as owner', async () => {
      const updateData = {
        name: 'Updated Project Name',
        description: 'Updated description',
        color: '#00FF00',
      };

      const response = await request(app)
        .put(`/api/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.project.name).toBe(updateData.name);
      expect(response.body.data.project.description).toBe(
        updateData.description
      );
      expect(response.body.data.project.color).toBe(updateData.color);
    });

    it('should deny update to non-owner', async () => {
      const updateData = {
        name: 'Unauthorized Update',
      };

      await request(app)
        .put(`/api/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send(updateData)
        .expect(403);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    beforeEach(async () => {
      testProject = await prisma.project.create({
        data: {
          name: 'Test Project Delete',
          description: 'Project for delete testing',
          ownerId: testUser1.id,
        },
      });
    });

    it('should delete project as owner', async () => {
      await request(app)
        .delete(`/api/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      // Verify project is deleted
      const deletedProject = await prisma.project.findUnique({
        where: { id: testProject.id },
      });
      expect(deletedProject).toBeNull();
    });

    it('should deny delete to non-owner', async () => {
      await request(app)
        .delete(`/api/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(403);
    });
  });

  describe('Project Member Management', () => {
    beforeEach(async () => {
      testProject = await prisma.project.create({
        data: {
          name: 'Test Project Members',
          description: 'Project for member testing',
          ownerId: testUser1.id,
        },
      });
    });

    describe('POST /api/projects/:projectId/members', () => {
      it('should add member as owner', async () => {
        const memberData = {
          userId: testUser2.id,
          role: 'MEMBER',
        };

        const response = await request(app)
          .post(`/api/projects/${testProject.id}/members`)
          .set('Authorization', `Bearer ${authToken1}`)
          .send(memberData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.member.userId).toBe(testUser2.id);
        expect(response.body.data.member.role).toBe('MEMBER');
      });

      it('should fail to add existing member', async () => {
        // Add member first
        await prisma.projectMember.create({
          data: {
            userId: testUser2.id,
            projectId: testProject.id,
            role: 'MEMBER',
          },
        });

        const memberData = {
          userId: testUser2.id,
          role: 'MEMBER',
        };

        await request(app)
          .post(`/api/projects/${testProject.id}/members`)
          .set('Authorization', `Bearer ${authToken1}`)
          .send(memberData)
          .expect(409);
      });
    });

    describe('PUT /api/projects/:projectId/members/:userId', () => {
      beforeEach(async () => {
        await prisma.projectMember.create({
          data: {
            userId: testUser2.id,
            projectId: testProject.id,
            role: 'MEMBER',
          },
        });
      });

      it('should update member role as owner', async () => {
        const updateData = {
          role: 'ADMIN',
        };

        const response = await request(app)
          .put(`/api/projects/${testProject.id}/members/${testUser2.id}`)
          .set('Authorization', `Bearer ${authToken1}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.member.role).toBe('ADMIN');
      });
    });

    describe('DELETE /api/projects/:projectId/members/:userId', () => {
      beforeEach(async () => {
        await prisma.projectMember.create({
          data: {
            userId: testUser2.id,
            projectId: testProject.id,
            role: 'MEMBER',
          },
        });
      });

      it('should remove member as owner', async () => {
        await request(app)
          .delete(`/api/projects/${testProject.id}/members/${testUser2.id}`)
          .set('Authorization', `Bearer ${authToken1}`)
          .expect(200);

        // Verify member is removed
        const member = await prisma.projectMember.findUnique({
          where: {
            userId_projectId: {
              userId: testUser2.id,
              projectId: testProject.id,
            },
          },
        });
        expect(member).toBeNull();
      });

      it('should allow member to remove themselves', async () => {
        await request(app)
          .delete(`/api/projects/${testProject.id}/members/${testUser2.id}`)
          .set('Authorization', `Bearer ${authToken2}`)
          .expect(200);
      });
    });
  });
});
