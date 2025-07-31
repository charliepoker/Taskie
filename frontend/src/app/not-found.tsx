import { Button, Result } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className='min-h-screen flex items-center justify-center p-8'>
      <Result
        status='404'
        title='404'
        subTitle='Sorry, the page you visited does not exist.'
        extra={
          <Link href='/dashboard'>
            <Button type='primary' icon={<HomeOutlined />}>
              Back to Dashboard
            </Button>
          </Link>
        }
      />
    </div>
  );
}
