'use client';

import { Card, Typography, Space } from 'antd';
import { RequireAuth } from '@/components/ProtectedRoute';
import { LogoutButton } from '@/components/LogoutButton';
import { useAuth } from '@/hooks/useAuth';

const { Title, Text } = Typography;

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <RequireAuth>
      <div className='min-h-screen bg-gray-50 p-8'>
        <div className='max-w-4xl mx-auto'>
          <div className='flex justify-between items-center mb-8'>
            <div>
              <Title level={1}>Dashboard</Title>
              <Text className='text-gray-600'>
                Welcome back, {user?.firstName} {user?.lastName}!
              </Text>
            </div>
            <LogoutButton />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            <Card title='Projects' className='shadow-sm'>
              <Text>Your projects will appear here</Text>
            </Card>

            <Card title='Tasks' className='shadow-sm'>
              <Text>Your tasks will appear here</Text>
            </Card>

            <Card title='Analytics' className='shadow-sm'>
              <Text>Your analytics will appear here</Text>
            </Card>
          </div>

          <Card title='User Information' className='mt-6 shadow-sm'>
            <Space direction='vertical'>
              <Text>
                <strong>Email:</strong> {user?.email}
              </Text>
              <Text>
                <strong>Username:</strong> {user?.username}
              </Text>
              <Text>
                <strong>Name:</strong> {user?.firstName} {user?.lastName}
              </Text>
            </Space>
          </Card>
        </div>
      </div>
    </RequireAuth>
  );
}
