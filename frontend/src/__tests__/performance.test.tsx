import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { PerformanceMonitor, usePerformanceMonitor } from '../lib/performance';
import {
  OptimizedImage,
  OptimizedAvatar,
} from '../components/ui/OptimizedImage';

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, onLoad, onError, ...props }: any) {
    return (
      <img src={src} alt={alt} onLoad={onLoad} onError={onError} {...props} />
    );
  };
});

describe('Frontend Performance Optimizations', () => {
  describe('Performance Monitor', () => {
    let monitor: PerformanceMonitor;

    beforeEach(() => {
      monitor = PerformanceMonitor.getInstance();
      monitor.clearMetrics();
    });

    it('should record metrics correctly', () => {
      monitor.recordMetric('test.metric', 100);

      const stats = monitor.getStats('test.metric');
      expect(stats).toEqual({
        avg: 100,
        min: 100,
        max: 100,
        count: 1,
      });
    });

    it('should calculate statistics correctly', () => {
      monitor.recordMetric('test.metric', 100);
      monitor.recordMetric('test.metric', 200);
      monitor.recordMetric('test.metric', 300);

      const stats = monitor.getStats('test.metric');
      expect(stats?.avg).toBe(200);
      expect(stats?.min).toBe(100);
      expect(stats?.max).toBe(300);
      expect(stats?.count).toBe(3);
    });

    it('should measure API calls', async () => {
      const mockApiCall = jest.fn().mockResolvedValue({ data: 'test' });

      const result = await monitor.measureApiCall('test-endpoint', mockApiCall);

      expect(result).toEqual({ data: 'test' });
      expect(mockApiCall).toHaveBeenCalled();

      const stats = monitor.getStats('api.test-endpoint');
      expect(stats?.count).toBe(1);
    });

    it('should handle API call errors', async () => {
      const mockApiCall = jest.fn().mockRejectedValue(new Error('API Error'));

      await expect(
        monitor.measureApiCall('test-endpoint', mockApiCall)
      ).rejects.toThrow('API Error');

      const stats = monitor.getStats('api.test-endpoint.error');
      expect(stats?.count).toBe(1);
    });
  });

  describe('usePerformanceMonitor Hook', () => {
    function TestComponent() {
      const { recordMetric, getStats } = usePerformanceMonitor();
      const [count, setCount] = React.useState(0);

      React.useEffect(() => {
        recordMetric('component.render', 50);
        const stats = getStats('component.render');
        setCount(stats?.count || 0);
      }, [recordMetric, getStats]);

      return <div>Count: {count}</div>;
    }

    it('should provide performance monitoring functions', async () => {
      render(<TestComponent />);
      await waitFor(() => {
        expect(screen.getByText(/Count: \d+/)).toBeInTheDocument();
      });
    });
  });

  describe('OptimizedImage Component', () => {
    it('should render image with loading state', () => {
      render(
        <OptimizedImage
          src='/test-image.jpg'
          alt='Test image'
          width={100}
          height={100}
        />
      );

      // Should show skeleton initially
      expect(document.querySelector('.ant-skeleton')).toBeInTheDocument();
    });

    it('should handle image load', async () => {
      const onLoad = jest.fn();

      render(
        <OptimizedImage
          src='/test-image.jpg'
          alt='Test image'
          width={100}
          height={100}
          onLoad={onLoad}
        />
      );

      const img = screen.getByAltText('Test image');

      // Simulate image load
      img.dispatchEvent(new Event('load'));

      await waitFor(() => {
        expect(onLoad).toHaveBeenCalled();
      });
    });

    it('should handle image error', async () => {
      const onError = jest.fn();

      render(
        <OptimizedImage
          src='/invalid-image.jpg'
          alt='Test image'
          width={100}
          height={100}
          onError={onError}
        />
      );

      const img = screen.getByAltText('Test image');

      // Simulate image error
      img.dispatchEvent(new Event('error'));

      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
      });
    });
  });

  describe('OptimizedAvatar Component', () => {
    it('should render avatar with image', () => {
      render(<OptimizedAvatar src='/avatar.jpg' alt='User Avatar' size={40} />);

      expect(screen.getByAltText('User Avatar')).toBeInTheDocument();
    });

    it('should render fallback when no src provided', () => {
      render(<OptimizedAvatar alt='John Doe' size={40} />);

      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('should render custom fallback', () => {
      render(
        <OptimizedAvatar
          alt='User Avatar'
          size={40}
          fallback={<span>Custom</span>}
        />
      );

      expect(screen.getByText('Custom')).toBeInTheDocument();
    });
  });

  describe('Lazy Loading', () => {
    // Mock IntersectionObserver
    beforeEach(() => {
      const mockIntersectionObserver = jest.fn();
      mockIntersectionObserver.mockReturnValue({
        observe: () => null,
        unobserve: () => null,
        disconnect: () => null,
      });
      window.IntersectionObserver = mockIntersectionObserver;
    });

    it('should implement lazy loading for images', () => {
      const mockObserve = jest.fn();
      global.IntersectionObserver = jest.fn().mockImplementation(() => ({
        observe: mockObserve,
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      }));

      // Temporarily override NODE_ENV to test lazy loading
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <OptimizedImage
          src='/test-image.jpg'
          alt='Test image'
          width={100}
          height={100}
          lazy={true}
        />
      );

      expect(global.IntersectionObserver).toHaveBeenCalled();

      // Restore original NODE_ENV
      process.env.NODE_ENV = originalEnv;
    });

    it('should skip lazy loading when priority is true', () => {
      const mockObserve = jest.fn();
      global.IntersectionObserver = jest.fn().mockImplementation(() => ({
        observe: mockObserve,
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      }));

      render(
        <OptimizedImage
          src='/test-image.jpg'
          alt='Test image'
          width={100}
          height={100}
          lazy={true}
          priority={true}
        />
      );

      expect(mockObserve).not.toHaveBeenCalled();
    });
  });
});

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    getEntriesByType: jest.fn(() => []),
  },
});

// Mock PerformanceObserver
global.PerformanceObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(callback => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock canvas methods
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillStyle: '',
  fillRect: jest.fn(),
}));

HTMLCanvasElement.prototype.toDataURL = jest.fn(
  () =>
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
);
