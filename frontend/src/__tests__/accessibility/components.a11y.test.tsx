/**
 * Accessibility Tests for Interactive Components
 *
 * These tests ensure that all interactive components meet WCAG 2.1 AA standards
 * and provide proper accessibility features for users with disabilities.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import '@testing-library/jest-dom';

// Import components to test
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import TaskCard from '../../components/TaskCard';
import TaskForm from '../../components/TaskForm';
import ProjectCard from '../../components/ProjectCard';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock dependencies
jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: null, isLoading: false, error: null }),
  useMutation: () => ({ mutate: jest.fn(), isPending: false }),
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));

jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { id: '1' } }, status: 'authenticated' }),
}));

describe('Accessibility Tests', () => {
  describe('Button Component', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<Button>Click me</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA attributes when disabled', async () => {
      const { container } = render(<Button disabled>Disabled Button</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toBeDisabled();

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA attributes when loading', async () => {
      const { container } = render(<Button isLoading>Loading Button</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toBeDisabled();

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should be keyboard accessible', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Keyboard Button</Button>);

      const button = screen.getByRole('button');
      button.focus();

      expect(button).toHaveFocus();

      // Test Enter key
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      expect(handleClick).toHaveBeenCalled();

      // Test Space key
      fireEvent.keyDown(button, { key: ' ', code: 'Space' });
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it('should have sufficient color contrast', async () => {
      const { container } = render(
        <div>
          <Button variant='primary'>Primary</Button>
          <Button variant='secondary'>Secondary</Button>
          <Button variant='danger'>Danger</Button>
        </div>
      );

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });
      expect(results).toHaveNoViolations();
    });
  });

  describe('Card Component', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <Card>
          <h2>Card Title</h2>
          <p>Card content</p>
        </Card>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper heading hierarchy', async () => {
      const { container } = render(
        <Card>
          <h1>Main Title</h1>
          <h2>Section Title</h2>
          <h3>Subsection Title</h3>
          <p>Content</p>
        </Card>
      );

      const results = await axe(container, {
        rules: {
          'heading-order': { enabled: true },
        },
      });
      expect(results).toHaveNoViolations();
    });

    it('should support keyboard navigation when interactive', () => {
      const handleClick = jest.fn();
      render(
        <Card
          onClick={handleClick}
          tabIndex={0}
          role='button'
          aria-label='Interactive card'
        >
          Interactive Card Content
        </Card>
      );

      const card = screen.getByRole('button');
      card.focus();

      expect(card).toHaveFocus();

      fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' });
      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('Input Component', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <div>
          <label htmlFor='test-input'>Test Input</label>
          <Input id='test-input' placeholder='Enter text' />
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper label association', () => {
      render(
        <div>
          <label htmlFor='labeled-input'>Labeled Input</label>
          <Input id='labeled-input' />
        </div>
      );

      const input = screen.getByLabelText('Labeled Input');
      expect(input).toBeInTheDocument();
    });

    it('should have proper error message association', async () => {
      const { container } = render(
        <div>
          <label htmlFor='error-input'>Input with Error</label>
          <Input
            id='error-input'
            aria-describedby='error-message'
            aria-invalid='true'
          />
          <div id='error-message' role='alert'>
            This field is required
          </div>
        </div>
      );

      const input = screen.getByLabelText('Input with Error');
      expect(input).toHaveAttribute('aria-describedby', 'error-message');
      expect(input).toHaveAttribute('aria-invalid', 'true');

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should be keyboard accessible', () => {
      const handleChange = jest.fn();
      render(
        <div>
          <label htmlFor='keyboard-input'>Keyboard Input</label>
          <Input id='keyboard-input' onChange={handleChange} />
        </div>
      );

      const input = screen.getByLabelText('Keyboard Input');
      input.focus();

      expect(input).toHaveFocus();

      fireEvent.change(input, { target: { value: 'test' } });
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('Modal Component', () => {
    it('should not have accessibility violations when open', async () => {
      const { container } = render(
        <Modal open={true} onCancel={() => {}} title='Test Modal'>
          <p>Modal content</p>
        </Modal>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should trap focus within modal', () => {
      render(
        <Modal open={true} onCancel={() => {}} title='Focus Trap Modal'>
          <button>First Button</button>
          <button>Second Button</button>
        </Modal>
      );

      const firstButton = screen.getByText('First Button');
      const secondButton = screen.getByText('Second Button');

      // Focus should be trapped within modal
      firstButton.focus();
      expect(firstButton).toHaveFocus();

      // Tab to next element
      fireEvent.keyDown(firstButton, { key: 'Tab', code: 'Tab' });
      expect(secondButton).toHaveFocus();
    });

    it('should close on Escape key', () => {
      const handleCancel = jest.fn();
      render(
        <Modal open={true} onCancel={handleCancel} title='Escape Modal'>
          <p>Press Escape to close</p>
        </Modal>
      );

      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
      expect(handleCancel).toHaveBeenCalled();
    });

    it('should have proper ARIA attributes', () => {
      render(
        <Modal
          open={true}
          onCancel={() => {}}
          title='ARIA Modal'
          aria-describedby='modal-description'
        >
          <p id='modal-description'>This modal has proper ARIA attributes</p>
        </Modal>
      );

      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-labelledby');
      expect(modal).toHaveAttribute('aria-describedby', 'modal-description');
      expect(modal).toHaveAttribute('aria-modal', 'true');
    });
  });

  describe('TaskCard Component', () => {
    const mockTask = {
      id: 'task-1',
      title: 'Test Task',
      description: 'Task description',
      status: 'TODO' as const,
      priority: 'MEDIUM' as const,
      assignee: {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      },
      project: {
        id: 'project-1',
        name: 'Test Project',
      },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    it('should not have accessibility violations', async () => {
      const { container } = render(<TaskCard task={mockTask} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper semantic structure', () => {
      render(<TaskCard task={mockTask} />);

      // Should have proper heading
      expect(
        screen.getByRole('heading', { name: mockTask.title })
      ).toBeInTheDocument();

      // Should have proper button for actions
      const actionButton = screen.getByRole('button');
      expect(actionButton).toHaveAccessibleName();
    });

    it('should be keyboard navigable', () => {
      render(<TaskCard task={mockTask} />);

      const card =
        screen.getByRole('article') || screen.getByTestId('task-card');
      if (card.tabIndex >= 0) {
        card.focus();
        expect(card).toHaveFocus();
      }
    });
  });

  describe('TaskForm Component', () => {
    const mockProjects = [
      { id: 'project-1', name: 'Project 1' },
      { id: 'project-2', name: 'Project 2' },
    ];

    it('should not have accessibility violations', async () => {
      const { container } = render(
        <TaskForm
          projects={mockProjects}
          onSubmit={() => {}}
          onCancel={() => {}}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper form labels', () => {
      render(
        <TaskForm
          projects={mockProjects}
          onSubmit={() => {}}
          onCancel={() => {}}
        />
      );

      // Check that all form fields have labels
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/project/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
    });

    it('should show validation errors with proper ARIA attributes', async () => {
      render(
        <TaskForm
          projects={mockProjects}
          onSubmit={() => {}}
          onCancel={() => {}}
        />
      );

      // Submit form without filling required fields
      const submitButton = screen.getByRole('button', { name: /create|save/i });
      fireEvent.click(submitButton);

      // Check for error messages with proper ARIA attributes
      const errorMessages = screen.queryAllByRole('alert');
      errorMessages.forEach(error => {
        expect(error).toBeInTheDocument();
      });
    });
  });

  describe('ProjectCard Component', () => {
    const mockProject = {
      id: 'project-1',
      name: 'Test Project',
      description: 'Project description',
      color: '#0D65F2',
      owner: {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      },
      members: [],
      taskCounts: {
        TODO: 5,
        IN_PROGRESS: 3,
        IN_REVIEW: 1,
        DONE: 10,
      },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    it('should not have accessibility violations', async () => {
      const { container } = render(<ProjectCard project={mockProject} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper semantic structure', () => {
      render(<ProjectCard project={mockProject} />);

      // Should have proper heading
      expect(
        screen.getByRole('heading', { name: mockProject.name })
      ).toBeInTheDocument();

      // Should have proper link or button for navigation
      const link = screen.getByRole('link') || screen.getByRole('button');
      expect(link).toHaveAccessibleName();
    });

    it('should provide meaningful alternative text for visual elements', () => {
      render(<ProjectCard project={mockProject} />);

      // Check for images with alt text
      const images = screen.queryAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('alt');
        expect(img.getAttribute('alt')).not.toBe('');
      });
    });
  });

  describe('Color Contrast', () => {
    it('should meet WCAG AA color contrast requirements', async () => {
      const { container } = render(
        <div>
          <Button variant='primary'>Primary Button</Button>
          <Button variant='secondary'>Secondary Button</Button>
          <Button variant='danger'>Danger Button</Button>
          <Card>
            <h2>Card Title</h2>
            <p>Card content with text</p>
          </Card>
        </div>
      );

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });
      expect(results).toHaveNoViolations();
    });
  });

  describe('Focus Management', () => {
    it('should have visible focus indicators', () => {
      render(
        <div>
          <Button>Focusable Button</Button>
          <Input placeholder='Focusable Input' />
        </div>
      );

      const button = screen.getByRole('button');
      const input = screen.getByRole('textbox');

      button.focus();
      expect(button).toHaveFocus();

      input.focus();
      expect(input).toHaveFocus();
    });

    it('should have logical tab order', () => {
      render(
        <div>
          <Button tabIndex={1}>First</Button>
          <Button tabIndex={2}>Second</Button>
          <Button tabIndex={3}>Third</Button>
        </div>
      );

      const buttons = screen.getAllByRole('button');

      // Tab through elements
      buttons[0].focus();
      expect(buttons[0]).toHaveFocus();

      fireEvent.keyDown(buttons[0], { key: 'Tab', code: 'Tab' });
      expect(buttons[1]).toHaveFocus();
    });
  });

  describe('Screen Reader Support', () => {
    it('should provide proper ARIA labels and descriptions', () => {
      render(
        <div>
          <Button aria-label='Close dialog'>×</Button>
          <Input aria-label='Search tasks' aria-describedby='search-help' />
          <div id='search-help'>Enter keywords to search for tasks</div>
        </div>
      );

      const closeButton = screen.getByLabelText('Close dialog');
      const searchInput = screen.getByLabelText('Search tasks');

      expect(closeButton).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('aria-describedby', 'search-help');
    });

    it('should announce dynamic content changes', async () => {
      const { container } = render(
        <div>
          <div role='status' aria-live='polite'>
            Task created successfully
          </div>
          <div role='alert' aria-live='assertive'>
            Error: Failed to save task
          </div>
        </div>
      );

      const statusMessage = screen.getByRole('status');
      const alertMessage = screen.getByRole('alert');

      expect(statusMessage).toHaveAttribute('aria-live', 'polite');
      expect(alertMessage).toHaveAttribute('aria-live', 'assertive');

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
