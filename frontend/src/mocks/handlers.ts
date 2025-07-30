import { http, HttpResponse } from 'msw';
import {
  mockUser,
  mockProject,
  mockTask,
  mockComment,
} from '../lib/test-utils';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const handlers = [
  // Auth endpoints
  http.post(`${API_BASE_URL}/auth/register`, () => {
    return HttpResponse.json({
      user: mockUser,
      tokens: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      },
    });
  }),

  http.post(`${API_BASE_URL}/auth/login`, () => {
    return HttpResponse.json({
      user: mockUser,
      tokens: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      },
    });
  }),

  http.post(`${API_BASE_URL}/auth/logout`, () => {
    return HttpResponse.json({ message: 'Logged out successfully' });
  }),

  http.get(`${API_BASE_URL}/auth/me`, () => {
    return HttpResponse.json(mockUser);
  }),

  // User endpoints
  http.get(`${API_BASE_URL}/users`, () => {
    return HttpResponse.json({
      users: [mockUser],
      total: 1,
      page: 1,
      limit: 10,
    });
  }),

  http.get(`${API_BASE_URL}/users/:id`, ({ params }) => {
    return HttpResponse.json({ ...mockUser, id: params.id });
  }),

  http.put(`${API_BASE_URL}/users/:id`, ({ params }) => {
    return HttpResponse.json({ ...mockUser, id: params.id });
  }),

  http.delete(`${API_BASE_URL}/users/:id`, () => {
    return HttpResponse.json({ message: 'User deleted successfully' });
  }),

  // Project endpoints
  http.get(`${API_BASE_URL}/projects`, () => {
    return HttpResponse.json({
      projects: [mockProject],
      total: 1,
      page: 1,
      limit: 10,
    });
  }),

  http.post(`${API_BASE_URL}/projects`, () => {
    return HttpResponse.json(mockProject);
  }),

  http.get(`${API_BASE_URL}/projects/:id`, ({ params }) => {
    return HttpResponse.json({ ...mockProject, id: params.id });
  }),

  http.put(`${API_BASE_URL}/projects/:id`, ({ params }) => {
    return HttpResponse.json({ ...mockProject, id: params.id });
  }),

  http.delete(`${API_BASE_URL}/projects/:id`, () => {
    return HttpResponse.json({ message: 'Project deleted successfully' });
  }),

  http.post(`${API_BASE_URL}/projects/:id/members`, () => {
    return HttpResponse.json({ message: 'Member added successfully' });
  }),

  http.delete(`${API_BASE_URL}/projects/:projectId/members/:userId`, () => {
    return HttpResponse.json({ message: 'Member removed successfully' });
  }),

  // Task endpoints
  http.get(`${API_BASE_URL}/tasks`, () => {
    return HttpResponse.json({
      tasks: [mockTask],
      total: 1,
      page: 1,
      limit: 10,
    });
  }),

  http.post(`${API_BASE_URL}/tasks`, () => {
    return HttpResponse.json(mockTask);
  }),

  http.get(`${API_BASE_URL}/tasks/:id`, ({ params }) => {
    return HttpResponse.json({ ...mockTask, id: params.id });
  }),

  http.put(`${API_BASE_URL}/tasks/:id`, ({ params }) => {
    return HttpResponse.json({ ...mockTask, id: params.id });
  }),

  http.delete(`${API_BASE_URL}/tasks/:id`, () => {
    return HttpResponse.json({ message: 'Task deleted successfully' });
  }),

  http.post(`${API_BASE_URL}/tasks/:id/comments`, () => {
    return HttpResponse.json(mockComment);
  }),

  // Analytics endpoints
  http.get(`${API_BASE_URL}/analytics/dashboard`, () => {
    return HttpResponse.json({
      totalProjects: 5,
      totalTasks: 25,
      completedTasks: 15,
      activeUsers: 8,
      tasksByStatus: {
        TODO: 5,
        IN_PROGRESS: 5,
        IN_REVIEW: 3,
        DONE: 12,
      },
      recentActivity: [],
    });
  }),

  http.get(`${API_BASE_URL}/analytics/tasks-by-status`, () => {
    return HttpResponse.json({
      TODO: 5,
      IN_PROGRESS: 5,
      IN_REVIEW: 3,
      DONE: 12,
    });
  }),

  http.get(`${API_BASE_URL}/analytics/user-productivity`, () => {
    return HttpResponse.json([
      {
        userId: '1',
        username: 'testuser',
        completedTasks: 10,
        averageCompletionTime: 2.5,
      },
    ]);
  }),

  // Health check
  http.get(`${API_BASE_URL}/health`, () => {
    return HttpResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  }),
];
