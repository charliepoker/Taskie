'use client';

import { Button, Modal } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

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
  showConfirm = true,
  children,
  className,
}: LogoutButtonProps) {
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    if (showConfirm) {
      Modal.confirm({
        title: 'Sign Out',
        content: 'Are you sure you want to sign out?',
        okText: 'Sign Out',
        cancelText: 'Cancel',
        onOk: async () => {
          setLoading(true);
          try {
            await signOut();
          } finally {
            setLoading(false);
          }
        },
      });
    } else {
      setLoading(true);
      try {
        await signOut();
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Button
      type={type}
      size={size}
      icon={<LogoutOutlined />}
      loading={loading}
      onClick={handleLogout}
      className={className}
    >
      {children || 'Sign Out'}
    </Button>
  );
}
