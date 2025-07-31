import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TaskCard from '../TaskCard';
import { Task, TaskStatus, TaskPriority } from '../../types/task';

// Mock task data
const mockTask: Task = {
  id: '1',
  title: 'Test Task',
  description: 'This is a test task description',
  status: TaskStatus.TODO,
  priority: TaskPriority.HIGH,
  assigneeId: 'user1',
  projectId: 'project1',
  dueDate: '2024-12-31T23:59:59.000Z',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  assignee: {
    id: 'user1',
    email: 'john@example.com',
    username: 'john',
    firstName: 'John',
    lastName: 'Doe',
    avatar: null,
  },
  project: {
    id: 'project1',
    name: 'Test Project',
    description: 'Test project description',
    color: '#0D65F2',
  },
  comments: [
    {
      id: 'comment1',
      content: 'Test comment',
      taskId: '1',
      authorId: 'user1',
      author: {
        id: 'user1',
        email: 'john@example.com',
        username: 'john',
        firstName: 'John',
        lastName: 'Doe',
        avatar: null,
      },
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ],
};

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
  );
};

describe('TaskCard', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnView = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders task information correctly', () => {
    renderWithQueryClient(
      <TaskCard
        task={mockTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    );

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(
      screen.getByText('This is a test task description')
    ).toBeInTheDocument();
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // Comment count
  });

  it('displays assignee information', () => {
    renderWithQueryClient(
      <TaskCard
        task={mockTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    );

    // Check if assignee avatar/initials are displayed
    const avatar = screen.getByText('JD'); // John Doe initials
    expect(avatar).toBeInTheDocument();
  });

  it('displays due date correctly', () => {
    renderWithQueryClient(
      <TaskCard
        task={mockTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    );

    // Due date should be displayed
    expect(screen.getByText('12/31/2024')).toBeInTheDocument();
  });

  it('calls onView when card is clicked', () => {
    renderWithQueryClient(
      <TaskCard
        task={mockTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    );

    const card = screen.getByText('Test Task').closest('.task-card');
    fireEvent.click(card!);

    expect(mockOnView).toHaveBeenCalledWith(mockTask);
  });

  it('shows dropdown menu with actions', () => {
    renderWithQueryClient(
      <TaskCard
        task={mockTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    );

    // Find and click the more options button
    const moreButton = screen.getByRole('button');
    fireEvent.click(moreButton);

    // Check if dropdown items are present (they should be in the DOM after click)
    expect(screen.getByText('View Details')).toBeInTheDocument();
    expect(screen.getByText('Edit Task')).toBeInTheDocument();
    expect(screen.getByText('Delete Task')).toBeInTheDocument();
  });

  it('applies dragging styles when isDragging is true', () => {
    renderWithQueryClient(
      <TaskCard
        task={mockTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
        isDragging={true}
      />
    );

    const card = screen.getByText('Test Task').closest('.task-card');
    expect(card).toHaveClass('opacity-50', 'rotate-2', 'shadow-lg');
  });

  it('applies done styles when task status is DONE', () => {
    const doneTask = { ...mockTask, status: TaskStatus.DONE };

    renderWithQueryClient(
      <TaskCard
        task={doneTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    );

    const card = screen.getByText('Test Task').closest('.task-card');
    expect(card).toHaveClass('opacity-75');
  });

  it('handles task without assignee', () => {
    const taskWithoutAssignee = {
      ...mockTask,
      assignee: null,
      assigneeId: null,
    };

    renderWithQueryClient(
      <TaskCard
        task={taskWithoutAssignee}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    );

    // Should show default avatar
    const avatar = screen.getByRole('img');
    expect(avatar).toHaveClass('opacity-50');
  });

  it('handles task without due date', () => {
    const taskWithoutDueDate = { ...mockTask, dueDate: null };

    renderWithQueryClient(
      <TaskCard
        task={taskWithoutDueDate}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    );

    // Due date should not be displayed
    expect(screen.queryByText('12/31/2024')).not.toBeInTheDocument();
  });
});
