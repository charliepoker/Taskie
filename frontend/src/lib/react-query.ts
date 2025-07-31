import { QueryClient } from '@tanstack/react-query';

// Create a client with optimized defaults for performance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: 5 minutes for most queries
      staleTime: 5 * 60 * 1000,
      // Cache time: 30 minutes (increased for better performance)
      gcTime: 30 * 60 * 1000,
      // Retry failed requests 3 times
      retry: 3,
      // Retry delay with exponential backoff
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus only for critical data
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
      // No automatic background refetch (manual control for performance)
      refetchInterval: false,
      // Network mode for better offline handling
      networkMode: 'online',
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
      // Retry delay: 1 second
      retryDelay: 1000,
      // Network mode for mutations
      networkMode: 'online',
    },
  },
});

// Performance-optimized query configurations
export const queryConfigs = {
  // Static/rarely changing data - longer cache times
  static: {
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  },
  // Real-time data - shorter cache times
  realtime: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 60 * 1000, // 1 minute
  },
  // Analytics data - medium cache times
  analytics: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },
  // User data - balanced cache times
  user: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },
};

// Query keys factory for consistent key management
export const queryKeys = {
  // Auth
  auth: {
    currentUser: ['auth', 'currentUser'] as const,
  },
  // Users
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (params: Record<string, any>) =>
      [...queryKeys.users.lists(), params] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },
  // Projects
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (params: Record<string, any>) =>
      [...queryKeys.projects.lists(), params] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
    members: (projectId: string) =>
      [...queryKeys.projects.detail(projectId), 'members'] as const,
  },
  // Tasks
  tasks: {
    all: ['tasks'] as const,
    lists: () => [...queryKeys.tasks.all, 'list'] as const,
    list: (params: Record<string, any>) =>
      [...queryKeys.tasks.lists(), params] as const,
    details: () => [...queryKeys.tasks.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.tasks.details(), id] as const,
    comments: (taskId: string) =>
      [...queryKeys.tasks.detail(taskId), 'comments'] as const,
  },
  // Analytics
  analytics: {
    all: ['analytics'] as const,
    dashboard: (params?: Record<string, any>) =>
      [...queryKeys.analytics.all, 'dashboard', params] as const,
    tasksByStatus: (params?: Record<string, any>) =>
      [...queryKeys.analytics.all, 'tasksByStatus', params] as const,
    userProductivity: (params?: Record<string, any>) =>
      [...queryKeys.analytics.all, 'userProductivity', params] as const,
  },
} as const;
