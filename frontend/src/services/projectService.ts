import axios from 'axios';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Types
export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  userId: string;
  projectId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  joinedAt: string;
  user: User;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner: User;
  members: ProjectMember[];
  _count: {
    tasks: number;
    members: number;
  };
}

export interface GetProjectsParams {
  page?: number;
  limit?: number;
  search?: string;
  ownerId?: string;
}

export interface GetProjectsResponse {
  success: boolean;
  data: Project[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface GetProjectResponse {
  success: boolean;
  data: {
    project: Project;
  };
}

export interface CreateProjectData {
  name: string;
  description?: string | null;
  color?: string;
}

export interface CreateProjectResponse {
  success: boolean;
  message: string;
  data: {
    project: Project;
  };
}

export interface UpdateProjectData {
  name?: string;
  description?: string | null;
  color?: string;
}

export interface UpdateProjectResponse {
  success: boolean;
  message: string;
  data: {
    project: Project;
  };
}

export interface AddMemberData {
  userId: string;
  role: 'ADMIN' | 'MEMBER' | 'VIEWER';
}

export interface AddMemberResponse {
  success: boolean;
  message: string;
  data: {
    member: ProjectMember;
  };
}

export interface UpdateMemberData {
  role: 'ADMIN' | 'MEMBER' | 'VIEWER';
}

export interface UpdateMemberResponse {
  success: boolean;
  message: string;
  data: {
    member: ProjectMember;
  };
}

export interface ApiError {
  success: false;
  error: string;
  code: string;
}

// Create axios instance with interceptors
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
apiClient.interceptors.request.use(async config => {
  if (typeof window !== 'undefined') {
    // Try to get token from NextAuth session
    try {
      const { getSession } = await import('next-auth/react');
      const session = await getSession();
      if (session?.accessToken) {
        config.headers.Authorization = `Bearer ${session.accessToken}`;
      }
    } catch (error) {
      console.error('Failed to get session token:', error);
    }
  }
  return config;
});

// Handle token refresh on 401
apiClient.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Handle token refresh or redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export class ProjectService {
  /**
   * Get paginated list of projects
   */
  static async getProjects(
    params: GetProjectsParams = {}
  ): Promise<GetProjectsResponse> {
    try {
      const response = await apiClient.get<GetProjectsResponse>('/projects', {
        params,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data as ApiError;
      }
      throw new Error('Failed to fetch projects');
    }
  }

  /**
   * Get project by ID
   */
  static async getProjectById(id: string): Promise<GetProjectResponse> {
    try {
      const response = await apiClient.get<GetProjectResponse>(
        `/projects/${id}`
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data as ApiError;
      }
      throw new Error('Failed to fetch project');
    }
  }

  /**
   * Create a new project
   */
  static async createProject(
    data: CreateProjectData
  ): Promise<CreateProjectResponse> {
    try {
      const response = await apiClient.post<CreateProjectResponse>(
        '/projects',
        data
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data as ApiError;
      }
      throw new Error('Failed to create project');
    }
  }

  /**
   * Update project
   */
  static async updateProject(
    id: string,
    data: UpdateProjectData
  ): Promise<UpdateProjectResponse> {
    try {
      const response = await apiClient.put<UpdateProjectResponse>(
        `/projects/${id}`,
        data
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data as ApiError;
      }
      throw new Error('Failed to update project');
    }
  }

  /**
   * Delete project
   */
  static async deleteProject(
    id: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete(`/projects/${id}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data as ApiError;
      }
      throw new Error('Failed to delete project');
    }
  }

  /**
   * Add member to project
   */
  static async addMember(
    projectId: string,
    data: AddMemberData
  ): Promise<AddMemberResponse> {
    try {
      const response = await apiClient.post<AddMemberResponse>(
        `/projects/${projectId}/members`,
        data
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data as ApiError;
      }
      throw new Error('Failed to add member');
    }
  }

  /**
   * Update member role
   */
  static async updateMember(
    projectId: string,
    userId: string,
    data: UpdateMemberData
  ): Promise<UpdateMemberResponse> {
    try {
      const response = await apiClient.put<UpdateMemberResponse>(
        `/projects/${projectId}/members/${userId}`,
        data
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data as ApiError;
      }
      throw new Error('Failed to update member');
    }
  }

  /**
   * Remove member from project
   */
  static async removeMember(
    projectId: string,
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete(
        `/projects/${projectId}/members/${userId}`
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data as ApiError;
      }
      throw new Error('Failed to remove member');
    }
  }
}
