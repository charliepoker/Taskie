import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ProjectService,
  type GetProjectsParams,
  type CreateProjectData,
  type UpdateProjectData,
  type AddMemberData,
  type UpdateMemberData,
} from '@/services/projectService';
import { queryKeys } from '@/lib/react-query';

// Query hooks
export function useProjects(params: GetProjectsParams = {}) {
  return useQuery({
    queryKey: queryKeys.projects.list(params),
    queryFn: () => ProjectService.getProjects(params),
    enabled: true,
  });
}

export function useProject(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id),
    queryFn: () => ProjectService.getProjectById(id),
    enabled: enabled && !!id,
  });
}

// Mutation hooks
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectData) => ProjectService.createProject(data),
    onSuccess: response => {
      // Add the new project to cache
      queryClient.setQueryData(
        queryKeys.projects.detail(response.data.project.id),
        response
      );

      // Invalidate project lists to include new project
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
    },
    onError: error => {
      console.error('Failed to create project:', error);
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectData }) =>
      ProjectService.updateProject(id, data),
    onSuccess: (response, { id }) => {
      // Update the project detail cache
      queryClient.setQueryData(queryKeys.projects.detail(id), response);

      // Invalidate project lists to refetch with updated data
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });

      // Invalidate related tasks that might show project info
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
    },
    onError: error => {
      console.error('Failed to update project:', error);
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ProjectService.deleteProject(id),
    onSuccess: (_, id) => {
      // Remove the project from cache
      queryClient.removeQueries({ queryKey: queryKeys.projects.detail(id) });

      // Invalidate project lists to refetch without deleted project
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });

      // Invalidate tasks that belonged to this project
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
    onError: error => {
      console.error('Failed to delete project:', error);
    },
  });
}

export function useAddProjectMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      data,
    }: {
      projectId: string;
      data: AddMemberData;
    }) => ProjectService.addMember(projectId, data),
    onSuccess: (_, { projectId }) => {
      // Invalidate project detail to refetch with new member
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(projectId),
      });

      // Invalidate project lists to update member counts
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
    },
    onError: error => {
      console.error('Failed to add project member:', error);
    },
  });
}

export function useUpdateProjectMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      userId,
      data,
    }: {
      projectId: string;
      userId: string;
      data: UpdateMemberData;
    }) => ProjectService.updateMember(projectId, userId, data),
    onSuccess: (_, { projectId }) => {
      // Invalidate project detail to refetch with updated member
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(projectId),
      });
    },
    onError: error => {
      console.error('Failed to update project member:', error);
    },
  });
}

export function useRemoveProjectMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      userId,
    }: {
      projectId: string;
      userId: string;
    }) => ProjectService.removeMember(projectId, userId),
    onSuccess: (_, { projectId }) => {
      // Invalidate project detail to refetch without removed member
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(projectId),
      });

      // Invalidate project lists to update member counts
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
    },
    onError: error => {
      console.error('Failed to remove project member:', error);
    },
  });
}
