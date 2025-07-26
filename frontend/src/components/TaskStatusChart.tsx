'use client';

import { Card, Typography, Empty } from 'antd';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  TaskStatusDistribution,
  TaskStatusTrend,
} from '@/services/analyticsService';

const { Title: AntTitle } = Typography;

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement
);

interface TaskStatusChartProps {
  distribution: TaskStatusDistribution[];
  trends?: TaskStatusTrend[];
  loading?: boolean;
  className?: string;
}

const STATUS_COLORS = {
  TODO: '#8C8C8C',
  IN_PROGRESS: '#1890FF',
  IN_REVIEW: '#FA8C16',
  DONE: '#52C41A',
};

const STATUS_LABELS = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
};

export function TaskStatusChart({
  distribution,
  trends,
  loading = false,
  className,
}: TaskStatusChartProps) {
  if (loading) {
    return (
      <Card className={className} loading={true}>
        <div className='h-64' />
      </Card>
    );
  }

  if (!distribution || distribution.length === 0) {
    return (
      <Card className={className}>
        <Empty description='No task data available' />
      </Card>
    );
  }

  // Prepare data for doughnut chart
  const doughnutData = {
    labels: distribution.map(item => STATUS_LABELS[item.status]),
    datasets: [
      {
        data: distribution.map(item => item.count),
        backgroundColor: distribution.map(item => STATUS_COLORS[item.status]),
        borderColor: distribution.map(item => STATUS_COLORS[item.status]),
        borderWidth: 2,
        hoverBorderWidth: 3,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const item = distribution[context.dataIndex];
            return `${context.label}: ${item.count} (${item.percentage.toFixed(1)}%)`;
          },
        },
      },
    },
  };

  // Prepare data for bar chart
  const barData = {
    labels: distribution.map(item => STATUS_LABELS[item.status]),
    datasets: [
      {
        label: 'Task Count',
        data: distribution.map(item => item.count),
        backgroundColor: distribution.map(item => STATUS_COLORS[item.status]),
        borderColor: distribution.map(item => STATUS_COLORS[item.status]),
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const item = distribution[context.dataIndex];
            return `${context.label}: ${item.count} tasks (${item.percentage.toFixed(1)}%)`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  // Prepare trend data if available
  let trendData = null;
  let trendOptions = null;

  if (trends && trends.length > 0) {
    // Group trends by date
    const trendsByDate = trends.reduce(
      (acc, trend) => {
        if (!acc[trend.date]) {
          acc[trend.date] = {};
        }
        acc[trend.date][trend.status] = trend.count;
        return acc;
      },
      {} as Record<string, Record<string, number>>
    );

    const dates = Object.keys(trendsByDate).sort();
    const statuses = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'] as const;

    trendData = {
      labels: dates,
      datasets: statuses.map(status => ({
        label: STATUS_LABELS[status],
        data: dates.map(date => trendsByDate[date][status] || 0),
        borderColor: STATUS_COLORS[status],
        backgroundColor: STATUS_COLORS[status] + '20',
        tension: 0.1,
        fill: false,
      })),
    };

    trendOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        tooltip: {
          mode: 'index' as const,
          intersect: false,
        },
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Date',
          },
        },
        y: {
          display: true,
          title: {
            display: true,
            text: 'Task Count',
          },
          beginAtZero: true,
        },
      },
      interaction: {
        mode: 'nearest' as const,
        axis: 'x' as const,
        intersect: false,
      },
    };
  }

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Distribution Charts */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Doughnut Chart */}
        <Card>
          <AntTitle level={4} className='mb-4'>
            Task Distribution
          </AntTitle>
          <div className='h-64'>
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </Card>

        {/* Bar Chart */}
        <Card>
          <AntTitle level={4} className='mb-4'>
            Task Count by Status
          </AntTitle>
          <div className='h-64'>
            <Bar data={barData} options={barOptions} />
          </div>
        </Card>
      </div>

      {/* Trend Chart */}
      {trendData && (
        <Card>
          <AntTitle level={4} className='mb-4'>
            Task Status Trends
          </AntTitle>
          <div className='h-80'>
            <Line data={trendData} options={trendOptions} />
          </div>
        </Card>
      )}
    </div>
  );
}
