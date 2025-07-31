'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Tabs,
  Avatar,
  Tag,
  Button,
  Spin,
  message,
  Breadcrumb,
  Space,
  Tooltip,
  Empty,
  Descriptions,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  TeamOutlined,
  CheckSquareOutlined,
  UserOutlined,
  CalendarOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { ProjectService, Project } from '../services/projectService';
import { ProjectMemberManagement } from './ProjectMemberManagement';

const { TabPane } = Tabs;

interface ProjectDetailsProps {
  projectId: string;
  currentUserId?: string;
  onBack?: () => void;
  onEdit?: (project: Project) => void;
}

export const ProjectDetails: React.FC<ProjectDetailsProps> = ({
  projectId,
  currentUserId,
  onBack,
  onEdit,
}) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchProject = useCallback(async () => {
    setLoading(true);
    try {
      const response = await ProjectService.getProjectById(projectId);
      setProject(response.data.project);
    } catch (error: any) {
      message.error(error.error || 'Failed to fetch project details');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId, fetchProject]);

  if (loading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <Spin size='large' />
      </div>
    );
  }

  if (!project) {
    return (
      <Empty
        description='Project not found'
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      >
        <Button onClick={onBack}>Go Back</Button>
      </Empty>
    );
  }

  const isOwner = currentUserId === project.ownerId;
  const isAdmin = project.members.some(
    member => member.userId === currentUserId && member.role === 'ADMIN'
  );
  const canEdit = isOwner || isAdmin;

  const renderProjectHeader = () => (
    <div className='bg-white p-6 rounded-lg border mb-6'>
      <div className='flex items-start justify-between mb-4'>
        <div className='flex items-center space-x-4'>
          {onBack && (
            <Button icon={<ArrowLeftOutlined />} onClick={onBack} type='text' />
          )}
          <div className='flex items-center space-x-3'>
            <div
              className='w-4 h-4 rounded-full'
              style={{ backgroundColor: project.color }}
            />
            <h1 className='text-2xl font-bold text-gray-900'>{project.name}</h1>
          </div>
        </div>
        {canEdit && (
          <Button icon={<EditOutlined />} onClick={() => onEdit?.(project)}>
            Edit Project
          </Button>
        )}
      </div>

      {project.description && (
        <p className='text-gray-600 mb-4'>{project.description}</p>
      )}

      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <div className='flex items-center space-x-2'>
          <UserOutlined className='text-gray-400' />
          <div>
            <p className='text-sm text-gray-500'>Owner</p>
            <p className='font-medium'>
              {project.owner.firstName} {project.owner.lastName}
            </p>
          </div>
        </div>
        <div className='flex items-center space-x-2'>
          <CalendarOutlined className='text-gray-400' />
          <div>
            <p className='text-sm text-gray-500'>Created</p>
            <p className='font-medium'>
              {new Date(project.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className='flex items-center space-x-2'>
          <TeamOutlined className='text-gray-400' />
          <div>
            <p className='text-sm text-gray-500'>Team Size</p>
            <p className='font-medium'>{project._count.members + 1} members</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOverviewTab = () => (
    <div className='space-y-6'>
      {/* Project Stats */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card className='text-center'>
          <CheckSquareOutlined className='text-2xl text-blue-500 mb-2' />
          <h3 className='text-2xl font-bold'>{project._count.tasks}</h3>
          <p className='text-gray-500'>Total Tasks</p>
        </Card>
        <Card className='text-center'>
          <TeamOutlined className='text-2xl text-green-500 mb-2' />
          <h3 className='text-2xl font-bold'>{project._count.members + 1}</h3>
          <p className='text-gray-500'>Team Members</p>
        </Card>
        <Card className='text-center'>
          <CalendarOutlined className='text-2xl text-orange-500 mb-2' />
          <h3 className='text-2xl font-bold'>
            {Math.ceil(
              (Date.now() - new Date(project.createdAt).getTime()) /
                (1000 * 60 * 60 * 24)
            )}
          </h3>
          <p className='text-gray-500'>Days Active</p>
        </Card>
        <Card className='text-center'>
          <SettingOutlined className='text-2xl text-purple-500 mb-2' />
          <h3 className='text-2xl font-bold'>Active</h3>
          <p className='text-gray-500'>Status</p>
        </Card>
      </div>

      {/* Project Information */}
      <Card title='Project Information'>
        <Descriptions column={1} bordered>
          <Descriptions.Item label='Name'>{project.name}</Descriptions.Item>
          <Descriptions.Item label='Description'>
            {project.description || 'No description provided'}
          </Descriptions.Item>
          <Descriptions.Item label='Color'>
            <div className='flex items-center space-x-2'>
              <div
                className='w-4 h-4 rounded-full border'
                style={{ backgroundColor: project.color }}
              />
              <span>{project.color}</span>
            </div>
          </Descriptions.Item>
          <Descriptions.Item label='Created'>
            {new Date(project.createdAt).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label='Last Updated'>
            {new Date(project.updatedAt).toLocaleString()}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Team Overview */}
      <Card
        title='Team Members'
        extra={<Tag color='blue'>{project._count.members + 1} members</Tag>}
      >
        <div className='space-y-3'>
          {/* Owner */}
          <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
            <div className='flex items-center space-x-3'>
              <Avatar
                src={project.owner.avatar}
                icon={!project.owner.avatar && <UserOutlined />}
              >
                {!project.owner.avatar &&
                  `${project.owner.firstName[0]}${project.owner.lastName[0]}`}
              </Avatar>
              <div>
                <p className='font-medium'>
                  {project.owner.firstName} {project.owner.lastName}
                </p>
                <p className='text-sm text-gray-500'>{project.owner.email}</p>
              </div>
            </div>
            <Tag color='gold'>Owner</Tag>
          </div>

          {/* Members */}
          {project.members.map(member => (
            <div
              key={member.id}
              className='flex items-center justify-between p-3 border rounded-lg'
            >
              <div className='flex items-center space-x-3'>
                <Avatar
                  src={member.user.avatar}
                  icon={!member.user.avatar && <UserOutlined />}
                >
                  {!member.user.avatar &&
                    `${member.user.firstName[0]}${member.user.lastName[0]}`}
                </Avatar>
                <div>
                  <p className='font-medium'>
                    {member.user.firstName} {member.user.lastName}
                  </p>
                  <p className='text-sm text-gray-500'>{member.user.email}</p>
                </div>
              </div>
              <Tag
                color={
                  member.role === 'ADMIN'
                    ? 'red'
                    : member.role === 'MEMBER'
                      ? 'blue'
                      : 'default'
                }
              >
                {member.role}
              </Tag>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderTasksTab = () => (
    <div className='text-center py-12'>
      <CheckSquareOutlined className='text-6xl text-gray-300 mb-4' />
      <h3 className='text-xl font-medium text-gray-500 mb-2'>
        Tasks Coming Soon
      </h3>
      <p className='text-gray-400'>
        Task management features will be available in the next update.
      </p>
    </div>
  );

  return (
    <div className='space-y-6'>
      {renderProjectHeader()}

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} size='large'>
          <TabPane
            tab={
              <span>
                <SettingOutlined />
                Overview
              </span>
            }
            key='overview'
          >
            {renderOverviewTab()}
          </TabPane>

          <TabPane
            tab={
              <span>
                <CheckSquareOutlined />
                Tasks ({project._count.tasks})
              </span>
            }
            key='tasks'
          >
            {renderTasksTab()}
          </TabPane>

          <TabPane
            tab={
              <span>
                <TeamOutlined />
                Members ({project._count.members + 1})
              </span>
            }
            key='members'
          >
            <ProjectMemberManagement
              project={project}
              currentUserId={currentUserId}
              onMemberChange={fetchProject}
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};
