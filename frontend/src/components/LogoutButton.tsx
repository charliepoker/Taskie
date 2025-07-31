'use client';

import { Button } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';

interface LogoutButtonProps {
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
  size?: 'small' | 'middle' | 'large';
  showConfirm?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function LogoutButton({
  type = 'default',
  size = 'middle',
  children,
  className,
}: LogoutButtonProps) {
  const handleLogout = () => {
    // Simple, direct logout - just redirect to login
    if (typeof window !== 'undefined') {
      // Clear any stored data
      localStorage.clear();
      sessionStorage.clear();

      // Force redirect to login page
      window.location.href = '/auth/login';
    }
  };

  return (
    <Button
      type={type}
      size={size}
      icon={<LogoutOutlined />}
      onClick={handleLogout}
      className={className}
    >
      {children || 'Logout'}
    </Button>
  );
}
