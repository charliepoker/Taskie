import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Extend Request interface for authenticated requests
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
  };
}

// Test database instance
export const testDb = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Mock user data generator
export const generateMockUserData = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return {
    email: `test${timestamp}${random}@example.com`,
    username: `testuser${timestamp}${random}`,
    firstName: 'Test',
    lastName: 'User',
    password: 'password123',
  };
};

export const mockUserData = generateMockUserData();

export const mockProjectData = {
  name: 'Test Project',
  description: 'A test project',
  color: '#0D65F2',
};

export const mockTaskData = {
  title: 'Test Task',
  description: 'A test task',
  status: 'TODO' as const,
  priority: 'MEDIUM' as const,
};

// Database cleanup utilities
export const cleanupDatabase = async () => {
  try {
    // Delete in order to respect foreign key constraints
    await testDb.comment.deleteMany();
    await testDb.task.deleteMany();
    await testDb.projectMember.deleteMany();
    await testDb.project.deleteMany();
    await testDb.user.deleteMany();
  } catch (error) {
    console.log('Database cleanup error:', error);
  }
};

// User creation utilities
export const createTestUser = async (userData = generateMockUserData()) => {
  const hashedPassword = await bcrypt.hash(userData.password, 10);

  return await testDb.user.create({
    data: {
      ...userData,
      password: hashedPassword,
    },
  });
};

export const createTestProject = async (
  ownerId: string,
  projectData = mockProjectData
) => {
  return await testDb.project.create({
    data: {
      ...projectData,
      ownerId,
    },
  });
};

export const createTestTask = async (
  projectId: string,
  assigneeId?: string,
  taskData = mockTaskData
) => {
  return await testDb.task.create({
    data: {
      ...taskData,
      projectId,
      assigneeId,
    },
  });
};

// JWT utilities for testing
export const generateTestToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'test-secret', {
    expiresIn: '1h',
  });
};

// Mock Express request/response objects
export const createMockRequest = (
  overrides: Partial<AuthenticatedRequest> = {}
): Partial<AuthenticatedRequest> => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: undefined,
  ...overrides,
});

export const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
};

// Test setup and teardown
export const setupTestDatabase = async () => {
  await testDb.$connect();
  await cleanupDatabase();
};

export const teardownTestDatabase = async () => {
  await cleanupDatabase();
  await testDb.$disconnect();
};

// Authenticated request helper
export const createAuthenticatedRequest = async (
  overrides: Partial<AuthenticatedRequest> = {}
): Promise<Partial<AuthenticatedRequest>> => {
  const user = await createTestUser();
  const token = generateTestToken(user.id);

  return createMockRequest({
    headers: {
      authorization: `Bearer ${token}`,
    },
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    ...overrides,
  });
};
