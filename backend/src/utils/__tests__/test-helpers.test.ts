import {
  createTestUser,
  createTestProject,
  createTestTask,
  generateTestToken,
  createMockRequest,
  createMockResponse,
  mockUserData,
  mockProjectData,
  mockTaskData,
} from '../test-helpers';
import jwt from 'jsonwebtoken';

describe('Test Helpers', () => {
  describe('createTestUser', () => {
    it('should create a user with hashed password', async () => {
      const testData = {
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        password: 'password123',
      };

      const user = await createTestUser(testData);

      expect(user).toHaveProperty('id');
      expect(user.email).toBe(testData.email);
      expect(user.username).toBe(testData.username);
      expect(user.firstName).toBe(testData.firstName);
      expect(user.lastName).toBe(testData.lastName);
      expect(user.password).not.toBe(testData.password); // Should be hashed
    });

    it('should create a user with custom data', async () => {
      const customData = {
        email: 'custom@example.com',
        username: 'customuser',
        firstName: 'Custom',
        lastName: 'User',
        password: 'custompass',
      };

      const user = await createTestUser(customData);

      expect(user.email).toBe(customData.email);
      expect(user.username).toBe(customData.username);
      expect(user.firstName).toBe(customData.firstName);
      expect(user.lastName).toBe(customData.lastName);
    });
  });

  describe('createTestProject', () => {
    it('should create a project with owner', async () => {
      const user = await createTestUser();
      const project = await createTestProject(user.id);

      expect(project).toHaveProperty('id');
      expect(project.name).toBe(mockProjectData.name);
      expect(project.description).toBe(mockProjectData.description);
      expect(project.color).toBe(mockProjectData.color);
      expect(project.ownerId).toBe(user.id);
    });
  });

  describe('createTestTask', () => {
    it('should create a task in a project', async () => {
      const user = await createTestUser();
      const project = await createTestProject(user.id);
      const task = await createTestTask(project.id, user.id);

      expect(task).toHaveProperty('id');
      expect(task.title).toBe(mockTaskData.title);
      expect(task.description).toBe(mockTaskData.description);
      expect(task.status).toBe(mockTaskData.status);
      expect(task.priority).toBe(mockTaskData.priority);
      expect(task.projectId).toBe(project.id);
      expect(task.assigneeId).toBe(user.id);
    });
  });

  describe('generateTestToken', () => {
    it('should generate a valid JWT token', () => {
      const userId = 'test-user-id';
      const token = generateTestToken(userId);

      expect(token).toBeTruthy();

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'test-secret'
      ) as any;
      expect(decoded.userId).toBe(userId);
    });
  });

  describe('createMockRequest', () => {
    it('should create a mock request object', () => {
      const req = createMockRequest();

      expect(req).toHaveProperty('body');
      expect(req).toHaveProperty('params');
      expect(req).toHaveProperty('query');
      expect(req).toHaveProperty('headers');
    });

    it('should merge overrides', () => {
      const overrides = {
        body: { test: 'data' },
        params: { id: '123' },
      };

      const req = createMockRequest(overrides);

      expect(req.body).toEqual(overrides.body);
      expect(req.params).toEqual(overrides.params);
    });
  });

  describe('createMockResponse', () => {
    it('should create a mock response object', () => {
      const res = createMockResponse();

      expect(res.status).toBeDefined();
      expect(res.json).toBeDefined();
      expect(res.send).toBeDefined();
      expect(res.cookie).toBeDefined();
      expect(res.clearCookie).toBeDefined();
    });

    it('should chain methods', () => {
      const res = createMockResponse();

      expect(res.status!(200)).toBe(res);
      expect(res.json!({ test: 'data' })).toBe(res);
    });
  });
});
