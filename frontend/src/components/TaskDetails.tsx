'use client';

import React from 'react';
import {
  Modal,
  Descriptions,
  Tag,
  Avatar,
  Button,
  Divider,
  Tooltip,
  Space,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  ProjectOutlined,
} from '@ant-design/icons';
import MDEditor from '@uiw/react-md-editor';
import { Task, TaskStatus, TaskPriority } from '../types/task';
import TaskComments from './TaskComments';

interface TaskDetailsProps {
  visible: boolean;
  onClose: () => void;
  task: Task | null;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  loading?: boolean;
}

const TaskDetails: React.FC<TaskDetailsProps> = ({
  visible,
  onClose,
  task,
  onEdit,
  onDelete,
  loading = false,
}) => {
  if (!task) return null;

  // Status configuration
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

  // Priority configuration
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

  // Format dates
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Check if task is overdue
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <Modal
      title={
        <div className='flex items-center justify-between'>
          <div className='flex items-center'>
            <div
              className='w-4 h-4 rounded-full mr-3'
              style={{ backgroundColor: priorityConfig.color }}
            />
            <span className='text-lg font-semibold'>{task.title}</span>
          </div>
          <Space>
            {onEdit && (
              <Button
                type='text'
                icon={<EditOutlined />}
                onClick={() => onEdit(task)}
              >
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                type='text'
                danger
                icon={<DeleteOutlined />}
                onClick={() => onDelete(task.id)}
              >
                Delete
              </Button>
            )}
          </Space>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={900}
      footer={null}
      className='task-details-modal'
    >
      <div className='space-y-6'>
        {/* Task Information */}
        <Descriptions column={{ xs: 1, sm: 2, md: 2 }} size='small' bordered>
          <Descriptions.Item
            label={
              <span className='flex items-center'>
                <ProjectOutlined className='mr-1' />
                Project
              </span>
            }
          >
            <div className='flex items-center'>
              <div
                className='w-3 h-3 rounded-full mr-2'
                style={{ backgroundColor: task.project.color }}
              />
              {task.project.name}
            </div>
          </Descriptions.Item>

          <Descriptions.Item label='Status'>
            <Tag color={statusConfig.color}>{statusConfig.label}</Tag>
          </Descriptions.Item>

          <Descriptions.Item label='Priority'>
            <Tag color={priorityConfig.color}>{priorityConfig.label}</Tag>
          </Descriptions.Item>

          <Descriptions.Item label='Assignee'>
            {task.assignee ? (
              <div className='flex items-center'>
                <Avatar
                  size='small'
                  src={task.assignee.avatar}
                  icon={<UserOutlined />}
                  className='mr-2'
                >
                  {!task.assignee.avatar &&
                    `${task.assignee.firstName[0]}${task.assignee.lastName[0]}`}
                </Avatar>
                <span>
                  {task.assignee.firstName} {task.assignee.lastName}
                </span>
              </div>
            ) : (
              <span className='text-gray-500'>Unassigned</span>
            )}
          </Descriptions.Item>

          <Descriptions.Item
            label={
              <span className='flex items-center'>
                <CalendarOutlined className='mr-1' />
                Due Date
              </span>
            }
          >
            {task.dueDate ? (
              <span className={isOverdue ? 'text-red-500 font-medium' : ''}>
                {formatDate(task.dueDate)}
                {isOverdue && ' (Overdue)'}
              </span>
            ) : (
              <span className='text-gray-500'>Not set</span>
            )}
          </Descriptions.Item>

          <Descriptions.Item
            label={
              <span className='flex items-center'>
                <ClockCircleOutlined className='mr-1' />
                Created
              </span>
            }
          >
            {formatDate(task.createdAt)}
          </Descriptions.Item>

          <Descriptions.Item label='Last Updated'>
            {formatDate(task.updatedAt)}
          </Descriptions.Item>
        </Descriptions>

        {/* Description */}
        {task.description && (
          <div>
            <h4 className='text-sm font-medium text-gray-900 mb-2'>
              Description
            </h4>
            <div
              data-color-mode='light'
              className='border rounded-md p-3 bg-gray-50'
            >
              <MDEditor.Markdown
                source={task.description}
                style={{ backgroundColor: 'transparent' }}
              />
            </div>
          </div>
        )}

        <Divider />

        {/* Comments Section */}
        <TaskComments taskId={task.id} />
      </div>
    </Modal>
  );
};

export default TaskDetails;
