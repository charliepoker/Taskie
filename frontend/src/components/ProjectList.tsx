'use client';

import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Input,
  Button,
  Pagination,
  Spin,
  Empty,
  message,
  Select,
  Space,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { ProjectCard } from './ProjectCard';
import {
  ProjectService,
  Project,
  GetProjectsParams,
} from '../services/projectService';

const { Search } = Input;
const { Option } = Select;

interface ProjectListProps {
  currentUserId?: string;
  onCreateProject?: () => void;
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (project: Project) => void;
  onManageMembers?: (project: Project) => void;
  onProjectClick?: (project: Project) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  currentUserId,
  onCreateProject,
  onEditProject,
  onDeleteProject,
  onManageMembers,
  onProjectClick,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
    total: 0,
  });
  const [filters, setFilters] = useState<GetProjectsParams>({
    page: 1,
    limit: 12,
  });

  const fetchProjects = async (params: GetProjectsParams = filters) => {
    setLoading(true);
    try {
      const response = await ProjectService.getProjects(params);
      setProjects(response.data);
      setPagination({
        current: response.meta.page,
        pageSize: response.meta.limit,
        total: response.meta.total,
      });
    } catch (error: any) {
      message.error(error.error || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleSearch = (value: string) => {
    const newFilters = {
      ...filters,
      search: value || undefined,
      page: 1,
    };
    setFilters(newFilters);
    fetchProjects(newFilters);
  };

  const handleFilterChange = (key: keyof GetProjectsParams, value: any) => {
    const newFilters = {
      ...filters,
      [key]: value,
      page: 1,
    };
    setFilters(newFilters);
    fetchProjects(newFilters);
  };

  const handlePageChange = (page: number, pageSize?: number) => {
    const newFilters = {
      ...filters,
      page,
      limit: pageSize || filters.limit,
    };
    setFilters(newFilters);
    fetchProjects(newFilters);
  };

  const handleRefresh = () => {
    fetchProjects(filters);
  };

  const handleDeleteProject = async (project: Project) => {
    try {
      await ProjectService.deleteProject(project.id);
      message.success('Project deleted successfully');
      fetchProjects(filters);
    } catch (error: any) {
      message.error(error.error || 'Failed to delete project');
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Projects</h1>
          <p className='text-gray-600'>
            Manage your projects and collaborate with your team
          </p>
        </div>
        <Button
          type='primary'
          icon={<PlusOutlined />}
          onClick={onCreateProject}
          size='large'
        >
          New Project
        </Button>
      </div>

      {/* Filters */}
      <div className='bg-white p-4 rounded-lg border'>
        <div className='flex flex-col sm:flex-row gap-4'>
          <div className='flex-1'>
            <Search
              placeholder='Search projects by name or description...'
              allowClear
              onSearch={handleSearch}
              style={{ maxWidth: 400 }}
              prefix={<SearchOutlined />}
            />
          </div>
          <Space>
            <Select
              placeholder='Filter by owner'
              allowClear
              style={{ width: 150 }}
              onChange={value => handleFilterChange('ownerId', value)}
            >
              <Option value={currentUserId}>My Projects</Option>
            </Select>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>
        </div>
      </div>

      {/* Projects Grid */}
      <Spin spinning={loading}>
        {projects.length === 0 && !loading ? (
          <Empty
            description='No projects found'
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button
              type='primary'
              icon={<PlusOutlined />}
              onClick={onCreateProject}
            >
              Create Your First Project
            </Button>
          </Empty>
        ) : (
          <>
            <Row gutter={[16, 16]}>
              {projects.map(project => (
                <Col key={project.id} xs={24} sm={12} md={8} lg={6} xl={6}>
                  <ProjectCard
                    project={project}
                    currentUserId={currentUserId}
                    onEdit={onEditProject}
                    onDelete={handleDeleteProject}
                    onManageMembers={onManageMembers}
                    onClick={onProjectClick}
                  />
                </Col>
              ))}
            </Row>

            {/* Pagination */}
            {pagination.total > pagination.pageSize && (
              <div className='flex justify-center mt-8'>
                <Pagination
                  current={pagination.current}
                  pageSize={pagination.pageSize}
                  total={pagination.total}
                  onChange={handlePageChange}
                  showSizeChanger
                  showQuickJumper
                  showTotal={(total, range) =>
                    `${range[0]}-${range[1]} of ${total} projects`
                  }
                />
              </div>
            )}
          </>
        )}
      </Spin>
    </div>
  );
};
