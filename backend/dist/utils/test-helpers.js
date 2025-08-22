"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthenticatedRequest = exports.teardownTestDatabase = exports.setupTestDatabase = exports.createMockResponse = exports.createMockRequest = exports.generateTestToken = exports.createTestTask = exports.createTestProject = exports.createTestUser = exports.cleanupDatabase = exports.mockTaskData = exports.mockProjectData = exports.mockUserData = exports.generateMockUserData = exports.testDb = void 0;
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
exports.testDb = new client_1.PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});
const generateMockUserData = () => {
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
exports.generateMockUserData = generateMockUserData;
exports.mockUserData = (0, exports.generateMockUserData)();
exports.mockProjectData = {
    name: 'Test Project',
    description: 'A test project',
    color: '#0D65F2',
};
exports.mockTaskData = {
    title: 'Test Task',
    description: 'A test task',
    status: 'TODO',
    priority: 'MEDIUM',
};
const cleanupDatabase = async () => {
    try {
        await exports.testDb.comment.deleteMany();
        await exports.testDb.task.deleteMany();
        await exports.testDb.projectMember.deleteMany();
        await exports.testDb.project.deleteMany();
        await exports.testDb.user.deleteMany();
    }
    catch (error) {
        console.log('Database cleanup error:', error);
    }
};
exports.cleanupDatabase = cleanupDatabase;
const createTestUser = async (userData = (0, exports.generateMockUserData)()) => {
    const hashedPassword = await bcryptjs_1.default.hash(userData.password, 10);
    return await exports.testDb.user.create({
        data: {
            ...userData,
            password: hashedPassword,
        },
    });
};
exports.createTestUser = createTestUser;
const createTestProject = async (ownerId, projectData = exports.mockProjectData) => {
    return await exports.testDb.project.create({
        data: {
            ...projectData,
            ownerId,
        },
    });
};
exports.createTestProject = createTestProject;
const createTestTask = async (projectId, assigneeId, taskData = exports.mockTaskData) => {
    return await exports.testDb.task.create({
        data: {
            ...taskData,
            projectId,
            assigneeId,
        },
    });
};
exports.createTestTask = createTestTask;
const generateTestToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId }, process.env.JWT_SECRET || 'test-secret', {
        expiresIn: '1h',
    });
};
exports.generateTestToken = generateTestToken;
const createMockRequest = (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    user: undefined,
    ...overrides,
});
exports.createMockRequest = createMockRequest;
const createMockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.cookie = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);
    return res;
};
exports.createMockResponse = createMockResponse;
const setupTestDatabase = async () => {
    await exports.testDb.$connect();
    await (0, exports.cleanupDatabase)();
};
exports.setupTestDatabase = setupTestDatabase;
const teardownTestDatabase = async () => {
    await (0, exports.cleanupDatabase)();
    await exports.testDb.$disconnect();
};
exports.teardownTestDatabase = teardownTestDatabase;
const createAuthenticatedRequest = async (overrides = {}) => {
    const user = await (0, exports.createTestUser)();
    const token = (0, exports.generateTestToken)(user.id);
    return (0, exports.createMockRequest)({
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
exports.createAuthenticatedRequest = createAuthenticatedRequest;
//# sourceMappingURL=test-helpers.js.map