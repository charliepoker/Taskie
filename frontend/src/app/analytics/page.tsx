'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Spin,
  Alert,
  DatePicker,
  Button,
  Tabs,
} from 'antd';
import {
  BarChartOutlined,
  UserOutlined,
  ProjectOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { DashboardLayout } from '@/components/DashboardLayout';
import { BreadcrumbNavigation } from '@/components/BreadcrumbNavigation';
import { RouteWrapper } from '@/components/RouteWrapper';
import {
  analyticsService,
  DashboardMetrics,
} from '@/services/analyticsService';

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const dateFilter = dateRange
        ? {
            startDate: dateRange[0],
            endDate: dateRange[1],
          }
        : undefined;

      const data = await analyticsService.getDashboardMetrics(dateFilter);
      setMetrics(data);
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [dateRange]);

  const handleDateRangeChange = (dates: any) => {
    if (dates && dates.length === 2) {
      setDateRange([
        dates[0].format('YYYY-MM-DD'),
        dates[1].format('YYYY-MM-DD'),
      ]);
    } else {
      setDateRange(null);
    }
  };

  const handleRefresh = () => {
    fetchMetrics();
  };

  if (error) {
    return (
      <RouteWrapper>
        <DashboardLayout>
          <BreadcrumbNavigation />
          <div className='max-w-7xl mx-auto'>
            <Alert
              message='Error Loading Analytics'
              description={error}
              type='error'
              showIcon
              action={
                <Button size='small' onClick={handleRefresh}>
                  Retry
                </Button>
              }
            />
          </div>
        </DashboardLayout>
      </RouteWrapper>
    );
  }

  return (
    <RouteWrapper>
      <DashboardLayout>
        <div className='max-w-7xl mx-auto'>
          <BreadcrumbNavigation />

          {/* Header */}
          <div className='flex justify-between items-center mb-6'>
            <div>
              <h1 className='text-2xl font-bold text-gray-900 flex items-center'>
                <BarChartOutlined className='mr-2' />
                Analytics Dashboard
              </h1>
              <p className='text-gray-600 mt-1'>
                Welcome back, john doe! Here's your team's performance overview.
              </p>
            </div>
            <div className='flex items-center space-x-4'>
              <RangePicker
                onChange={handleDateRangeChange}
                placeholder={['Start Date', 'End Date']}
              />
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={loading}
              >
                Refresh
              </Button>
            </div>
          </div>

          <Spin spinning={loading}>
            {/* Overview Cards */}
            <Row gutter={[16, 16]} className='mb-6'>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title='Total Projects'
                    value={metrics?.totalProjects || 0}
                    prefix={<ProjectOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title='Total Tasks'
                    value={metrics?.totalTasks || 0}
                    prefix={<BarChartOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title='Completed Tasks'
                    value={metrics?.completedTasks || 0}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title='Active Users'
                    value={metrics?.activeUsers || 0}
                    prefix={<UserOutlined />}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Detailed Analytics */}
            <Card>
              <Tabs defaultActiveKey='overview'>
                <TabPane tab='Overview' key='overview'>
                  <div className='text-center py-8'>
                    <BarChartOutlined className='text-6xl text-gray-300 mb-4' />
                    <h3 className='text-lg font-medium text-gray-900 mb-2'>
                      Analytics Overview
                    </h3>
                    <p className='text-gray-500'>
                      {metrics
                        ? `Showing data for ${metrics.totalProjects} projects and ${metrics.totalTasks} tasks`
                        : 'No task data available'}
                    </p>
                  </div>
                </TabPane>
                <TabPane tab='User Productivity' key='productivity'>
                  <div className='text-center py-8'>
                    <UserOutlined className='text-6xl text-gray-300 mb-4' />
                    <h3 className='text-lg font-medium text-gray-900 mb-2'>
                      User Productivity
                    </h3>
                    <p className='text-gray-500'>
                      User productivity metrics will be displayed here
                    </p>
                  </div>
                </TabPane>
                <TabPane tab='Task Analysis' key='tasks'>
                  <div className='text-center py-8'>
                    <ClockCircleOutlined className='text-6xl text-gray-300 mb-4' />
                    <h3 className='text-lg font-medium text-gray-900 mb-2'>
                      Task Analysis
                    </h3>
                    <p className='text-gray-500'>
                      Task analysis and trends will be displayed here
                    </p>
                  </div>
                </TabPane>
              </Tabs>
            </Card>
          </Spin>
        </div>
      </DashboardLayout>
    </RouteWrapper>
  );
}
