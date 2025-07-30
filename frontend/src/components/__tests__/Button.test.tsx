import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button } from '../ui/Button';
import { PlusOutlined, ArrowRightOutlined } from '@ant-design/icons';

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);

    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it('renders with primary variant', () => {
    render(<Button variant='primary'>Primary Button</Button>);

    const button = screen.getByRole('button', { name: /primary button/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('ant-btn-primary');
  });

  it('renders with secondary variant', () => {
    render(<Button variant='secondary'>Secondary Button</Button>);

    const button = screen.getByRole('button', { name: /secondary button/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('ant-btn-default');
  });

  it('renders with outline variant', () => {
    render(<Button variant='outline'>Outline Button</Button>);

    const button = screen.getByRole('button', { name: /outline button/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('ant-btn-default');
  });

  it('renders with ghost variant', () => {
    render(<Button variant='ghost'>Ghost Button</Button>);

    const button = screen.getByRole('button', { name: /ghost button/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('ant-btn-text');
  });

  it('renders with link variant', () => {
    render(<Button variant='link'>Link Button</Button>);

    const button = screen.getByRole('button', { name: /link button/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('ant-btn-link');
  });

  it('renders with danger variant', () => {
    render(<Button variant='danger'>Danger Button</Button>);

    const button = screen.getByRole('button', { name: /danger button/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('ant-btn-primary');
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<Button size='sm'>Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('ant-btn-sm');

    rerender(<Button size='md'>Medium</Button>);
    expect(screen.getByRole('button')).toHaveClass('ant-btn');

    rerender(<Button size='lg'>Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('ant-btn-lg');
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByRole('button', { name: /click me/i });
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('can be disabled', () => {
    render(<Button disabled>Disabled Button</Button>);

    const button = screen.getByRole('button', { name: /disabled button/i });
    expect(button).toBeDisabled();
  });

  it('shows loading state', () => {
    render(<Button isLoading>Loading Button</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('ant-btn-loading');
  });

  it('is disabled when loading', () => {
    render(<Button isLoading>Loading Button</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('renders with left icon', () => {
    render(
      <Button leftIcon={<PlusOutlined data-testid='plus-icon' />}>
        Add Item
      </Button>
    );

    expect(screen.getByTestId('plus-icon')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /add item/i })
    ).toBeInTheDocument();
  });

  it('renders with right icon', () => {
    render(
      <Button rightIcon={<ArrowRightOutlined data-testid='arrow-icon' />}>
        Next
      </Button>
    );

    expect(screen.getByTestId('arrow-icon')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  it('hides right icon when loading', () => {
    render(
      <Button
        isLoading
        rightIcon={<ArrowRightOutlined data-testid='arrow-icon' />}
      >
        Next
      </Button>
    );

    expect(screen.queryByTestId('arrow-icon')).not.toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveClass('ant-btn-loading');
  });

  it('applies custom className', () => {
    render(<Button className='custom-class'>Custom Button</Button>);

    const button = screen.getByRole('button', { name: /custom button/i });
    expect(button).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref Button</Button>);

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('passes through additional props', () => {
    render(
      <Button data-testid='custom-button' aria-label='Custom aria label'>
        Custom Props
      </Button>
    );

    const button = screen.getByTestId('custom-button');
    expect(button).toHaveAttribute('aria-label', 'Custom aria label');
  });

  it('prevents click when disabled', () => {
    const handleClick = jest.fn();
    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>
    );

    const button = screen.getByRole('button', { name: /disabled/i });
    fireEvent.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('prevents click when loading', () => {
    const handleClick = jest.fn();
    render(
      <Button isLoading onClick={handleClick}>
        Loading
      </Button>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('has correct display name', () => {
    expect(Button.displayName).toBe('Button');
  });
});
