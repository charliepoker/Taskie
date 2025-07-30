'use client';

import {
  ReactNode,
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { Layout, Breadcrumb, Spin, message } from 'antd';
import { HomeOutlined, ProjectOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Project, ProjectService } from '@/services/projectService';

const { Content } = Layout;

interface ProjectContextType {
  project: Project | null;
  loading: boolean;
  refreshProject: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectLayout');
  }
  return context;
};

interface ProjectLayoutProps {
  children: ReactNode;
  projectId: string;
  showBreadcrumb?: boolean;
  breadcrumbItems?: Array<{
    title: string;
    href?: string;
  }>;
}

export function ProjectLayout({
  children,
  projectId,
  showBreadcrumb = true,
  breadcrumbItems = [],
}: ProjectLayoutProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchProject = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ProjectService.getProjectById(projectId);
      setProject(response.data.project);
    } catch (error) {
      message.error('Failed to load project');
      console.error('Error fetching project:', error);
      router.push('/projects');
    } finally {
      setLoading(false);
    }
  }, [projectId, router]);

  const refreshProject = async () => {
    await fetchProject();
  };

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId, fetchProject]);

  const contextValue: ProjectContextType = {
    project,
    loading,
    refreshProject,
  };

  const defaultBreadcrumbItems = [
    {
      title: (
        <Link href='/dashboard' className='flex items-center'>
          <HomeOutlined className='mr-1' />
          Dashboard
        </Link>
      ),
    },
    {
      title: (
        <Link href='/projects' className='flex items-center'>
          <ProjectOutlined className='mr-1' />
          Projects
        </Link>
      ),
    },
    ...(project
      ? [
          {
            title: project.name,
          },
        ]
      : []),
    ...breadcrumbItems,
  ];

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-64'>
        <Spin size='large' />
      </div>
    );
  }

  return (
    <ProjectContext.Provider value={contextValue}>
      <Content className='p-6'>
        {showBreadcrumb && (
          <Breadcrumb items={defaultBreadcrumbItems} className='mb-6' />
        )}
        {children}
      </Content>
    </ProjectContext.Provider>
  );
}
