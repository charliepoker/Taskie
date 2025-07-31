'use client';

import { ReactNode } from 'react';
import { Layout, Typography } from 'antd';
import Link from 'next/link';

const { Content, Footer } = Layout;
const { Title, Text } = Typography;

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <Layout className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100'>
      <Content className='flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-md w-full space-y-8'>
          {/* Header */}
          <div className='text-center'>
            <Link href='/' className='inline-block mb-6'>
              <div className='text-3xl font-bold text-primary-blue'>Taskie</div>
            </Link>
            <Title level={2} className='text-gray-900 mb-2'>
              {title}
            </Title>
            {subtitle && (
              <Text className='text-gray-600 text-base'>{subtitle}</Text>
            )}
          </div>

          {/* Content */}
          <div className='bg-white rounded-lg shadow-lg p-8'>{children}</div>
        </div>
      </Content>

      <Footer className='text-center bg-transparent'>
        <Text className='text-gray-500'>
          © 2024 Taskie. Built with modern DevOps practices.
        </Text>
      </Footer>
    </Layout>
  );
}
