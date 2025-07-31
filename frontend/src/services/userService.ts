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
  _count?: {
    projects: number;
    assignedTasks: number;
    comments: number;
  };
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'createdAt' | 'firstName' | 'lastName' | 'email';
  sortOrder?: 'asc' | 'desc';
}

export interface GetUsersResponse {
  success: boolean;
  data: User[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface GetUserResponse {
  success: boolean;
  data: {
    user: User;
  };
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  avatar?: string | null;
}

export interface UpdateUserResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
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

export class UserService {
  /**
   * Get paginated list of users
   */
  static async getUsers(
    params: GetUsersParams = {}
  ): Promise<GetUsersResponse> {
    try {
      const response = await apiClient.get<GetUsersResponse>('/users', {
        params,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data as ApiError;
      }
      throw new Error('Failed to fetch users');
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: string): Promise<GetUserResponse> {
    try {
      const response = await apiClient.get<GetUserResponse>(`/users/${id}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data as ApiError;
      }
      throw new Error('Failed to fetch user');
    }
  }

  /**
   * Update user profile
   */
  static async updateUser(
    id: string,
    data: UpdateUserData
  ): Promise<UpdateUserResponse> {
    try {
      const response = await apiClient.put<UpdateUserResponse>(
        `/users/${id}`,
        data
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data as ApiError;
      }
      throw new Error('Failed to update user');
    }
  }

  /**
   * Delete user account
   */
  static async deleteUser(
    id: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data as ApiError;
      }
      throw new Error('Failed to delete user');
    }
  }

  /**
   * Upload avatar (placeholder - would integrate with file upload service)
   */
  static async uploadAvatar(file: File): Promise<{ url: string }> {
    // This is a placeholder implementation
    // In a real app, you'd upload to a service like AWS S3, Cloudinary, etc.
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => {
        // For demo purposes, we'll use a data URL
        // In production, this would be a proper URL from your file storage service
        resolve({ url: reader.result as string });
      };
      reader.readAsDataURL(file);
    });
  }
}
