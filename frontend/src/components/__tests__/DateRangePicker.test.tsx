import { render, screen, fireEvent } from '@testing-library/react';
import { DateRangePicker } from '../DateRangePicker';

// Mock antd DatePicker
jest.mock('antd', () => ({
  ...jest.requireActual('antd'),
  DatePicker: {
    RangePicker: ({ onChange, placeholder, presets }: any) => (
      <div data-testid='range-picker'>
        <input
          placeholder={placeholder[0]}
          data-testid='start-date'
          onChange={e =>
            onChange &&
            onChange(
              [
                { toISOString: () => '2024-01-01T00:00:00Z' },
                { toISOString: () => '2024-01-31T23:59:59Z' },
              ],
              ['2024-01-01', '2024-01-31']
            )
          }
        />
        <input placeholder={placeholder[1]} data-testid='end-date' />
        {presets && (
          <div data-testid='presets'>
            {presets.map((preset: any, index: number) => (
              <button key={index} data-testid={`preset-${index}`}>
                {preset.label}
              </button>
            ))}
          </div>
        )}
      </div>
    ),
  },
}));

describe('DateRangePicker', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders with default props', () => {
    render(<DateRangePicker onChange={mockOnChange} />);

    expect(screen.getByTestId('range-picker')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Start Date')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('End Date')).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(
      <DateRangePicker onChange={mockOnChange} placeholder={['From', 'To']} />
    );

    expect(screen.getByPlaceholderText('From')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('To')).toBeInTheDocument();
  });

  it('renders preset options', () => {
    render(<DateRangePicker onChange={mockOnChange} />);

    expect(screen.getByTestId('presets')).toBeInTheDocument();
    expect(screen.getByText('Last 7 Days')).toBeInTheDocument();
    expect(screen.getByText('Last 30 Days')).toBeInTheDocument();
    expect(screen.getByText('Last 90 Days')).toBeInTheDocument();
    expect(screen.getByText('This Month')).toBeInTheDocument();
    expect(screen.getByText('Last Month')).toBeInTheDocument();
  });

  it('calls onChange when date range is selected', () => {
    render(<DateRangePicker onChange={mockOnChange} />);

    const startDateInput = screen.getByTestId('start-date');
    fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });

    expect(mockOnChange).toHaveBeenCalledWith({
      startDate: '2024-01-01T00:00:00Z',
      endDate: '2024-01-31T23:59:59Z',
    });
  });

  it('applies custom className', () => {
    render(
      <DateRangePicker onChange={mockOnChange} className='custom-class' />
    );

    const rangePicker = screen.getByTestId('range-picker');
    expect(rangePicker).toHaveClass('custom-class');
  });
});
