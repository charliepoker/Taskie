import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskFilters from '../TaskFilters';
import {
  TaskFilters as TaskFiltersType,
  TaskStatus,
  TaskPriority,
  User,
} from '../../types/task';

const mockUsers: User[] = [
  {
    id: 'user1',
    email: 'john@example.com',
    username: 'john',
    firstName: 'John',
    lastName: 'Doe',
    avatar: null,
  },
  {
    id: 'user2',
    email: 'jane@example.com',
    username: 'jane',
    firstName: 'Jane',
    lastName: 'Smith',
    avatar: null,
  },
];

describe('TaskFilters', () => {
  const mockOnFiltersChange = jest.fn();
  const defaultFilters: TaskFiltersType = {};

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all filter components', () => {
    render(
      <TaskFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        projectMembers={mockUsers}
      />
    );

    expect(screen.getByPlaceholderText('Search tasks...')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Priority')).toBeInTheDocument();
    expect(screen.getByText('Assignee')).toBeInTheDocument();
    expect(screen.getByText('Due Date Range')).toBeInTheDocument();
    expect(screen.getByText('Created Date Range')).toBeInTheDocument();
  });

  it('displays active filters count', () => {
    const filtersWithValues: TaskFiltersType = {
      search: 'test',
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
    };

    render(
      <TaskFilters
        filters={filtersWithValues}
        onFiltersChange={mockOnFiltersChange}
        projectMembers={mockUsers}
      />
    );

    expect(screen.getByText('3')).toBeInTheDocument(); // Active filters count
  });

  it('calls onFiltersChange when search input changes', async () => {
    const user = userEvent.setup();

    render(
      <TaskFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        projectMembers={mockUsers}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search tasks...');
    await user.type(searchInput, 'test search');

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      search: 'test search',
    });
  });

  it('calls onFiltersChange when status filter changes', async () => {
    const user = userEvent.setup();

    render(
      <TaskFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        projectMembers={mockUsers}
      />
    );

    // Find status select and click it
    const statusSelect = screen.getByText('Select status');
    await user.click(statusSelect);

    // Select "To Do" option
    const todoOption = screen.getByText('To Do');
    await user.click(todoOption);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      status: TaskStatus.TODO,
    });
  });

  it('calls onFiltersChange when priority filter changes', async () => {
    const user = userEvent.setup();

    render(
      <TaskFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        projectMembers={mockUsers}
      />
    );

    // Find priority select and click it
    const prioritySelect = screen.getByText('Select priority');
    await user.click(prioritySelect);

    // Select "High" option
    const highOption = screen.getByText('High');
    await user.click(highOption);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      priority: TaskPriority.HIGH,
    });
  });

  it('calls onFiltersChange when assignee filter changes', async () => {
    const user = userEvent.setup();

    render(
      <TaskFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        projectMembers={mockUsers}
      />
    );

    // Find assignee select and click it
    const assigneeSelect = screen.getByText('Select assignee');
    await user.click(assigneeSelect);

    // Select "John Doe" option
    const johnOption = screen.getByText('John Doe');
    await user.click(johnOption);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      assigneeId: 'user1',
    });
  });

  it('clears all filters when Clear All button is clicked', async () => {
    const user = userEvent.setup();
    const filtersWithValues: TaskFiltersType = {
      search: 'test',
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
    };

    render(
      <TaskFilters
        filters={filtersWithValues}
        onFiltersChange={mockOnFiltersChange}
        projectMembers={mockUsers}
      />
    );

    const clearButton = screen.getByText('Clear All');
    await user.click(clearButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({});
  });

  it('shows Clear All button only when there are active filters', () => {
    const { rerender } = render(
      <TaskFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        projectMembers={mockUsers}
      />
    );

    expect(screen.queryByText('Clear All')).not.toBeInTheDocument();

    const filtersWithValues: TaskFiltersType = {
      search: 'test',
    };

    rerender(
      <TaskFilters
        filters={filtersWithValues}
        onFiltersChange={mockOnFiltersChange}
        projectMembers={mockUsers}
      />
    );

    expect(screen.getByText('Clear All')).toBeInTheDocument();
  });

  it('displays project members in assignee dropdown', async () => {
    const user = userEvent.setup();

    render(
      <TaskFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        projectMembers={mockUsers}
      />
    );

    // Find assignee select and click it
    const assigneeSelect = screen.getByText('Select assignee');
    await user.click(assigneeSelect);

    // Check if both users are displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('handles empty project members list', () => {
    render(
      <TaskFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        projectMembers={[]}
      />
    );

    // Should still render the assignee select
    expect(screen.getByText('Select assignee')).toBeInTheDocument();
  });
});
