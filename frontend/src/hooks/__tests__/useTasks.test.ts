import { renderHook, waitFor } from '@testing-library/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '@/services/taskService';
import {
  useTasks,
  useTask,
  useTaskComments,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useAddTaskComment,
} from '../useTasks';

// Mock dependencies
jest.mock('@tanstack/react-query');
jest.mock('@/services/taskService');

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>;
const mockUseQueryClient = useQueryClient as jest.MockedFunction<
  typeof useQueryClient
>;
const mockTaskService = taskService as jest.Mocked<typeof taskService>;

describe('useTasks hooks', () => {
  const mockQueryClient = {
    invalidateQueries: jest.fn(),
    cancelQueries: jest.fn(),
    getQueryData: jest.fn(),
    getQueriesData: jest.fn(),
    setQueryData: jest.fn(),
    setQueriesData: jest.fn(),
    removeQueries: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQueryClient.mockReturnValue(mockQueryClient as any);
  });

  describe('useTasks', () => {
    it('should fetch tasks with default params', () => {
      const mockTasks = {
        data: [{ id: '1', title: 'Test Task' }],
        meta: { total: 1, page: 1, limit: 10 },
      };

      mockUseQuery.mockReturnValue({
        data: mockTasks,
        isLoading: false,
        error: null,
      } as any);

      renderHook(() => useTasks());

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: expect.any(Array),
        queryFn: expect.any(Function),
        enabled: true,
      });
    });

    it('should fetch tasks with custom params', () => {
      const params = { projectId: 'project-1', status: 'TODO' as const };

      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      } as any);

      renderHook(() => useTasks(params));

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: expect.any(Array),
        queryFn: expect.any(Function),
        enabled: true,
      });
    });
  });

  describe('useTask', () => {
    it('should fetch task by id when enabled', () => {
      const taskId = 'task-1';
      const mockTask = { id: taskId, title: 'Test Task' };

      mockUseQuery.mockReturnValue({
        data: mockTask,
        isLoading: false,
        error: null,
      } as any);

      renderHook(() => useTask(taskId));

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: expect.any(Array),
        queryFn: expect.any(Function),
        enabled: true,
      });
    });

    it('should not fetch when disabled', () => {
      const taskId = 'task-1';

      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      } as any);

      renderHook(() => useTask(taskId, false));

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: expect.any(Array),
        queryFn: expect.any(Function),
        enabled: false,
      });
    });

    it('should not fetch when id is empty', () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      } as any);

      renderHook(() => useTask(''));

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: expect.any(Array),
        queryFn: expect.any(Function),
        enabled: false,
      });
    });
  });

  describe('useTaskComments', () => {
    it('should fetch task comments with pagination', () => {
      const taskId = 'task-1';
      const mockComments = {
        data: [{ id: '1', content: 'Test comment' }],
        meta: { total: 1, page: 1, limit: 20 },
      };

      mockUseQuery.mockReturnValue({
        data: mockComments,
        isLoading: false,
        error: null,
      } as any);

      renderHook(() => useTaskComments(taskId, 1, 20));

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: expect.any(Array),
        queryFn: expect.any(Function),
        enabled: true,
      });
    });

    it('should not fetch when disabled', () => {
      const taskId = 'task-1';

      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      } as any);

      renderHook(() => useTaskComments(taskId, 1, 20, false));

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: expect.any(Array),
        queryFn: expect.any(Function),
        enabled: false,
      });
    });
  });

  describe('useCreateTask', () => {
    it('should create task with optimistic updates', () => {
      const mockMutationResult = {
        mutate: jest.fn(),
        mutateAsync: jest.fn(),
        isPending: false,
        isError: false,
        error: null,
      };

      mockUseMutation.mockReturnValue(mockMutationResult as any);
      mockTaskService.createTask.mockResolvedValue({
        id: '1',
        title: 'New Task',
      } as any);

      renderHook(() => useCreateTask());

      expect(mockUseMutation).toHaveBeenCalledWith({
        mutationFn: expect.any(Function),
        onMutate: expect.any(Function),
        onError: expect.any(Function),
        onSettled: expect.any(Function),
      });
    });

    it('should handle optimistic update on mutate', async () => {
      const mockMutationResult = {
        mutate: jest.fn(),
        mutateAsync: jest.fn(),
        isPending: false,
        isError: false,
        error: null,
      };

      mockUseMutation.mockReturnValue(mockMutationResult as any);
      mockQueryClient.cancelQueries.mockResolvedValue(undefined);
      mockQueryClient.getQueriesData.mockReturnValue([]);

      renderHook(() => useCreateTask());

      const onMutate = mockUseMutation.mock.calls[0][0].onMutate;
      const newTask = { title: 'New Task', projectId: 'project-1' };

      await onMutate(newTask);

      expect(mockQueryClient.cancelQueries).toHaveBeenCalled();
      expect(mockQueryClient.getQueriesData).toHaveBeenCalled();
      expect(mockQueryClient.setQueriesData).toHaveBeenCalled();
    });

    it('should rollback on error', () => {
      const mockMutationResult = {
        mutate: jest.fn(),
        mutateAsync: jest.fn(),
        isPending: false,
        isError: true,
        error: new Error('Create failed'),
      };

      mockUseMutation.mockReturnValue(mockMutationResult as any);

      renderHook(() => useCreateTask());

      const onError = mockUseMutation.mock.calls[0][0].onError;
      const context = {
        previousTasks: [
          [['tasks'], { data: [{ id: '1', title: 'Existing Task' }] }],
        ],
      };

      onError(new Error('Create failed'), { title: 'New Task' }, context);

      expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(['tasks'], {
        data: [{ id: '1', title: 'Existing Task' }],
      });
    });

    it('should invalidate queries on settled', () => {
      const mockMutationResult = {
        mutate: jest.fn(),
        mutateAsync: jest.fn(),
        isPending: false,
        isError: false,
        error: null,
      };

      mockUseMutation.mockReturnValue(mockMutationResult as any);

      renderHook(() => useCreateTask());

      const onSettled = mockUseMutation.mock.calls[0][0].onSettled;
      onSettled();

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(2);
    });
  });

  describe('useUpdateTask', () => {
    it('should update task with optimistic updates', () => {
      const mockMutationResult = {
        mutate: jest.fn(),
        mutateAsync: jest.fn(),
        isPending: false,
        isError: false,
        error: null,
      };

      mockUseMutation.mockReturnValue(mockMutationResult as any);
      mockTaskService.updateTask.mockResolvedValue({
        id: '1',
        title: 'Updated Task',
      } as any);

      renderHook(() => useUpdateTask());

      expect(mockUseMutation).toHaveBeenCalledWith({
        mutationFn: expect.any(Function),
        onMutate: expect.any(Function),
        onError: expect.any(Function),
        onSettled: expect.any(Function),
      });
    });

    it('should handle optimistic update on mutate', async () => {
      const mockMutationResult = {
        mutate: jest.fn(),
        mutateAsync: jest.fn(),
        isPending: false,
        isError: false,
        error: null,
      };

      mockUseMutation.mockReturnValue(mockMutationResult as any);
      mockQueryClient.cancelQueries.mockResolvedValue(undefined);
      mockQueryClient.getQueryData.mockReturnValue({
        id: '1',
        title: 'Old Title',
      });
      mockQueryClient.getQueriesData.mockReturnValue([]);

      renderHook(() => useUpdateTask());

      const onMutate = mockUseMutation.mock.calls[0][0].onMutate;
      const updateData = { id: '1', data: { title: 'New Title' } };

      await onMutate(updateData);

      expect(mockQueryClient.cancelQueries).toHaveBeenCalledTimes(2);
      expect(mockQueryClient.setQueryData).toHaveBeenCalled();
      expect(mockQueryClient.setQueriesData).toHaveBeenCalled();
    });
  });

  describe('useDeleteTask', () => {
    it('should delete task with optimistic updates', () => {
      const mockMutationResult = {
        mutate: jest.fn(),
        mutateAsync: jest.fn(),
        isPending: false,
        isError: false,
        error: null,
      };

      mockUseMutation.mockReturnValue(mockMutationResult as any);
      mockTaskService.deleteTask.mockResolvedValue(undefined);

      renderHook(() => useDeleteTask());

      expect(mockUseMutation).toHaveBeenCalledWith({
        mutationFn: expect.any(Function),
        onMutate: expect.any(Function),
        onError: expect.any(Function),
        onSuccess: expect.any(Function),
        onSettled: expect.any(Function),
      });
    });

    it('should remove task from cache on success', () => {
      const mockMutationResult = {
        mutate: jest.fn(),
        mutateAsync: jest.fn(),
        isPending: false,
        isError: false,
        error: null,
      };

      mockUseMutation.mockReturnValue(mockMutationResult as any);

      renderHook(() => useDeleteTask());

      const onSuccess = mockUseMutation.mock.calls[0][0].onSuccess;
      onSuccess(undefined, 'task-1');

      expect(mockQueryClient.removeQueries).toHaveBeenCalled();
    });
  });

  describe('useAddTaskComment', () => {
    it('should add comment with optimistic updates', () => {
      const mockMutationResult = {
        mutate: jest.fn(),
        mutateAsync: jest.fn(),
        isPending: false,
        isError: false,
        error: null,
      };

      mockUseMutation.mockReturnValue(mockMutationResult as any);
      mockTaskService.addTaskComment.mockResolvedValue({
        id: '1',
        content: 'New comment',
      } as any);

      renderHook(() => useAddTaskComment());

      expect(mockUseMutation).toHaveBeenCalledWith({
        mutationFn: expect.any(Function),
        onMutate: expect.any(Function),
        onError: expect.any(Function),
        onSettled: expect.any(Function),
      });
    });

    it('should handle optimistic update on mutate', async () => {
      const mockMutationResult = {
        mutate: jest.fn(),
        mutateAsync: jest.fn(),
        isPending: false,
        isError: false,
        error: null,
      };

      mockUseMutation.mockReturnValue(mockMutationResult as any);
      mockQueryClient.cancelQueries.mockResolvedValue(undefined);
      mockQueryClient.getQueriesData.mockReturnValue([]);

      renderHook(() => useAddTaskComment());

      const onMutate = mockUseMutation.mock.calls[0][0].onMutate;
      const newComment = { taskId: 'task-1', content: 'New comment' };

      await onMutate(newComment);

      expect(mockQueryClient.cancelQueries).toHaveBeenCalled();
      expect(mockQueryClient.setQueriesData).toHaveBeenCalled();
    });

    it('should invalidate queries on settled', () => {
      const mockMutationResult = {
        mutate: jest.fn(),
        mutateAsync: jest.fn(),
        isPending: false,
        isError: false,
        error: null,
      };

      mockUseMutation.mockReturnValue(mockMutationResult as any);

      renderHook(() => useAddTaskComment());

      const onSettled = mockUseMutation.mock.calls[0][0].onSettled;
      onSettled(undefined, undefined, {
        taskId: 'task-1',
        content: 'New comment',
      });

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(2);
    });
  });
});
