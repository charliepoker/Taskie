'use client';

import { Spin } from 'antd';

interface RouteLoadingProps {
  message?: string;
  size?: 'small' | 'default' | 'large';
}

export function RouteLoading({
  message = 'Loading...',
  size = 'large',
}: RouteLoadingProps) {
  return (
    <div className='flex flex-col items-center justify-center min-h-64 py-12'>
      <Spin size={size} />
      <p className='mt-4 text-gray-600'>{message}</p>
    </div>
  );
}

export function PageLoading() {
  return (
    <div className='flex items-center justify-center min-h-screen'>
      <div className='text-center'>
        <Spin size='large' />
        <p className='mt-4 text-gray-600'>Loading page...</p>
      </div>
    </div>
  );
}
