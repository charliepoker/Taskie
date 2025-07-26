'use client';

import { Card, Typography, Empty, Table, Progress, Tag } from 'antd';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Bar, Radar } from 'react-chartjs-2';
import {
  UserProductivityResponse,
  UserProductivityMetrics,
} from '@/services/analyticsService';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title: AntTitle, Text } = Typography;

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler
);

interface UserProductivityChartProps {
  data: UserProductivityResponse;
  loading?: boolean;
  className?: string;
}

export function UserProductivityChart({
  data,
  loading = false,
  className,
}: UserProductivityChartProps) {
  if (loading) {
    return (
      <Card className={className} loading={true}>
        <div className='h-96' />
      </Card>
    );
  }

  if (!data || !data.users || data.users.length === 0) {
    return (
      <Card className={className}>
        <Empty description='No user productivity data available' />
      </Card>
    );
  }

  const { users, summary } = data;

  // Prepare data for completion rate bar chart
  const completionRateData = {
    labels: users.map(user => user.userName),
    datasets: [
      {
        label: 'Completion Rate (%)',
        data: users.map(user => user.completionRate),
        backgroundColor: users.map(user => {
          if (user.completionRate >= 80) return '#52C41A'; // Green
          if (user.completionRate >= 60) return '#FA8C16'; // Orange
          return '#FF4D4F'; // Red
        }),
        borderColor: users.map(user => {
          if (user.completionRate >= 80) return '#52C41A';
          if (user.completionRate >= 60) return '#FA8C16';
          return '#FF4D4F';
        }),
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const completionRateOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `Completion Rate: ${context.parsed.y.toFixed(1)}%`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Completion Rate (%)',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Users',
        },
      },
    },
  };

  // Prepare data for tasks comparison chart
  const tasksComparisonData = {
    labels: users.map(user => user.userName),
    datasets: [
      {
        label: 'Tasks Created',
        data: users.map(user => user.tasksCreated),
        backgroundColor: '#1890FF',
        borderColor: '#1890FF',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Tasks Completed',
        data: users.map(user => user.tasksCompleted),
        backgroundColor: '#52C41A',
        borderColor: '#52C41A',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Tasks In Progress',
        data: users.map(user => user.tasksInProgress),
        backgroundColor: '#FA8C16',
        borderColor: '#FA8C16',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const tasksComparisonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Tasks',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Users',
        },
      },
    },
  };

  // Prepare radar chart data for top performers
  const topPerformers = users
    .sort((a, b) => b.completionRate - a.completionRate)
    .slice(0, 3);

  const radarData = {
    labels: [
      'Completion Rate',
      'Tasks Created',
      'Tasks Completed',
      'Projects Involved',
      'Comments',
    ],
    datasets: topPerformers.map((user, index) => {
      const colors = ['#1890FF', '#52C41A', '#FA8C16'];
      const color = colors[index];

      return {
        label: user.userName,
        data: [
          user.completionRate,
          Math.min(user.tasksCreated * 10, 100), // Scale to 0-100
          Math.min(user.tasksCompleted * 10, 100), // Scale to 0-100
          Math.min(user.projectsInvolved * 20, 100), // Scale to 0-100
          Math.min(user.commentsCount * 5, 100), // Scale to 0-100
        ],
        backgroundColor: color + '20',
        borderColor: color,
        borderWidth: 2,
        pointBackgroundColor: color,
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: color,
      };
    }),
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  // Table columns for detailed view
  const columns = [
    {
      title: 'User',
      dataIndex: 'userName',
      key: 'userName',
      render: (text: string, record: UserProductivityMetrics) => (
        <div>
          <div className='font-medium'>{text}</div>
          <div className='text-sm text-gray-500'>{record.email}</div>
        </div>
      ),
    },
    {
      title: 'Completion Rate',
      dataIndex: 'completionRate',
      key: 'completionRate',
      render: (rate: number) => (
        <div className='w-24'>
          <Progress
            percent={rate}
            size='small'
            status={
              rate >= 80 ? 'success' : rate >= 60 ? 'normal' : 'exception'
            }
            format={percent => `${percent?.toFixed(1)}%`}
          />
        </div>
      ),
      sorter: (a: UserProductivityMetrics, b: UserProductivityMetrics) =>
        a.completionRate - b.completionRate,
    },
    {
      title: 'Tasks',
      key: 'tasks',
      render: (record: UserProductivityMetrics) => (
        <div className='space-y-1'>
          <div className='flex justify-between'>
            <span className='text-sm'>Created:</span>
            <Tag color='blue'>{record.tasksCreated}</Tag>
          </div>
          <div className='flex justify-between'>
            <span className='text-sm'>Completed:</span>
            <Tag color='green'>{record.tasksCompleted}</Tag>
          </div>
          <div className='flex justify-between'>
            <span className='text-sm'>In Progress:</span>
            <Tag color='orange'>{record.tasksInProgress}</Tag>
          </div>
        </div>
      ),
    },
    {
      title: 'Avg. Completion Time',
      dataIndex: 'averageCompletionTime',
      key: 'averageCompletionTime',
      render: (time: number) => (
        <span>{time > 0 ? `${time.toFixed(1)}h` : 'N/A'}</span>
      ),
      sorter: (a: UserProductivityMetrics, b: UserProductivityMetrics) =>
        a.averageCompletionTime - b.averageCompletionTime,
    },
    {
      title: 'Projects',
      dataIndex: 'projectsInvolved',
      key: 'projectsInvolved',
      render: (count: number) => <Tag color='purple'>{count}</Tag>,
      sorter: (a: UserProductivityMetrics, b: UserProductivityMetrics) =>
        a.projectsInvolved - b.projectsInvolved,
    },
    {
      title: 'Comments',
      dataIndex: 'commentsCount',
      key: 'commentsCount',
      render: (count: number) => <Tag color='cyan'>{count}</Tag>,
      sorter: (a: UserProductivityMetrics, b: UserProductivityMetrics) =>
        a.commentsCount - b.commentsCount,
    },
    {
      title: 'Last Activity',
      dataIndex: 'lastActivity',
      key: 'lastActivity',
      render: (date: string | null) => (
        <span className='text-sm'>
          {date ? dayjs(date).fromNow() : 'No activity'}
        </span>
      ),
      sorter: (a: UserProductivityMetrics, b: UserProductivityMetrics) => {
        if (!a.lastActivity && !b.lastActivity) return 0;
        if (!a.lastActivity) return 1;
        if (!b.lastActivity) return -1;
        return (
          dayjs(b.lastActivity).valueOf() - dayjs(a.lastActivity).valueOf()
        );
      },
    },
  ];

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <div className='text-center'>
            <div className='text-2xl font-bold text-blue-600'>
              {summary.totalUsers}
            </div>
            <div className='text-sm text-gray-500'>Total Users</div>
          </div>
        </Card>
        <Card>
          <div className='text-center'>
            <div className='text-2xl font-bold text-green-600'>
              {summary.averageCompletionRate.toFixed(1)}%
            </div>
            <div className='text-sm text-gray-500'>Avg. Completion Rate</div>
          </div>
        </Card>
        <Card>
          <div className='text-center'>
            <div className='text-lg font-bold text-purple-600 truncate'>
              {summary.mostProductiveUser || 'N/A'}
            </div>
            <div className='text-sm text-gray-500'>Most Productive</div>
          </div>
        </Card>
        <Card>
          <div className='text-center'>
            <div className='text-lg font-bold text-orange-600 truncate'>
              {summary.leastProductiveUser || 'N/A'}
            </div>
            <div className='text-sm text-gray-500'>Needs Support</div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Completion Rate Chart */}
        <Card>
          <AntTitle level={4} className='mb-4'>
            Completion Rate by User
          </AntTitle>
          <div className='h-64'>
            <Bar data={completionRateData} options={completionRateOptions} />
          </div>
        </Card>

        {/* Tasks Comparison Chart */}
        <Card>
          <AntTitle level={4} className='mb-4'>
            Task Statistics by User
          </AntTitle>
          <div className='h-64'>
            <Bar data={tasksComparisonData} options={tasksComparisonOptions} />
          </div>
        </Card>
      </div>

      {/* Radar Chart for Top Performers */}
      {topPerformers.length > 0 && (
        <Card>
          <AntTitle level={4} className='mb-4'>
            Top Performers Comparison
          </AntTitle>
          <div className='h-80'>
            <Radar data={radarData} options={radarOptions} />
          </div>
        </Card>
      )}

      {/* Detailed Table */}
      <Card>
        <AntTitle level={4} className='mb-4'>
          Detailed User Metrics
        </AntTitle>
        <Table
          columns={columns}
          dataSource={users}
          rowKey='userId'
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} users`,
          }}
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  );
}
