'use client';

import {
  Card,
  Typography,
  Space,
  Statistic,
  Button,
  Tabs,
  message,
  Spin,
} from 'antd';
import {
  ProjectOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  TeamOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { RequireAuth } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { TaskStatusChart } from '@/components/TaskStatusChart';
import { UserProductivityChart } from '@/components/UserProductivityChart';
import { DateRangePicker, DateRange } from '@/components/DateRangePicker';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { analyticsService } from '@/services/analyticsService';
import { useState } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { TabPane } = Tabs;

export default function DashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Fetch dashboard metrics
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError,
  } = useQuery({
    queryKey: ['dashboard-metrics', dateRange],
    queryFn: () => analyticsService.getDashboardMetrics(dateRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch tasks by status
  const {
    data: tasksStatusData,
    isLoading: tasksStatusLoading,
    error: tasksStatusError,
  } = useQuery({
    queryKey: ['tasks-by-status', dateRange],
    queryFn: () => analyticsService.getTasksByStatus(dateRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch user productivity
  const {
    data: productivityData,
    isLoading: productivityLoading,
    error: productivityError,
  } = useQuery({
    queryKey: ['user-productivity', dateRange],
    queryFn: () => analyticsService.getUserProductivity(dateRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleRefresh = async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      await queryClient.invalidateQueries({ queryKey: ['tasks-by-status'] });
      await queryClient.invalidateQueries({ queryKey: ['user-productivity'] });
      message.success('Dashboard data refreshed successfully');
    } catch (error) {
      message.error('Failed to refresh dashboard data');
    }
  };

  const handleClearCache = async () => {
    try {
      await analyticsService.clearCache();
      await handleRefresh();
      message.success('Analytics cache cleared and data refreshed');
    } catch (error) {
      message.error('Failed to clear analytics cache');
    }
  };

  const formatDateRange = (range: DateRange | undefined) => {
    if (!range?.startDate || !range?.endDate) return 'All Time';
    return `${dayjs(range.startDate).format('MMM D, YYYY')} - ${dayjs(range.endDate).format('MMM D, YYYY')}`;
  };

  return (
    <RequireAuth>
      <DashboardLayout>
        <div className='p-8'>
          <div className='max-w-7xl mx-auto'>
            {/* Header */}
            <div className='mb-8'>
              <div className='flex justify-between items-start'>
                <div>
                  <Title level={1}>Analytics Dashboard</Title>
                  <Text className='text-gray-600'>
                    Welcome back, {user?.firstName} {user?.lastName}! Here's
                    your team's performance overview.
                  </Text>
                </div>
                <div className='flex gap-2'>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleRefresh}
                    loading={
                      dashboardLoading ||
                      tasksStatusLoading ||
                      productivityLoading
                    }
                  >
                    Refresh
                  </Button>
                  <Button onClick={handleClearCache}>Clear Cache</Button>
                </div>
              </div>

              {/* Date Range Filter */}
              <div className='mt-4 flex items-center gap-4'>
                <Text strong>Date Range:</Text>
                <DateRangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  className='w-80'
                />
                <Text className='text-gray-500'>
                  {formatDateRange(dateRange)}
                </Text>
              </div>
            </div>

            {/* Error Handling */}
            {(dashboardError || tasksStatusError || productivityError) && (
              <Card className='mb-6 border-red-200 bg-red-50'>
                <Text type='danger'>
                  Failed to load some dashboard data. Please try refreshing the
                  page.
                </Text>
              </Card>
            )}

            {/* Overview Cards */}
            {dashboardData && (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8'>
                <Card>
                  <Statistic
                    title='Total Projects'
                    value={dashboardData.totalProjects}
                    prefix={<ProjectOutlined className='text-blue-600' />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
                <Card>
                  <Statistic
                    title='Total Tasks'
                    value={dashboardData.totalTasks}
                    prefix={<CheckCircleOutlined className='text-green-600' />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
                <Card>
                  <Statistic
                    title='Completed Tasks'
                    value={dashboardData.completedTasks}
                    prefix={<CheckCircleOutlined className='text-green-600' />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
                <Card>
                  <Statistic
                    title='Overdue Tasks'
                    value={dashboardData.overdueTasks}
                    prefix={
                      <ExclamationCircleOutlined className='text-red-600' />
                    }
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Card>
                <Card>
                  <Statistic
                    title='Active Users'
                    value={dashboardData.activeUsers}
                    prefix={<TeamOutlined className='text-purple-600' />}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </div>
            )}

            {/* Main Content Tabs */}
            <Tabs defaultActiveKey='overview' size='large'>
              <TabPane tab='Overview' key='overview'>
                <div className='space-y-6'>
                  {/* Task Status Charts */}
                  <TaskStatusChart
                    distribution={tasksStatusData?.distribution || []}
                    trends={tasksStatusData?.trends}
                    loading={tasksStatusLoading}
                  />

                  {/* Recent Activity */}
                  {dashboardData?.recentActivity &&
                    dashboardData.recentActivity.length > 0 && (
                      <Card>
                        <Title level={4} className='mb-4'>
                          Recent Activity
                        </Title>
                        <div className='space-y-3'>
                          {dashboardData.recentActivity
                            .slice(0, 10)
                            .map(activity => (
                              <div
                                key={activity.id}
                                className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
                              >
                                <div className='flex-1'>
                                  <div className='font-medium'>
                                    {activity.title}
                                  </div>
                                  <div className='text-sm text-gray-600'>
                                    {activity.description}
                                  </div>
                                  <div className='text-xs text-gray-500 mt-1'>
                                    by {activity.userName} •{' '}
                                    {dayjs(activity.createdAt).fromNow()}
                                  </div>
                                </div>
                                {activity.projectName && (
                                  <div className='text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded'>
                                    {activity.projectName}
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      </Card>
                    )}
                </div>
              </TabPane>

              <TabPane tab='User Productivity' key='productivity'>
                {productivityData ? (
                  <UserProductivityChart
                    data={productivityData}
                    loading={productivityLoading}
                  />
                ) : (
                  <Card>
                    <div className='flex justify-center items-center h-64'>
                      <Spin size='large' />
                    </div>
                  </Card>
                )}
              </TabPane>

              <TabPane tab='Task Analysis' key='tasks'>
                <div className='space-y-6'>
                  <TaskStatusChart
                    distribution={tasksStatusData?.distribution || []}
                    trends={tasksStatusData?.trends}
                    loading={tasksStatusLoading}
                  />

                  {/* Task Priority Distribution */}
                  {dashboardData?.tasksByPriority &&
                    dashboardData.tasksByPriority.length > 0 && (
                      <Card>
                        <Title level={4} className='mb-4'>
                          Task Priority Distribution
                        </Title>
                        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                          {dashboardData.tasksByPriority.map(priority => (
                            <div
                              key={priority.priority}
                              className='text-center'
                            >
                              <div className='text-2xl font-bold mb-2'>
                                {priority.count}
                              </div>
                              <div className='text-sm text-gray-600 mb-1'>
                                {priority.priority.replace('_', ' ')}
                              </div>
                              <div className='text-xs text-gray-500'>
                                {priority.percentage.toFixed(1)}%
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                </div>
              </TabPane>
            </Tabs>
          </div>
        </div>
      </DashboardLayout>
    </RequireAuth>
  );
}
