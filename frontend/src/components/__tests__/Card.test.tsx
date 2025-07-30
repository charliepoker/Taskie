import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Card } from '../ui/Card';

describe('Card Component', () => {
  it('renders with default props', () => {
    render(<Card>Card content</Card>);

    const card = screen.getByText('Card content');
    expect(card).toBeInTheDocument();
  });

  it('renders with default variant', () => {
    render(<Card data-testid='card'>Default Card</Card>);

    const card = screen.getByTestId('card');
    expect(card).toHaveClass('card-base');
  });

  it('renders with outlined variant', () => {
    render(
      <Card variant='outlined' data-testid='card'>
        Outlined Card
      </Card>
    );

    const card = screen.getByTestId('card');
    expect(card).toHaveClass('card-base');
    expect(card).toHaveClass('ant-card-bordered');
  });

  it('renders with elevated variant', () => {
    render(
      <Card variant='elevated' data-testid='card'>
        Elevated Card
      </Card>
    );

    const card = screen.getByTestId('card');
    expect(card).toHaveClass('card-base');
  });

  it('renders with filled variant', () => {
    render(
      <Card variant='filled' data-testid='card'>
        Filled Card
      </Card>
    );

    const card = screen.getByTestId('card');
    expect(card).toHaveClass('card-base');
  });

  it('renders with different padding sizes', () => {
    const { rerender } = render(
      <Card padding='none' data-testid='card'>
        No Padding
      </Card>
    );
    expect(screen.getByTestId('card')).toHaveClass('p-0');

    rerender(
      <Card padding='sm' data-testid='card'>
        Small Padding
      </Card>
    );
    expect(screen.getByTestId('card')).toHaveClass('p-3');

    rerender(
      <Card padding='md' data-testid='card'>
        Medium Padding
      </Card>
    );
    expect(screen.getByTestId('card')).toHaveClass('p-6');

    rerender(
      <Card padding='lg' data-testid='card'>
        Large Padding
      </Card>
    );
    expect(screen.getByTestId('card')).toHaveClass('p-8');
  });

  it('applies hover effect when enabled', () => {
    render(
      <Card hover data-testid='card'>
        Hover Card
      </Card>
    );

    const card = screen.getByTestId('card');
    expect(card).toHaveClass('hover:shadow-md');
    expect(card).toHaveClass('transition-shadow');
    expect(card).toHaveClass('duration-200');
  });

  it('does not apply hover effect by default', () => {
    render(<Card data-testid='card'>No Hover Card</Card>);

    const card = screen.getByTestId('card');
    expect(card).not.toHaveClass('hover:shadow-md');
  });

  it('applies custom className', () => {
    render(
      <Card className='custom-class' data-testid='card'>
        Custom Card
      </Card>
    );

    const card = screen.getByTestId('card');
    expect(card).toHaveClass('custom-class');
    expect(card).toHaveClass('card-base');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Card ref={ref}>Ref Card</Card>);

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('passes through additional props', () => {
    render(
      <Card
        data-testid='custom-card'
        aria-label='Custom aria label'
        id='card-id'
      >
        Custom Props
      </Card>
    );

    const card = screen.getByTestId('custom-card');
    expect(card).toHaveAttribute('aria-label', 'Custom aria label');
    expect(card).toHaveAttribute('id', 'card-id');
  });

  it('renders children correctly', () => {
    render(
      <Card>
        <h2>Card Title</h2>
        <p>Card description</p>
        <button>Action</button>
      </Card>
    );

    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card description')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });

  it('supports Ant Design Card props', () => {
    render(
      <Card
        title='Card Title'
        extra={<button>Extra Action</button>}
        data-testid='card'
      >
        Card Body
      </Card>
    );

    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Extra Action' })
    ).toBeInTheDocument();
    expect(screen.getByText('Card Body')).toBeInTheDocument();
  });

  it('has correct display name', () => {
    expect(Card.displayName).toBe('Card');
  });

  it('combines variant and padding classes correctly', () => {
    render(
      <Card variant='elevated' padding='lg' hover data-testid='card'>
        Combined Props
      </Card>
    );

    const card = screen.getByTestId('card');
    expect(card).toHaveClass('card-base');
    expect(card).toHaveClass('p-8');
    expect(card).toHaveClass('hover:shadow-md');
  });
});
