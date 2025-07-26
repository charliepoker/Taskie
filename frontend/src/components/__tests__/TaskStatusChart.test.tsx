import { render, screen } from '@testing-library/react';
import { TaskStatusChart } from '../TaskStatusChart';
import { TaskStatusDistribution } from '@/services/analyticsService';

// Mock Chart.js
jest.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid='bar-chart'>Bar Chart</div>,
  Doughnut: () => <div data-testid='doughnut-chart'>Doughnut Chart</div>,
  Line: () => <div data-testid='line-chart'>Line Chart</div>,
}));

const mockDistribution: TaskStatusDistribution[] = [
  { status: 'TODO', count: 5, percentage: 25 },
  { status: 'IN_PROGRESS', count: 8, percentage: 40 },
  { status: 'IN_REVIEW', count: 3, percentage: 15 },
  { status: 'DONE', count: 4, percentage: 20 },
];

describe('TaskStatusChart', () => {
  it('renders loading state correctly', () => {
    render(<TaskStatusChart distribution={[]} loading={true} />);

    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('renders empty state when no data', () => {
    render(<TaskStatusChart distribution={[]} />);

    expect(screen.getByText('No task data available')).toBeInTheDocument();
  });

  it('renders charts when data is provided', () => {
    render(<TaskStatusChart distribution={mockDistribution} />);

    expect(screen.getByText('Task Distribution')).toBeInTheDocument();
    expect(screen.getByText('Task Count by Status')).toBeInTheDocument();
    expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('renders trend chart when trends data is provided', () => {
    const mockTrends = [
      { date: '2024-01-01', status: 'TODO' as const, count: 2 },
      { date: '2024-01-01', status: 'DONE' as const, count: 1 },
    ];

    render(
      <TaskStatusChart distribution={mockDistribution} trends={mockTrends} />
    );

    expect(screen.getByText('Task Status Trends')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });
});
