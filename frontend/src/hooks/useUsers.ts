import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  UserService,
  type GetUsersParams,
  type UpdateUserData,
} from '@/services/userService';
import { queryKeys } from '@/lib/react-query';

// Query hooks
export function useUsers(params: GetUsersParams = {}) {
  return useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => UserService.getUsers(params),
    enabled: true,
  });
}

export function useUser(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => UserService.getUserById(id),
    enabled: enabled && !!id,
  });
}

// Mutation hooks
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserData }) =>
      UserService.updateUser(id, data),
    onSuccess: (response, { id }) => {
      // Update the user detail cache
      queryClient.setQueryData(queryKeys.users.detail(id), response);

      // Invalidate user lists to refetch with updated data
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
    onError: error => {
      console.error('Failed to update user:', error);
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => UserService.deleteUser(id),
    onSuccess: (_, id) => {
      // Remove the user from cache
      queryClient.removeQueries({ queryKey: queryKeys.users.detail(id) });

      // Invalidate user lists to refetch without deleted user
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
    onError: error => {
      console.error('Failed to delete user:', error);
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => UserService.uploadAvatar(file),
    onSuccess: () => {
      // Invalidate current user and user lists
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.currentUser });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
    onError: error => {
      console.error('Failed to upload avatar:', error);
    },
  });
}
