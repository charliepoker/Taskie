'use client';

import { useState, useEffect } from 'react';
import { Layout, Drawer } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import { Navigation } from './Navigation';

const { Content, Header } = Layout;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleCollapse = (collapsed: boolean) => {
    if (isMobile) {
      setMobileDrawerOpen(!mobileDrawerOpen);
    } else {
      setCollapsed(collapsed);
    }
  };

  return (
    <Layout className='min-h-screen'>
      {/* Desktop Navigation */}
      {!isMobile && (
        <Navigation collapsed={collapsed} onCollapse={setCollapsed} />
      )}

      {/* Mobile Navigation Drawer */}
      {isMobile && (
        <Drawer
          title={<div className='text-xl font-bold text-blue-600'>Taskie</div>}
          placement='left'
          onClose={() => setMobileDrawerOpen(false)}
          open={mobileDrawerOpen}
          bodyStyle={{ padding: 0 }}
          width={280}
        >
          <Navigation
            collapsed={false}
            onCollapse={() => setMobileDrawerOpen(false)}
            isMobile={true}
          />
        </Drawer>
      )}

      <Layout>
        {/* Mobile Header */}
        {isMobile && (
          <Header className='bg-white shadow-sm px-4 flex items-center justify-between'>
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className='p-2 rounded-md hover:bg-gray-100'
            >
              <MenuOutlined className='text-lg' />
            </button>
            <div className='text-lg font-bold text-blue-600'>Taskie</div>
            <div className='w-8' /> {/* Spacer for centering */}
          </Header>
        )}

        <Content className='bg-gray-50 p-6'>{children}</Content>
      </Layout>
    </Layout>
  );
}
