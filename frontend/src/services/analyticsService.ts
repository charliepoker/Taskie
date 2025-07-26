import axios from 'axios';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Types for analytics data
export interface DashboardMetrics {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  activeUsers: number;
  tasksByStatus: TaskStatusDistribution[];
  tasksByPriority: TaskPriorityDistribution[];
  recentActivity: RecentActivity[];
}

export interface TaskStatusDistribution {
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
  count: number;
  percentage: number;
}

export interface TaskPriorityDistribution {
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  count: number;
  percentage: number;
}

export interface RecentActivity {
  id: string;
  type: 'task_created' | 'task_updated' | 'task_completed' | 'project_created';
  title: string;
  description: string;
  userId: string;
  userName: string;
  projectId?: string;
  projectName?: string;
  createdAt: string;
}

export interface TasksByStatusResponse {
  totalTasks: number;
  distribution: TaskStatusDistribution[];
  trends: TaskStatusTrend[];
}

export interface TaskStatusTrend {
  date: string;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
  count: number;
}

export interface UserProductivityMetrics {
  userId: string;
  userName: string;
  email: string;
  tasksCreated: number;
  tasksCompleted: number;
  tasksInProgress: number;
  averageCompletionTime: number;
  completionRate: number;
  projectsInvolved: number;
  commentsCount: number;
  lastActivity: string | null;
}

export interface UserProductivityResponse {
  users: UserProductivityMetrics[];
  summary: {
    totalUsers: number;
    averageCompletionRate: number;
    mostProductiveUser: string;
    leastProductiveUser: string;
  };
}

export interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
}

export interface AnalyticsResponse<T> {
  success: boolean;
  data: T;
  meta: {
    dateRange: DateRangeFilter | null;
    generatedAt: string;
  };
}

class AnalyticsService {
  private getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get dashboard metrics with aggregated data
   */
  async getDashboardMetrics(
    dateRange?: DateRangeFilter
  ): Promise<DashboardMetrics> {
    try {
      const params = new URLSearchParams();
      if (dateRange?.startDate) {
        params.append('startDate', dateRange.startDate);
      }
      if (dateRange?.endDate) {
        params.append('endDate', dateRange.endDate);
      }

      const response = await axios.get<AnalyticsResponse<DashboardMetrics>>(
        `${API_BASE_URL}/analytics/dashboard?${params.toString()}`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.data.success) {
        throw new Error('Failed to fetch dashboard metrics');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      throw error;
    }
  }

  /**
   * Get tasks distribution by status with statistics and trends
   */
  async getTasksByStatus(
    dateRange?: DateRangeFilter
  ): Promise<TasksByStatusResponse> {
    try {
      const params = new URLSearchParams();
      if (dateRange?.startDate) {
        params.append('startDate', dateRange.startDate);
      }
      if (dateRange?.endDate) {
        params.append('endDate', dateRange.endDate);
      }

      const response = await axios.get<
        AnalyticsResponse<TasksByStatusResponse>
      >(`${API_BASE_URL}/analytics/tasks-by-status?${params.toString()}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.data.success) {
        throw new Error('Failed to fetch tasks by status');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error fetching tasks by status:', error);
      throw error;
    }
  }

  /**
   * Get user productivity metrics with performance data
   */
  async getUserProductivity(
    dateRange?: DateRangeFilter
  ): Promise<UserProductivityResponse> {
    try {
      const params = new URLSearchParams();
      if (dateRange?.startDate) {
        params.append('startDate', dateRange.startDate);
      }
      if (dateRange?.endDate) {
        params.append('endDate', dateRange.endDate);
      }

      const response = await axios.get<
        AnalyticsResponse<UserProductivityResponse>
      >(`${API_BASE_URL}/analytics/user-productivity?${params.toString()}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.data.success) {
        throw new Error('Failed to fetch user productivity metrics');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error fetching user productivity metrics:', error);
      throw error;
    }
  }

  /**
   * Clear analytics cache
   */
  async clearCache(): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/analytics/cache`, {
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      console.error('Error clearing analytics cache:', error);
      throw error;
    }
  }
}

export const analyticsService = new AnalyticsService();
