import React, { lazy } from 'react';
import { Loading } from '@/components/ui/Loading';

// Lazy load heavy components
export const LazyTaskStatusChart = lazy(() =>
  import('@/components/TaskStatusChart').then(module => ({
    default: module.TaskStatusChart,
  }))
);

export const LazyUserProductivityChart = lazy(() =>
  import('@/components/UserProductivityChart').then(module => ({
    default: module.UserProductivityChart,
  }))
);

export const LazyTaskComments = lazy(() => import('@/components/TaskComments'));

export const LazyProjectMemberManagement = lazy(() =>
  import('@/components/ProjectMemberManagement').then(module => ({
    default: module.ProjectMemberManagement,
  }))
);

export const LazyDateRangePicker = lazy(() =>
  import('@/components/DateRangePicker').then(module => ({
    default: module.DateRangePicker,
  }))
);

// HOC for lazy components with loading fallback
export function withLazyLoading<T extends object>(
  LazyComponent: React.LazyExoticComponent<React.ComponentType<T>>
) {
  return function LazyWrapper(props: T) {
    return (
      <React.Suspense fallback={<Loading />}>
        <LazyComponent {...props} />
      </React.Suspense>
    );
  };
}

// Pre-configured lazy components with loading states
export const TaskStatusChartLazy = withLazyLoading(LazyTaskStatusChart);
export const UserProductivityChartLazy = withLazyLoading(
  LazyUserProductivityChart
);
export const TaskCommentsLazy = withLazyLoading(LazyTaskComments);
export const ProjectMemberManagementLazy = withLazyLoading(
  LazyProjectMemberManagement
);
export const DateRangePickerLazy = withLazyLoading(LazyDateRangePicker);
