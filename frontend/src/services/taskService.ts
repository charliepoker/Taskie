import axios from 'axios';
import { getSession } from 'next-auth/react';
import {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  TaskQueryParams,
  PaginatedResponse,
  Comment,
  CreateCommentInput,
} from '../types/task';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance with interceptors
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use(async config => {
  const session = await getSession();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

export const taskService = {
  // Get tasks with filtering and pagination
  async getTasks(
    params: TaskQueryParams = {}
  ): Promise<PaginatedResponse<Task>> {
    const response = await api.get('/api/tasks', { params });
    return response.data;
  },

  // Get single task by ID
  async getTaskById(id: string): Promise<Task> {
    const response = await api.get(`/api/tasks/${id}`);
    return response.data.data.task;
  },

  // Create new task
  async createTask(data: CreateTaskInput): Promise<Task> {
    const response = await api.post('/api/tasks', data);
    return response.data.data.task;
  },

  // Update task
  async updateTask(id: string, data: UpdateTaskInput): Promise<Task> {
    const response = await api.put(`/api/tasks/${id}`, data);
    return response.data.data.task;
  },

  // Delete task
  async deleteTask(id: string): Promise<void> {
    await api.delete(`/api/tasks/${id}`);
  },

  // Get task comments
  async getTaskComments(
    taskId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<Comment>> {
    const response = await api.get(`/api/tasks/${taskId}/comments`, {
      params: { page, limit },
    });
    return response.data;
  },

  // Add comment to task
  async addTaskComment(data: CreateCommentInput): Promise<Comment> {
    const response = await api.post(`/api/tasks/${data.taskId}/comments`, {
      content: data.content,
    });
    return response.data.data.comment;
  },
};
