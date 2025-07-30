'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Form, Input, Alert, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { AuthLayout } from '@/components/AuthLayout';

const { Title, Text } = Typography;

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const onFinish = async (values: LoginFormData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else if (result?.ok) {
        // Refresh the session to get the latest data
        await getSession();
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title='Sign in to Taskie'
      subtitle='Welcome back! Please sign in to your account.'
    >
      {error && (
        <Alert
          message={error}
          type='error'
          showIcon
          className='mb-4'
          closable
          onClose={() => setError(null)}
        />
      )}

      <Form
        name='login'
        onFinish={onFinish}
        layout='vertical'
        size='large'
        autoComplete='off'
      >
        <Form.Item
          name='email'
          label='Email'
          rules={[
            { required: true, message: 'Please input your email!' },
            { type: 'email', message: 'Please enter a valid email!' },
          ]}
        >
          <Input
            prefix={<UserOutlined className='text-gray-400' />}
            placeholder='Enter your email'
            autoComplete='email'
          />
        </Form.Item>

        <Form.Item
          name='password'
          label='Password'
          rules={[{ required: true, message: 'Please input your password!' }]}
        >
          <Input.Password
            prefix={<LockOutlined className='text-gray-400' />}
            placeholder='Enter your password'
            autoComplete='current-password'
          />
        </Form.Item>

        <Form.Item>
          <Button
            type='primary'
            htmlType='submit'
            loading={loading}
            className='w-full bg-primary-blue hover:bg-blue-700'
            size='large'
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </Form.Item>
      </Form>

      <div className='text-center mt-6'>
        <Text className='text-gray-600'>
          Don&apos;t have an account?{' '}
          <Link
            href='/auth/register'
            className='text-primary-blue hover:text-blue-700'
          >
            Sign up here
          </Link>
        </Text>
      </div>
    </AuthLayout>
  );
}
