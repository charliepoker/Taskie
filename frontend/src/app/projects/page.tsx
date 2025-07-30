'use client';

import React, { useState } from 'react';
import { Modal, message } from 'antd';
import { ProjectList } from '../../components/ProjectList';
import { ProjectForm } from '../../components/ProjectForm';
import { ProjectDetails } from '../../components/ProjectDetails';
import { Project } from '../../services/projectService';
import { useAuth } from '../../hooks/useAuth';
import { DashboardLayout } from '@/components/DashboardLayout';
import { BreadcrumbNavigation } from '@/components/BreadcrumbNavigation';
import { RouteWrapper } from '@/components/RouteWrapper';

export default function ProjectsPage() {
  const { currentUser: user } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [projectListKey, setProjectListKey] = useState(0);

  const handleCreateProject = () => {
    setSelectedProject(null);
    setShowCreateForm(true);
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setShowEditForm(true);
  };

  const handleDeleteProject = (project: Project) => {
    Modal.confirm({
      title: 'Delete Project',
      content: `Are you sure you want to delete "${project.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: () => {
        // The ProjectList component handles the actual deletion
        message.success('Project deleted successfully');
      },
    });
  };

  const handleManageMembers = (project: Project) => {
    setSelectedProject(project);
    setShowProjectDetails(true);
    // Set active tab to members when opening project details
  };

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setShowProjectDetails(true);
  };

  const handleFormSuccess = (project: Project) => {
    // Refresh the project list
    setProjectListKey(prev => prev + 1);
    message.success(
      selectedProject
        ? 'Project updated successfully'
        : 'Project created successfully'
    );
  };

  const handleBackFromDetails = () => {
    setShowProjectDetails(false);
    setSelectedProject(null);
    // Refresh the project list in case members were changed
    setProjectListKey(prev => prev + 1);
  };

  if (showProjectDetails && selectedProject) {
    return (
      <RouteWrapper>
        <DashboardLayout>
          <ProjectDetails
            projectId={selectedProject.id}
            currentUserId={user?.id}
            onBack={handleBackFromDetails}
            onEdit={handleEditProject}
          />
        </DashboardLayout>
      </RouteWrapper>
    );
  }

  return (
    <RouteWrapper>
      <DashboardLayout>
        <BreadcrumbNavigation />

        <ProjectList
          key={projectListKey}
          currentUserId={user?.id}
          onCreateProject={handleCreateProject}
          onEditProject={handleEditProject}
          onDeleteProject={handleDeleteProject}
          onManageMembers={handleManageMembers}
          onProjectClick={handleProjectClick}
        />

        {/* Create Project Modal */}
        <ProjectForm
          visible={showCreateForm}
          project={null}
          onCancel={() => setShowCreateForm(false)}
          onSuccess={handleFormSuccess}
        />

        {/* Edit Project Modal */}
        <ProjectForm
          visible={showEditForm}
          project={selectedProject}
          onCancel={() => setShowEditForm(false)}
          onSuccess={handleFormSuccess}
        />
      </DashboardLayout>
    </RouteWrapper>
  );
}
