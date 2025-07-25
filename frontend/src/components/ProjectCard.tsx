'use client';

import React from 'react';
import { Card, Avatar, Tag, Tooltip, Button, Dropdown, MenuProps } from 'antd';
import {
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  CheckSquareOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Project } from '../services/projectService';

interface ProjectCardProps {
  project: Project;
  currentUserId?: string;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  onManageMembers?: (project: Project) => void;
  onClick?: (project: Project) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  currentUserId,
  onEdit,
  onDelete,
  onManageMembers,
  onClick,
}) => {
  const isOwner = currentUserId === project.ownerId;
  const isAdmin = project.members.some(
    member => member.userId === currentUserId && member.role === 'ADMIN'
  );
  const canEdit = isOwner || isAdmin;

  const menuItems: MenuProps['items'] = [
    ...(canEdit
      ? [
          {
            key: 'edit',
            label: 'Edit Project',
            icon: <EditOutlined />,
            onClick: () => onEdit?.(project),
          },
          {
            key: 'members',
            label: 'Manage Members',
            icon: <TeamOutlined />,
            onClick: () => onManageMembers?.(project),
          },
        ]
      : []),
    ...(isOwner
      ? [
          {
            type: 'divider' as const,
          },
          {
            key: 'delete',
            label: 'Delete Project',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => onDelete?.(project),
          },
        ]
      : []),
  ];

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on dropdown or buttons
    if ((e.target as HTMLElement).closest('.ant-dropdown-trigger, .ant-btn')) {
      return;
    }
    onClick?.(project);
  };

  const renderMemberAvatars = () => {
    const allMembers = [project.owner, ...project.members.map(m => m.user)];
    const displayMembers = allMembers.slice(0, 4);
    const remainingCount = Math.max(0, allMembers.length - 4);

    return (
      <div className='flex items-center -space-x-2'>
        {displayMembers.map((member, index) => (
          <Tooltip
            key={member.id}
            title={`${member.firstName} ${member.lastName}`}
          >
            <Avatar
              size='small'
              src={member.avatar}
              icon={!member.avatar && <UserOutlined />}
              className='border-2 border-white'
              style={{ zIndex: displayMembers.length - index }}
            >
              {!member.avatar && `${member.firstName[0]}${member.lastName[0]}`}
            </Avatar>
          </Tooltip>
        ))}
        {remainingCount > 0 && (
          <Avatar
            size='small'
            className='border-2 border-white bg-gray-100 text-gray-600'
            style={{ zIndex: 0 }}
          >
            +{remainingCount}
          </Avatar>
        )}
      </div>
    );
  };

  return (
    <Card
      className='hover:shadow-lg transition-shadow cursor-pointer'
      onClick={handleCardClick}
      actions={[
        <div key='stats' className='flex justify-between items-center px-4'>
          <div className='flex items-center space-x-4 text-gray-500'>
            <span className='flex items-center'>
              <CheckSquareOutlined className='mr-1' />
              {project._count.tasks} tasks
            </span>
            <span className='flex items-center'>
              <TeamOutlined className='mr-1' />
              {project._count.members + 1} members
            </span>
          </div>
          {menuItems.length > 0 && (
            <Dropdown
              menu={{ items: menuItems }}
              trigger={['click']}
              placement='bottomRight'
            >
              <Button
                type='text'
                icon={<MoreOutlined />}
                className='ant-dropdown-trigger'
                onClick={e => e.stopPropagation()}
              />
            </Dropdown>
          )}
        </div>,
      ]}
    >
      <div className='space-y-3'>
        {/* Project Header */}
        <div className='flex items-start justify-between'>
          <div className='flex-1'>
            <div className='flex items-center space-x-2 mb-1'>
              <div
                className='w-3 h-3 rounded-full'
                style={{ backgroundColor: project.color }}
              />
              <h3 className='text-lg font-semibold text-gray-900 truncate'>
                {project.name}
              </h3>
            </div>
            {project.description && (
              <p className='text-gray-600 text-sm line-clamp-2'>
                {project.description}
              </p>
            )}
          </div>
        </div>

        {/* Owner Info */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <Avatar
              size='small'
              src={project.owner.avatar}
              icon={!project.owner.avatar && <UserOutlined />}
            >
              {!project.owner.avatar &&
                `${project.owner.firstName[0]}${project.owner.lastName[0]}`}
            </Avatar>
            <div>
              <p className='text-sm font-medium text-gray-900'>
                {project.owner.firstName} {project.owner.lastName}
              </p>
              <p className='text-xs text-gray-500'>Owner</p>
            </div>
          </div>
          <Tag color='blue' className='text-xs'>
            {isOwner
              ? 'Owner'
              : isAdmin
                ? 'Admin'
                : project.members.some(m => m.userId === currentUserId)
                  ? 'Member'
                  : 'Viewer'}
          </Tag>
        </div>

        {/* Members */}
        {project.members.length > 0 && (
          <div className='flex items-center justify-between'>
            <span className='text-sm text-gray-500'>Team</span>
            {renderMemberAvatars()}
          </div>
        )}

        {/* Created Date */}
        <div className='text-xs text-gray-400'>
          Created {new Date(project.createdAt).toLocaleDateString()}
        </div>
      </div>
    </Card>
  );
};
