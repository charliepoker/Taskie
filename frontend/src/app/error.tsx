'use client';

import { useEffect } from 'react';
import { Button, Result } from 'antd';
import { ReloadOutlined, HomeOutlined } from '@ant-design/icons';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Error:', error);
  }, [error]);

  return (
    <div className='min-h-screen flex items-center justify-center p-8'>
      <Result
        status='error'
        title='Something went wrong!'
        subTitle='An unexpected error occurred. Please try again.'
        extra={[
          <Button
            key='retry'
            type='primary'
            icon={<ReloadOutlined />}
            onClick={reset}
          >
            Try again
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
