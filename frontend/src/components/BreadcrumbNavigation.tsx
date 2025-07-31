'use client';

import { Breadcrumb } from 'antd';
import {
  HomeOutlined,
  ProjectOutlined,
  UserOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface BreadcrumbItem {
  title: React.ReactNode;
  href?: string;
}

interface BreadcrumbNavigationProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export function BreadcrumbNavigation({
  items,
  className,
}: BreadcrumbNavigationProps) {
  const pathname = usePathname();

  // Auto-generate breadcrumbs based on current path if no items provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      {
        title: (
          <Link href='/dashboard' className='flex items-center'>
            <HomeOutlined className='mr-1' />
            Dashboard
          </Link>
        ),
      },
    ];

    let currentPath = '';

    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;

      // Skip dashboard as it's already added
      if (segment === 'dashboard') return;

      let title: React.ReactNode =
        segment.charAt(0).toUpperCase() + segment.slice(1);
      let icon: React.ReactNode = null;

      // Add icons for known routes
      switch (segment) {
        case 'projects':
          icon = <ProjectOutlined className='mr-1' />;
          title = 'Projects';
          break;
        case 'users':
          icon = <UserOutlined className='mr-1' />;
          title = 'Users';
          break;
        case 'analytics':
          icon = <BarChartOutlined className='mr-1' />;
          title = 'Analytics';
          break;
        default:
          // For dynamic segments (like IDs), keep them as is
          break;
      }

      // Only make it a link if it's not the last segment
      const isLast = index === pathSegments.length - 1;

      breadcrumbs.push({
        title: isLast ? (
          <span className='flex items-center'>
            {icon}
            {title}
          </span>
        ) : (
          <Link href={currentPath as any} className='flex items-center'>
            {icon}
            {title}
          </Link>
        ),
      });
    });

    return breadcrumbs;
  };

  const breadcrumbItems = items || generateBreadcrumbs();

  return (
    <Breadcrumb
      items={breadcrumbItems as any}
      className={`mb-6 ${className || ''}`}
    />
  );
}
