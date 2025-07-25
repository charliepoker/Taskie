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
}

export function Navigation({ collapsed = false, onCollapse }: NavigationProps) {
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

  const handleMenuClick = ({ key }: { key: string }) => {
    router.push(key as any);
  };

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
        selectedKeys={[pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        className='border-r-0'
      />

      <div className='absolute bottom-4 left-0 right-0 px-4'>
        <LogoutButton />
      </div>
    </Sider>
  );
}
