'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Form, Input, Alert, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { AuthLayout } from '@/components/AuthLayout';

const { Title, Text } = Typography;

interface RegisterFormData {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const onFinish = async (values: RegisterFormData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: values.email,
          username: values.username,
          firstName: values.firstName,
          lastName: values.lastName,
          password: values.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      if (data.success) {
        message.success('Registration successful! Please sign in.');
        router.push('/auth/login');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title='Create your account'
      subtitle='Join Taskie and start managing your tasks efficiently.'
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
        name='register'
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
            prefix={<MailOutlined className='text-gray-400' />}
            placeholder='Enter your email'
            autoComplete='email'
          />
        </Form.Item>

        <Form.Item
          name='username'
          label='Username'
          rules={[
            { required: true, message: 'Please input your username!' },
            { min: 3, message: 'Username must be at least 3 characters!' },
          ]}
        >
          <Input
            prefix={<UserOutlined className='text-gray-400' />}
            placeholder='Enter your username'
            autoComplete='username'
          />
        </Form.Item>

        <div className='grid grid-cols-2 gap-4'>
          <Form.Item
            name='firstName'
            label='First Name'
            rules={[
              { required: true, message: 'Please input your first name!' },
            ]}
          >
            <Input placeholder='First name' autoComplete='given-name' />
          </Form.Item>

          <Form.Item
            name='lastName'
            label='Last Name'
            rules={[
              { required: true, message: 'Please input your last name!' },
            ]}
          >
            <Input placeholder='Last name' autoComplete='family-name' />
          </Form.Item>
        </div>

        <Form.Item
          name='password'
          label='Password'
          rules={[
            { required: true, message: 'Please input your password!' },
            { min: 8, message: 'Password must be at least 8 characters!' },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className='text-gray-400' />}
            placeholder='Enter your password'
            autoComplete='new-password'
          />
        </Form.Item>

        <Form.Item
          name='confirmPassword'
          label='Confirm Password'
          dependencies={['password']}
          rules={[
            { required: true, message: 'Please confirm your password!' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Passwords do not match!'));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className='text-gray-400' />}
            placeholder='Confirm your password'
            autoComplete='new-password'
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
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
        </Form.Item>
      </Form>

      <div className='text-center mt-6'>
        <Text className='text-gray-600'>
          Already have an account?{' '}
          <Link
            href='/auth/login'
            className='text-primary-blue hover:text-blue-700'
          >
            Sign in here
          </Link>
        </Text>
      </div>
    </AuthLayout>
  );
}
