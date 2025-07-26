import { render, screen } from '@testing-library/react';
import { UserProductivityChart } from '../UserProductivityChart';
import { UserProductivityResponse } from '@/services/analyticsService';

// Mock Chart.js
jest.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid='bar-chart'>Bar Chart</div>,
  Radar: () => <div data-testid='radar-chart'>Radar Chart</div>,
}));

const mockData: UserProductivityResponse = {
  users: [
    {
      userId: '1',
      userName: 'John Doe',
      email: 'john@example.com',
      tasksCreated: 10,
      tasksCompleted: 8,
      tasksInProgress: 2,
      averageCompletionTime: 24.5,
      completionRate: 80,
      projectsInvolved: 3,
      commentsCount: 15,
      lastActivity: '2024-01-15T10:00:00Z',
    },
    {
      userId: '2',
      userName: 'Jane Smith',
      email: 'jane@example.com',
      tasksCreated: 8,
      tasksCompleted: 6,
      tasksInProgress: 1,
      averageCompletionTime: 18.2,
      completionRate: 75,
      projectsInvolved: 2,
      commentsCount: 12,
      lastActivity: '2024-01-14T15:30:00Z',
    },
  ],
  summary: {
    totalUsers: 2,
    averageCompletionRate: 77.5,
    mostProductiveUser: 'John Doe',
    leastProductiveUser: 'Jane Smith',
  },
};

describe('UserProductivityChart', () => {
  it('renders loading state correctly', () => {
    render(<UserProductivityChart data={mockData} loading={true} />);

    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('renders empty state when no data', () => {
    const emptyData: UserProductivityResponse = {
      users: [],
      summary: {
        totalUsers: 0,
        averageCompletionRate: 0,
        mostProductiveUser: '',
        leastProductiveUser: '',
      },
    };

    render(<UserProductivityChart data={emptyData} />);

    expect(
      screen.getByText('No user productivity data available')
    ).toBeInTheDocument();
  });

  it('renders summary cards correctly', () => {
    render(<UserProductivityChart data={mockData} />);

    expect(screen.getByText('2')).toBeInTheDocument(); // Total Users
    expect(screen.getByText('77.5%')).toBeInTheDocument(); // Avg Completion Rate
    expect(screen.getByText('John Doe')).toBeInTheDocument(); // Most Productive
    expect(screen.getByText('Jane Smith')).toBeInTheDocument(); // Least Productive
  });

  it('renders charts correctly', () => {
    render(<UserProductivityChart data={mockData} />);

    expect(screen.getByText('Completion Rate by User')).toBeInTheDocument();
    expect(screen.getByText('Task Statistics by User')).toBeInTheDocument();
    expect(screen.getAllByTestId('bar-chart')).toHaveLength(2);
  });

  it('renders radar chart for top performers', () => {
    render(<UserProductivityChart data={mockData} />);

    expect(screen.getByText('Top Performers Comparison')).toBeInTheDocument();
    expect(screen.getByTestId('radar-chart')).toBeInTheDocument();
  });

  it('renders detailed user table', () => {
    render(<UserProductivityChart data={mockData} />);

    expect(screen.getByText('Detailed User Metrics')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });
});
