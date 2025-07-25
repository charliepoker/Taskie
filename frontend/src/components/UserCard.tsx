'use client';

import {
  Card,
  Avatar,
  Typography,
  Tag,
  Button,
  Dropdown,
  MenuProps,
} from 'antd';
import {
  UserOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { User } from '@/services/userService';

const { Text, Title } = Typography;

interface UserCardProps {
  user: User;
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
  onView?: (user: User) => void;
  showActions?: boolean;
  currentUserId?: string;
}

export function UserCard({
  user,
  onEdit,
  onDelete,
  onView,
  showActions = true,
  currentUserId,
}: UserCardProps) {
  const isCurrentUser = currentUserId === user.id;

  const menuItems: MenuProps['items'] = [
    {
      key: 'view',
      label: 'View Profile',
      icon: <UserOutlined />,
      onClick: () => onView?.(user),
    },
    ...(isCurrentUser
      ? [
          {
            key: 'edit',
            label: 'Edit Profile',
            icon: <EditOutlined />,
            onClick: () => onEdit?.(user),
          },
          {
            type: 'divider' as const,
          },
          {
            key: 'delete',
            label: 'Delete Account',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => onDelete?.(user),
          },
        ]
      : []),
  ];

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card
      hoverable
      className='w-full'
      actions={
        showActions && menuItems.length > 0
          ? [
              <Dropdown
                key='actions'
                menu={{ items: menuItems }}
                trigger={['click']}
                placement='bottomRight'
              >
                <Button
                  type='text'
                  icon={<MoreOutlined />}
                  onClick={e => e.stopPropagation()}
                />
              </Dropdown>,
            ]
          : undefined
      }
      onClick={() => onView?.(user)}
    >
      <div className='flex items-start space-x-4'>
        <Avatar
          size={64}
          src={user.avatar}
          icon={<UserOutlined />}
          className='flex-shrink-0'
        >
          {!user.avatar && getInitials(user.firstName, user.lastName)}
        </Avatar>

        <div className='flex-1 min-w-0'>
          <div className='flex items-center justify-between mb-2'>
            <Title level={5} className='!mb-0 truncate'>
              {user.firstName} {user.lastName}
            </Title>
            {isCurrentUser && (
              <Tag color='blue' className='ml-2'>
                You
              </Tag>
            )}
          </div>

          <Text type='secondary' className='block mb-1'>
            @{user.username}
          </Text>

          <Text type='secondary' className='block mb-3 text-sm'>
            {user.email}
          </Text>

          {user._count && (
            <div className='flex flex-wrap gap-2 text-xs text-gray-500'>
              <span>{user._count.projects} projects</span>
              <span>•</span>
              <span>{user._count.assignedTasks} tasks</span>
              <span>•</span>
              <span>{user._count.comments} comments</span>
            </div>
          )}

          <div className='mt-2'>
            <Text type='secondary' className='text-xs'>
              Joined {formatDate(user.createdAt)}
            </Text>
          </div>
        </div>
      </div>
    </Card>
  );
}
