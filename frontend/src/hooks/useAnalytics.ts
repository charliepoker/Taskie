import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  analyticsService,
  type DateRangeFilter,
} from '@/services/analyticsService';
import { queryKeys } from '@/lib/react-query';

// Query hooks
export function useDashboardMetrics(dateRange?: DateRangeFilter) {
  return useQuery({
    queryKey: queryKeys.analytics.dashboard(dateRange),
    queryFn: () => analyticsService.getDashboardMetrics(dateRange),
    enabled: true,
    // Refresh dashboard data more frequently
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
}

export function useTasksByStatus(dateRange?: DateRangeFilter) {
  return useQuery({
    queryKey: queryKeys.analytics.tasksByStatus(dateRange),
    queryFn: () => analyticsService.getTasksByStatus(dateRange),
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUserProductivity(dateRange?: DateRangeFilter) {
  return useQuery({
    queryKey: queryKeys.analytics.userProductivity(dateRange),
    queryFn: () => analyticsService.getUserProductivity(dateRange),
    enabled: true,
    staleTime: 10 * 60 * 1000, // 10 minutes (less frequent updates for productivity data)
  });
}

// Mutation hooks
export function useClearAnalyticsCache() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => analyticsService.clearCache(),
    onSuccess: () => {
      // Invalidate all analytics queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },
    onError: error => {
      console.error('Failed to clear analytics cache:', error);
    },
  });
}

// Custom hook for real-time analytics updates
export function useAnalyticsRefresh() {
  const queryClient = useQueryClient();

  const refreshAnalytics = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
  };

  const refreshDashboard = () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.analytics.dashboard(),
    });
  };

  const refreshTasksByStatus = () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.analytics.tasksByStatus(),
    });
  };

  const refreshUserProductivity = () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.analytics.userProductivity(),
    });
  };

  return {
    refreshAnalytics,
    refreshDashboard,
    refreshTasksByStatus,
    refreshUserProductivity,
  };
}
