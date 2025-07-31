import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { ConfigProvider } from 'antd';
import theme from './theme';

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  const mockSession = {
    user: {
      id: '1',
      email: 'test@example.com',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
    },
    accessToken: 'mock-token',
    expires: '2024-12-31',
  };

  return (
    <SessionProvider session={mockSession}>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider theme={theme}>{children}</ConfigProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

// Mock data generators
export const mockUser = {
  id: '1',
  email: 'test@example.com',
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User',
  avatar: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

export const mockProject = {
  id: '1',
  name: 'Test Project',
  description: 'A test project',
  color: '#0D65F2',
  ownerId: '1',
  owner: mockUser,
  members: [],
  tasks: [],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

export const mockTask = {
  id: '1',
  title: 'Test Task',
  description: 'A test task',
  status: 'TODO' as const,
  priority: 'MEDIUM' as const,
  assigneeId: '1',
  projectId: '1',
  assignee: mockUser,
  project: mockProject,
  comments: [],
  dueDate: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

export const mockComment = {
  id: '1',
  content: 'Test comment',
  taskId: '1',
  authorId: '1',
  task: mockTask,
  author: mockUser,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

// Test utilities
export const waitForLoadingToFinish = () =>
  new Promise(resolve => setTimeout(resolve, 0));

export const createMockQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
