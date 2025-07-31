'use client';

import { useState } from 'react';
import { Modal, message } from 'antd';
import { UserList } from '@/components/UserList';
import { UserProfile } from '@/components/UserProfile';
import { User } from '@/services/userService';
import { DashboardLayout } from '@/components/DashboardLayout';
import { BreadcrumbNavigation } from '@/components/BreadcrumbNavigation';
import { RouteWrapper } from '@/components/RouteWrapper';

export default function UsersPage() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setProfileModalVisible(true);
  };

  const handleUserEdit = (user: User) => {
    setSelectedUser(user);
    setEditModalVisible(true);
  };

  const handleUserDelete = (user: User) => {
    // The UserProfile component handles the delete confirmation
    setSelectedUser(user);
    setEditModalVisible(true);
  };

  const handleUserUpdate = (updatedUser: User) => {
    message.success('User profile updated successfully');
    setEditModalVisible(false);
    // Refresh the user list by triggering a re-render
    // In a real app, you might want to use a state management solution
    // or React Query to handle cache invalidation
  };

  const handleUserDeleted = (userId: string) => {
    message.success('User account deleted successfully');
    setEditModalVisible(false);
    setProfileModalVisible(false);
    // In a real app, you might want to redirect or refresh the list
  };

  const closeModals = () => {
    setProfileModalVisible(false);
    setEditModalVisible(false);
    setSelectedUser(null);
  };

  return (
    <RouteWrapper>
      <DashboardLayout>
        <BreadcrumbNavigation />

        <UserList
          onUserSelect={handleUserSelect}
          onUserEdit={handleUserEdit}
          onUserDelete={handleUserDelete}
          showActions={true}
        />

        {/* User Profile Modal */}
        <Modal
          title='User Profile'
          open={profileModalVisible}
          onCancel={closeModals}
          footer={null}
          width={800}
          destroyOnClose
        >
          {selectedUser && (
            <UserProfile
              userId={selectedUser.id}
              onUserUpdate={handleUserUpdate}
              onUserDelete={handleUserDeleted}
            />
          )}
        </Modal>

        {/* Edit Profile Modal */}
        <Modal
          title='Edit Profile'
          open={editModalVisible}
          onCancel={closeModals}
          footer={null}
          width={600}
          destroyOnClose
        >
          {selectedUser && (
            <UserProfile
              userId={selectedUser.id}
              onUserUpdate={handleUserUpdate}
              onUserDelete={handleUserDeleted}
            />
          )}
        </Modal>
      </DashboardLayout>
    </RouteWrapper>
  );
}
