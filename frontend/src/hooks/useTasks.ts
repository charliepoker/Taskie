import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { taskService } from '@/services/taskService';
import { queryKeys } from '@/lib/react-query';
import type {
  TaskQueryParams,
  CreateTaskInput,
  UpdateTaskInput,
  CreateCommentInput,
} from '@/types/task';

// Query hooks
export function useTasks(params: TaskQueryParams = {}) {
  return useQuery({
    queryKey: queryKeys.tasks.list(params),
    queryFn: () => taskService.getTasks(params),
    enabled: true,
  });
}

export function useTask(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.tasks.detail(id),
    queryFn: () => taskService.getTaskById(id),
    enabled: enabled && !!id,
  });
}

export function useTaskComments(
  taskId: string,
  page = 1,
  limit = 20,
  enabled = true
) {
  return useQuery({
    queryKey: [...queryKeys.tasks.comments(taskId), { page, limit }],
    queryFn: () => taskService.getTaskComments(taskId, page, limit),
    enabled: enabled && !!taskId,
  });
}

// Mutation hooks with optimistic updates
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaskInput) => taskService.createTask(data),
    onMutate: async newTask => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.lists() });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueriesData({
        queryKey: queryKeys.tasks.lists(),
      });

      // Optimistically update to the new value
      queryClient.setQueriesData(
        { queryKey: queryKeys.tasks.lists() },
        (old: any) => {
          if (!old) return old;

          const optimisticTask = {
            id: `temp-${Date.now()}`,
            ...newTask,
            status: newTask.status || 'TODO',
            priority: newTask.priority || 'MEDIUM',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            comments: [],
          };

          return {
            ...old,
            data: [optimisticTask, ...old.data],
            meta: {
              ...old.meta,
              total: old.meta.total + 1,
            },
          };
        }
      );

      return { previousTasks };
    },
    onError: (err, newTask, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTasks) {
        context.previousTasks.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskInput }) =>
      taskService.updateTask(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.detail(id) });
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.lists() });

      // Snapshot the previous values
      const previousTask = queryClient.getQueryData(queryKeys.tasks.detail(id));
      const previousTaskLists = queryClient.getQueriesData({
        queryKey: queryKeys.tasks.lists(),
      });

      // Optimistically update the task detail
      queryClient.setQueryData(queryKeys.tasks.detail(id), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          ...data,
          updatedAt: new Date().toISOString(),
        };
      });

      // Optimistically update task lists
      queryClient.setQueriesData(
        { queryKey: queryKeys.tasks.lists() },
        (old: any) => {
          if (!old) return old;

          return {
            ...old,
            data: old.data.map((task: any) =>
              task.id === id
                ? { ...task, ...data, updatedAt: new Date().toISOString() }
                : task
            ),
          };
        }
      );

      return { previousTask, previousTaskLists };
    },
    onError: (err, { id }, context) => {
      // Roll back optimistic updates
      if (context?.previousTask) {
        queryClient.setQueryData(
          queryKeys.tasks.detail(id),
          context.previousTask
        );
      }
      if (context?.previousTaskLists) {
        context.previousTaskLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: (_, __, { id }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => taskService.deleteTask(id),
    onMutate: async id => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.lists() });

      // Snapshot the previous value
      const previousTaskLists = queryClient.getQueriesData({
        queryKey: queryKeys.tasks.lists(),
      });

      // Optimistically remove the task
      queryClient.setQueriesData(
        { queryKey: queryKeys.tasks.lists() },
        (old: any) => {
          if (!old) return old;

          return {
            ...old,
            data: old.data.filter((task: any) => task.id !== id),
            meta: {
              ...old.meta,
              total: Math.max(0, old.meta.total - 1),
            },
          };
        }
      );

      return { previousTaskLists };
    },
    onError: (err, id, context) => {
      // Roll back optimistic updates
      if (context?.previousTaskLists) {
        context.previousTaskLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (_, id) => {
      // Remove the task from cache
      queryClient.removeQueries({ queryKey: queryKeys.tasks.detail(id) });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
    },
  });
}

export function useAddTaskComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCommentInput) => taskService.addTaskComment(data),
    onMutate: async newComment => {
      const { taskId } = newComment;

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.tasks.comments(taskId),
      });

      // Snapshot the previous value
      const previousComments = queryClient.getQueriesData({
        queryKey: queryKeys.tasks.comments(taskId),
      });

      // Optimistically add the comment
      queryClient.setQueriesData(
        {
          queryKey: queryKeys.tasks.comments(taskId),
        },
        (old: any) => {
          if (!old) return old;

          const optimisticComment = {
            id: `temp-${Date.now()}`,
            content: newComment.content,
            taskId: newComment.taskId,
            authorId: 'current-user', // This would come from auth context
            author: {
              id: 'current-user',
              firstName: 'Current',
              lastName: 'User',
              email: 'current@user.com',
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          return {
            ...old,
            data: [optimisticComment, ...old.data],
            meta: {
              ...old.meta,
              total: old.meta.total + 1,
            },
          };
        }
      );

      return { previousComments };
    },
    onError: (err, newComment, context) => {
      // Roll back optimistic updates
      if (context?.previousComments) {
        context.previousComments.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: (_, __, { taskId }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.comments(taskId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.detail(taskId),
      });
    },
  });
}
