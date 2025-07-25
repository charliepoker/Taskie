'use client';

import { useState } from 'react';
import { Layout } from 'antd';
import { Navigation } from './Navigation';

const { Content } = Layout;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout className='min-h-screen'>
      <Navigation collapsed={collapsed} onCollapse={setCollapsed} />
      <Layout>
        <Content className='bg-gray-50'>{children}</Content>
      </Layout>
    </Layout>
  );
}
