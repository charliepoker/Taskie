'use client';

import { Menu, Layout } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  ProjectOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { LogoutButton } from './LogoutButton';

const { Sider } = Layout;

interface NavigationProps {
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  isMobile?: boolean;
}

export function Navigation({
  collapsed = false,
  onCollapse,
  isMobile = false,
}: NavigationProps) {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/users',
      icon: <UserOutlined />,
      label: 'Users',
    },
    {
      key: '/projects',
      icon: <ProjectOutlined />,
      label: 'Projects',
    },
    {
      key: '/analytics',
      icon: <BarChartOutlined />,
      label: 'Analytics',
    },
  ];

  // Determine selected key based on current path
  const getSelectedKey = () => {
    // For exact matches
    const exactMatch = menuItems.find(item => item.key === pathname);
    if (exactMatch) return exactMatch.key;

    // For nested routes (e.g., /projects/123 should highlight /projects)
    const parentMatch = menuItems.find(
      item => pathname.startsWith(item.key) && item.key !== '/'
    );
    return parentMatch?.key || pathname;
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    router.push(key as any);
    // Close mobile drawer after navigation
    if (isMobile && onCollapse) {
      onCollapse(true);
    }
  };

  if (isMobile) {
    return (
      <div className='flex flex-col h-full'>
        <Menu
          mode='inline'
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
          onClick={handleMenuClick}
          className='border-r-0'
        />
        {/* Logout button right after menu items */}
        <div className='px-4 mt-4'>
          <LogoutButton type='primary' size='small' className='w-full' />
        </div>
      </div>
    );
  }

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      className='min-h-screen'
      theme='light'
    >
      <div className='p-4'>
        <div className='text-xl font-bold text-blue-600 mb-8'>
          {collapsed ? 'T' : 'Taskie'}
        </div>
      </div>

      <Menu
        mode='inline'
        selectedKeys={[getSelectedKey()]}
        items={menuItems}
        onClick={handleMenuClick}
        className='border-r-0'
      />

      {/* Logout button right after menu items */}
      <div className='px-4 mt-4'>
        <LogoutButton type='primary' size='small' className='w-full' />
      </div>
    </Sider>
  );
}
