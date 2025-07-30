'use client';

import React from 'react';
import { Spin, SpinProps } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { cn } from '@/lib/utils';

export interface LoadingProps extends Omit<SpinProps, 'size'> {
  variant?: 'spinner' | 'dots' | 'pulse';
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  overlay?: boolean;
  fullScreen?: boolean;
}

const Loading: React.FC<LoadingProps> = ({
  variant = 'spinner',
  size = 'md',
  text,
  overlay = false,
  fullScreen = false,
  className,
  ...props
}) => {
  const getSpinSize = () => {
    switch (size) {
      case 'sm':
        return 'small';
      case 'md':
        return 'default';
      case 'lg':
        return 'large';
      default:
        return 'default';
    }
  };

  const getSpinIcon = () => {
    switch (variant) {
      case 'spinner':
        return (
          <LoadingOutlined
            style={{ fontSize: size === 'sm' ? 16 : size === 'lg' ? 32 : 24 }}
            spin
          />
        );
      case 'dots':
        return undefined; // Use default Ant Design spinner
      case 'pulse':
        return (
          <div
            className={cn('animate-pulse rounded-full bg-primary-500', {
              'w-4 h-4': size === 'sm',
              'w-6 h-6': size === 'md',
              'w-8 h-8': size === 'lg',
            })}
          />
        );
      default:
        return undefined;
    }
  };

  const loadingClasses = cn(
    'flex flex-col items-center justify-center',
    {
      'fixed inset-0 bg-white bg-opacity-75 z-50': fullScreen,
      'absolute inset-0 bg-white bg-opacity-75 z-10': overlay && !fullScreen,
      'p-4': text,
      'p-2': !text,
    },
    className
  );

  if (variant === 'pulse') {
    return (
      <div className={loadingClasses}>
        {getSpinIcon()}
        {text && <p className='mt-2 text-sm text-neutral-600'>{text}</p>}
      </div>
    );
  }

  return (
    <div className={loadingClasses}>
      <Spin
        size={getSpinSize()}
        indicator={getSpinIcon()}
        tip={text}
        {...props}
      />
    </div>
  );
};

// Skeleton Loading component
export interface SkeletonProps {
  lines?: number;
  avatar?: boolean;
  title?: boolean;
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({
  lines = 3,
  avatar = false,
  title = false,
  className,
}) => {
  return (
    <div className={cn('animate-pulse', className)}>
      <div className='flex items-start space-x-4'>
        {avatar && (
          <div className='w-10 h-10 bg-neutral-200 rounded-full flex-shrink-0' />
        )}
        <div className='flex-1 space-y-2'>
          {title && <div className='h-4 bg-neutral-200 rounded w-3/4' />}
          {Array.from({ length: lines }).map((_, index) => (
            <div
              key={index}
              className={cn(
                'h-3 bg-neutral-200 rounded',
                index === lines - 1 ? 'w-2/3' : 'w-full'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Loading Overlay component
export interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  text?: string;
  className?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  children,
  text,
  className,
}) => {
  return (
    <div className={cn('relative', className)}>
      {children}
      {isLoading && <Loading overlay text={text} className='rounded-lg' />}
    </div>
  );
};

export { Loading, Skeleton, LoadingOverlay };
export default Loading;
