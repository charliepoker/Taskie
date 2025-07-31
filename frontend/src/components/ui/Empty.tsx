'use client';

import React from 'react';
import { Empty as AntEmpty, EmptyProps as AntEmptyProps } from 'antd';
import {
  InboxOutlined,
  FileTextOutlined,
  UserOutlined,
  FolderOpenOutlined,
  SearchOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { cn } from '@/lib/utils';
import Button from './Button';

export interface EmptyProps extends Omit<AntEmptyProps, 'image'> {
  variant?: 'default' | 'search' | 'error' | 'custom';
  icon?:
    | 'inbox'
    | 'file'
    | 'user'
    | 'folder'
    | 'search'
    | 'error'
    | React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  size?: 'sm' | 'md' | 'lg';
}

const Empty: React.FC<EmptyProps> = ({
  variant = 'default',
  icon = 'inbox',
  title,
  subtitle,
  action,
  size = 'md',
  className,
  ...props
}) => {
  const getIcon = () => {
    if (React.isValidElement(icon)) {
      return icon;
    }

    const iconSize = size === 'sm' ? 48 : size === 'lg' ? 80 : 64;
    const iconStyle = { fontSize: iconSize, color: '#d9d9d9' };

    switch (icon) {
      case 'inbox':
        return <InboxOutlined style={iconStyle} />;
      case 'file':
        return <FileTextOutlined style={iconStyle} />;
      case 'user':
        return <UserOutlined style={iconStyle} />;
      case 'folder':
        return <FolderOpenOutlined style={iconStyle} />;
      case 'search':
        return <SearchOutlined style={iconStyle} />;
      case 'error':
        return <ExclamationCircleOutlined style={iconStyle} />;
      default:
        return <InboxOutlined style={iconStyle} />;
    }
  };

  const getDefaultContent = () => {
    switch (variant) {
      case 'search':
        return {
          title: title || 'No results found',
          subtitle: subtitle || 'Try adjusting your search criteria',
          icon: icon === 'inbox' ? 'search' : icon,
        };
      case 'error':
        return {
          title: title || 'Something went wrong',
          subtitle: subtitle || 'Please try again later',
          icon: icon === 'inbox' ? 'error' : icon,
        };
      default:
        return {
          title: title || 'No data',
          subtitle: subtitle || 'There is no data to display',
          icon,
        };
    }
  };

  const content = getDefaultContent();

  const emptyClasses = cn(
    'flex flex-col items-center justify-center text-center',
    {
      'py-8': size === 'sm',
      'py-12': size === 'md',
      'py-16': size === 'lg',
    },
    className
  );

  return (
    <div className={emptyClasses}>
      <div className='mb-4'>{getIcon()}</div>

      {content.title && (
        <h3
          className={cn('font-medium text-neutral-800 mb-2', {
            'text-sm': size === 'sm',
            'text-base': size === 'md',
            'text-lg': size === 'lg',
          })}
        >
          {content.title}
        </h3>
      )}

      {content.subtitle && (
        <p
          className={cn('text-neutral-500 mb-6 max-w-sm', {
            'text-xs': size === 'sm',
            'text-sm': size === 'md',
            'text-base': size === 'lg',
          })}
        >
          {content.subtitle}
        </p>
      )}

      {action && (
        <Button
          variant={action.variant || 'primary'}
          size={size}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};

// Specialized Empty components
export const EmptySearch: React.FC<Omit<EmptyProps, 'variant'>> = props => (
  <Empty variant='search' {...props} />
);

export const EmptyError: React.FC<Omit<EmptyProps, 'variant'>> = props => (
  <Empty variant='error' {...props} />
);

export const EmptyInbox: React.FC<
  Omit<EmptyProps, 'variant' | 'icon'>
> = props => <Empty variant='default' icon='inbox' {...props} />;

export const EmptyFiles: React.FC<
  Omit<EmptyProps, 'variant' | 'icon'>
> = props => <Empty variant='default' icon='file' {...props} />;

export const EmptyUsers: React.FC<
  Omit<EmptyProps, 'variant' | 'icon'>
> = props => <Empty variant='default' icon='user' {...props} />;

export { Empty };
export default Empty;
