'use client';

import React from 'react';
import { Card, Tag, Avatar, Tooltip, Button, Dropdown } from 'antd';
import {
  CalendarOutlined,
  UserOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  CommentOutlined,
} from '@ant-design/icons';
import { Task, TaskStatus, TaskPriority } from '../types/task';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onView?: (task: Task) => void;
  isDragging?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onView,
  isDragging = false,
}) => {
  // Status colors and labels
  const getStatusConfig = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO:
        return { color: '#8c8c8c', label: 'To Do' };
      case TaskStatus.IN_PROGRESS:
        return { color: '#0D65F2', label: 'In Progress' };
      case TaskStatus.IN_REVIEW:
        return { color: '#DFB032', label: 'In Review' };
      case TaskStatus.DONE:
        return { color: '#52c41a', label: 'Done' };
      default:
        return { color: '#8c8c8c', label: 'Unknown' };
    }
  };

  // Priority colors and labels
  const getPriorityConfig = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.LOW:
        return { color: '#52c41a', label: 'Low' };
      case TaskPriority.MEDIUM:
        return { color: '#DFB032', label: 'Medium' };
      case TaskPriority.HIGH:
        return { color: '#fa8c16', label: 'High' };
      case TaskPriority.URGENT:
        return { color: '#ff4d4f', label: 'Urgent' };
      default:
        return { color: '#8c8c8c', label: 'Unknown' };
    }
  };

  const statusConfig = getStatusConfig(task.status);
  const priorityConfig = getPriorityConfig(task.priority);

  // Format due date
  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    const now = new Date();
    const isOverdue = date < now;
    const isToday = date.toDateString() === now.toDateString();

    let dateStr = date.toLocaleDateString();
    if (isToday) dateStr = 'Today';

    return {
      text: dateStr,
      isOverdue,
      isToday,
    };
  };

  const dueDateInfo = formatDueDate(task.dueDate || null);

  // Dropdown menu items
  const menuItems = [
    {
      key: 'view',
      icon: <CommentOutlined />,
      label: 'View Details',
      onClick: () => onView?.(task),
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Edit Task',
      onClick: () => onEdit?.(task),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Delete Task',
      danger: true,
      onClick: () => onDelete?.(task.id),
    },
  ];

  return (
    <Card
      size='small'
      className={`
        task-card cursor-pointer transition-all duration-200 hover:shadow-md
        ${isDragging ? 'opacity-50 rotate-2 shadow-lg' : ''}
        ${task.status === TaskStatus.DONE ? 'opacity-75' : ''}
      `}
      style={{
        borderLeft: `4px solid ${priorityConfig.color}`,
        marginBottom: 8,
      }}
      bodyStyle={{ padding: '12px' }}
      onClick={() => onView?.(task)}
    >
      {/* Header with title and actions */}
      <div className='flex items-start justify-between mb-2'>
        <h4 className='text-sm font-medium text-gray-900 line-clamp-2 flex-1 mr-2'>
          {task.title}
        </h4>
        <Dropdown
          menu={{ items: menuItems }}
          trigger={['click']}
          placement='bottomRight'
        >
          <Button
            type='text'
            size='small'
            icon={<MoreOutlined />}
            className='flex-shrink-0'
            onClick={e => e.stopPropagation()}
          />
        </Dropdown>
      </div>

      {/* Description */}
      {task.description && (
        <p className='text-xs text-gray-600 mb-3 line-clamp-2'>
          {task.description}
        </p>
      )}

      {/* Tags row */}
      <div className='flex flex-wrap gap-1 mb-3'>
        <Tag color={statusConfig.color}>{statusConfig.label}</Tag>
        <Tag color={priorityConfig.color}>{priorityConfig.label}</Tag>
      </div>

      {/* Footer with assignee and due date */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center'>
          {task.assignee ? (
            <Tooltip
              title={`${task.assignee.firstName} ${task.assignee.lastName}`}
            >
              <Avatar
                size='small'
                src={task.assignee.avatar}
                icon={<UserOutlined />}
                className='mr-2'
              >
                {!task.assignee.avatar &&
                  `${task.assignee.firstName[0]}${task.assignee.lastName[0]}`}
              </Avatar>
            </Tooltip>
          ) : (
            <Avatar
              size='small'
              icon={<UserOutlined />}
              className='mr-2 opacity-50'
            />
          )}

          {task.comments && task.comments.length > 0 && (
            <span className='text-xs text-gray-500 flex items-center'>
              <CommentOutlined className='mr-1' />
              {task.comments.length}
            </span>
          )}
        </div>

        {dueDateInfo && (
          <div className='flex items-center'>
            <CalendarOutlined
              className={`mr-1 text-xs ${
                dueDateInfo.isOverdue
                  ? 'text-red-500'
                  : dueDateInfo.isToday
                    ? 'text-orange-500'
                    : 'text-gray-500'
              }`}
            />
            <span
              className={`text-xs ${
                dueDateInfo.isOverdue
                  ? 'text-red-500 font-medium'
                  : dueDateInfo.isToday
                    ? 'text-orange-500 font-medium'
                    : 'text-gray-500'
              }`}
            >
              {dueDateInfo.text}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default TaskCard;
