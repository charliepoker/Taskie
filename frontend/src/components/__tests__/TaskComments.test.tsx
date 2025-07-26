import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TaskComments from '../TaskComments';
import { taskService } from '../../services/taskService';
import { Comment } from '../../types/task';

// Mock the task service
jest.mock('../../services/taskService');
const mockTaskService = taskService as jest.Mocked<typeof taskService>;

const mockComments: Comment[] = [
  {
    id: 'comment1',
    content: 'This is a test comment',
    taskId: 'task1',
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
  {
    id: 'comment2',
    content: 'Another test comment',
    taskId: 'task1',
    authorId: 'user2',
    author: {
      id: 'user2',
      email: 'jane@example.com',
      username: 'jane',
      firstName: 'Jane',
      lastName: 'Smith',
      avatar: null,
    },
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
];

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

describe('TaskComments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTaskService.getTaskComments.mockResolvedValue({
      data: mockComments,
      meta: {
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
    });
  });

  it('renders comments correctly', async () => {
    renderWithQueryClient(<TaskComments taskId='task1' />);

    await waitFor(() => {
      expect(screen.getByText('Comments (2)')).toBeInTheDocument();
      expect(screen.getByText('This is a test comment')).toBeInTheDocument();
      expect(screen.getByText('Another test comment')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('renders comment input form', () => {
    renderWithQueryClient(<TaskComments taskId='task1' />);

    expect(
      screen.getByPlaceholderText('Add a comment... (Ctrl+Enter to submit)')
    ).toBeInTheDocument();
    expect(screen.getByText('Add Comment')).toBeInTheDocument();
  });

  it('submits new comment when Add Comment button is clicked', async () => {
    const user = userEvent.setup();
    mockTaskService.addTaskComment.mockResolvedValue({
      id: 'comment3',
      content: 'New test comment',
      taskId: 'task1',
      authorId: 'user1',
      author: {
        id: 'user1',
        email: 'john@example.com',
        username: 'john',
        firstName: 'John',
        lastName: 'Doe',
        avatar: null,
      },
      createdAt: '2024-01-03T00:00:00.000Z',
      updatedAt: '2024-01-03T00:00:00.000Z',
    });

    renderWithQueryClient(<TaskComments taskId='task1' />);

    const textarea = screen.getByPlaceholderText(
      'Add a comment... (Ctrl+Enter to submit)'
    );
    const submitButton = screen.getByText('Add Comment');

    await user.type(textarea, 'New test comment');
    await user.click(submitButton);

    expect(mockTaskService.addTaskComment).toHaveBeenCalledWith({
      content: 'New test comment',
      taskId: 'task1',
    });
  });

  it('submits comment with Ctrl+Enter keyboard shortcut', async () => {
    const user = userEvent.setup();
    mockTaskService.addTaskComment.mockResolvedValue({
      id: 'comment3',
      content: 'New test comment',
      taskId: 'task1',
      authorId: 'user1',
      author: {
        id: 'user1',
        email: 'john@example.com',
        username: 'john',
        firstName: 'John',
        lastName: 'Doe',
        avatar: null,
      },
      createdAt: '2024-01-03T00:00:00.000Z',
      updatedAt: '2024-01-03T00:00:00.000Z',
    });

    renderWithQueryClient(<TaskComments taskId='task1' />);

    const textarea = screen.getByPlaceholderText(
      'Add a comment... (Ctrl+Enter to submit)'
    );

    await user.type(textarea, 'New test comment');
    await user.keyboard('{Control>}{Enter}{/Control}');

    expect(mockTaskService.addTaskComment).toHaveBeenCalledWith({
      content: 'New test comment',
      taskId: 'task1',
    });
  });

  it('disables submit button when comment is empty', () => {
    renderWithQueryClient(<TaskComments taskId='task1' />);

    const submitButton = screen.getByText('Add Comment');
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when comment has content', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<TaskComments taskId='task1' />);

    const textarea = screen.getByPlaceholderText(
      'Add a comment... (Ctrl+Enter to submit)'
    );
    const submitButton = screen.getByText('Add Comment');

    await user.type(textarea, 'Test comment');

    expect(submitButton).not.toBeDisabled();
  });

  it('shows empty state when no comments exist', async () => {
    mockTaskService.getTaskComments.mockResolvedValue({
      data: [],
      meta: {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      },
    });

    renderWithQueryClient(<TaskComments taskId='task1' />);

    await waitFor(() => {
      expect(screen.getByText('Comments (0)')).toBeInTheDocument();
      expect(screen.getByText('No comments yet')).toBeInTheDocument();
    });
  });

  it('shows loading state while fetching comments', () => {
    mockTaskService.getTaskComments.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderWithQueryClient(<TaskComments taskId='task1' />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('shows error state when comments fail to load', async () => {
    mockTaskService.getTaskComments.mockRejectedValue(
      new Error('Failed to load')
    );

    renderWithQueryClient(<TaskComments taskId='task1' />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load comments')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  it('formats relative time correctly', async () => {
    const recentComment: Comment = {
      ...mockComments[0],
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    };

    mockTaskService.getTaskComments.mockResolvedValue({
      data: [recentComment],
      meta: {
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
    });

    renderWithQueryClient(<TaskComments taskId='task1' />);

    await waitFor(() => {
      expect(screen.getByText('5 minutes ago')).toBeInTheDocument();
    });
  });

  it('clears comment input after successful submission', async () => {
    const user = userEvent.setup();
    mockTaskService.addTaskComment.mockResolvedValue({
      id: 'comment3',
      content: 'New test comment',
      taskId: 'task1',
      authorId: 'user1',
      author: {
        id: 'user1',
        email: 'john@example.com',
        username: 'john',
        firstName: 'John',
        lastName: 'Doe',
        avatar: null,
      },
      createdAt: '2024-01-03T00:00:00.000Z',
      updatedAt: '2024-01-03T00:00:00.000Z',
    });

    renderWithQueryClient(<TaskComments taskId='task1' />);

    const textarea = screen.getByPlaceholderText(
      'Add a comment... (Ctrl+Enter to submit)'
    );
    const submitButton = screen.getByText('Add Comment');

    await user.type(textarea, 'New test comment');
    await user.click(submitButton);

    await waitFor(() => {
      expect(textarea).toHaveValue('');
    });
  });
});
