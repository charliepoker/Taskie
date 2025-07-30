'use client';

import { Component, ReactNode } from 'react';
import { Button, Result } from 'antd';
import { ReloadOutlined, HomeOutlined } from '@ant-design/icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Route Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className='min-h-64 flex items-center justify-center p-8'>
          <Result
            status='error'
            title='Something went wrong'
            subTitle='An unexpected error occurred while loading this page.'
            extra={[
              <Button
                key='retry'
                type='primary'
                icon={<ReloadOutlined />}
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>,
              <Button
                key='home'
                icon={<HomeOutlined />}
                onClick={() => (window.location.href = '/dashboard')}
              >
                Go to Dashboard
              </Button>,
            ]}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional component wrapper for easier use
interface ErrorBoundaryWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ErrorBoundaryWrapper({
  children,
  fallback,
}: ErrorBoundaryWrapperProps) {
  return (
    <RouteErrorBoundary fallback={fallback}>{children}</RouteErrorBoundary>
  );
}
