'use client';

import React, { useState } from 'react';
import {
  Table,
  Avatar,
  Tag,
  Button,
  Dropdown,
  Modal,
  Form,
  Select,
  Input,
  message,
  Space,
  Popconfirm,
  Typography,
} from 'antd';
import {
  UserAddOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  ProjectService,
  Project,
  ProjectMember,
} from '../services/projectService';
import { UserService, User } from '../services/userService';

const { Option } = Select;
const { Text } = Typography;

interface ProjectMemberManagementProps {
  project: Project;
  currentUserId?: string;
  onMemberChange?: () => void;
}

interface AddMemberFormData {
  userId: string;
  role: 'ADMIN' | 'MEMBER' | 'VIEWER';
}

export const ProjectMemberManagement: React.FC<
  ProjectMemberManagementProps
> = ({ project, currentUserId, onMemberChange }) => {
  const [addMemberVisible, setAddMemberVisible] = useState(false);
  const [editMemberVisible, setEditMemberVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ProjectMember | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [form] = Form.useForm();

  const isOwner = currentUserId === project.ownerId;
  const isAdmin = project.members.some(
    member => member.userId === currentUserId && member.role === 'ADMIN'
  );
  const canManageMembers = isOwner || isAdmin;

  const searchUsers = async (search: string) => {
    if (!search.trim()) {
      setUsers([]);
      return;
    }

    setSearchingUsers(true);
    try {
      const response = await UserService.getUsers({ search, limit: 20 });
      // Filter out users who are already members
      const existingMemberIds = new Set([
        project.ownerId,
        ...project.members.map(m => m.userId),
      ]);
      const availableUsers = response.data.filter(
        user => !existingMemberIds.has(user.id)
      );
      setUsers(availableUsers);
    } catch (error: any) {
      message.error('Failed to search users');
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleAddMember = async (values: AddMemberFormData) => {
    setLoading(true);
    try {
      await ProjectService.addMember(project.id, values);
      message.success('Member added successfully');
      setAddMemberVisible(false);
      form.resetFields();
      setUsers([]);
      onMemberChange?.();
    } catch (error: any) {
      message.error(error.error || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMember = async (values: {
    role: 'ADMIN' | 'MEMBER' | 'VIEWER';
  }) => {
    if (!selectedMember) return;

    setLoading(true);
    try {
      await ProjectService.updateMember(
        project.id,
        selectedMember.userId,
        values
      );
      message.success('Member role updated successfully');
      setEditMemberVisible(false);
      setSelectedMember(null);
      onMemberChange?.();
    } catch (error: any) {
      message.error(error.error || 'Failed to update member role');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (member: ProjectMember) => {
    setLoading(true);
    try {
      await ProjectService.removeMember(project.id, member.userId);
      message.success('Member removed successfully');
      onMemberChange?.();
    } catch (error: any) {
      message.error(error.error || 'Failed to remove member');
    } finally {
      setLoading(false);
    }
  };

  const openEditMember = (member: ProjectMember) => {
    setSelectedMember(member);
    form.setFieldsValue({ role: member.role });
    setEditMemberVisible(true);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'gold';
      case 'ADMIN':
        return 'red';
      case 'MEMBER':
        return 'blue';
      case 'VIEWER':
        return 'default';
      default:
        return 'default';
    }
  };

  const canEditMember = (member: ProjectMember) => {
    if (!canManageMembers) return false;
    if (member.userId === project.ownerId) return false; // Can't edit owner
    if (member.userId === currentUserId) return false; // Can't edit self
    if (!isOwner && member.role === 'ADMIN') return false; // Only owner can edit admins
    return true;
  };

  const canRemoveMember = (member: ProjectMember) => {
    if (!canManageMembers) return false;
    if (member.userId === project.ownerId) return false; // Can't remove owner
    if (!isOwner && member.role === 'ADMIN') return false; // Only owner can remove admins
    return true;
  };

  const columns = [
    {
      title: 'Member',
      key: 'member',
      render: (
        record: ProjectMember | { user: typeof project.owner; role: string }
      ) => (
        <div className='flex items-center space-x-3'>
          <Avatar
            src={record.user.avatar}
            icon={!record.user.avatar && <UserOutlined />}
          >
            {!record.user.avatar &&
              `${record.user.firstName[0]}${record.user.lastName[0]}`}
          </Avatar>
          <div>
            <div className='font-medium'>
              {record.user.firstName} {record.user.lastName}
            </div>
            <div className='text-sm text-gray-500'>{record.user.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Role',
      key: 'role',
      render: (
        record: ProjectMember | { user: typeof project.owner; role: string }
      ) => <Tag color={getRoleColor(record.role)}>{record.role}</Tag>,
    },
    {
      title: 'Joined',
      key: 'joined',
      render: (
        record: ProjectMember | { user: typeof project.owner; role: string }
      ) => {
        const date = 'joinedAt' in record ? record.joinedAt : project.createdAt;
        return new Date(date).toLocaleDateString();
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (
        record: ProjectMember | { user: typeof project.owner; role: string }
      ) => {
        if (record.role === 'OWNER') return null;

        const member = record as ProjectMember;
        const menuItems = [
          ...(canEditMember(member)
            ? [
                {
                  key: 'edit',
                  label: 'Change Role',
                  icon: <EditOutlined />,
                  onClick: () => openEditMember(member),
                },
              ]
            : []),
          ...(canRemoveMember(member)
            ? [
                {
                  key: 'remove',
                  label: 'Remove Member',
                  icon: <DeleteOutlined />,
                  danger: true,
                },
              ]
            : []),
        ];

        if (menuItems.length === 0) return null;

        return (
          <Dropdown
            menu={{
              items: menuItems,
              onClick: ({ key }) => {
                if (key === 'remove') {
                  Modal.confirm({
                    title: 'Remove Member',
                    content: `Are you sure you want to remove ${member.user.firstName} ${member.user.lastName} from this project?`,
                    okText: 'Remove',
                    okType: 'danger',
                    onOk: () => handleRemoveMember(member),
                  });
                }
              },
            }}
            trigger={['click']}
          >
            <Button type='text' icon={<MoreOutlined />} />
          </Dropdown>
        );
      },
    },
  ];

  // Combine owner and members for the table
  const tableData = [
    { user: project.owner, role: 'OWNER', joinedAt: project.createdAt },
    ...project.members,
  ];

  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <Text strong>Team Members</Text>
          <div className='text-sm text-gray-500'>
            Manage project members and their roles
          </div>
        </div>
        {canManageMembers && (
          <Button
            type='primary'
            icon={<UserAddOutlined />}
            onClick={() => setAddMemberVisible(true)}
          >
            Add Member
          </Button>
        )}
      </div>

      {/* Members Table */}
      <Table
        columns={columns}
        dataSource={tableData}
        rowKey={record => ('id' in record ? record.id : 'owner')}
        pagination={false}
        loading={loading}
      />

      {/* Add Member Modal */}
      <Modal
        title='Add Team Member'
        open={addMemberVisible}
        onCancel={() => {
          setAddMemberVisible(false);
          form.resetFields();
          setUsers([]);
        }}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout='vertical'
          onFinish={handleAddMember}
          className='mt-4'
        >
          <Form.Item
            name='userId'
            label='Select User'
            rules={[{ required: true, message: 'Please select a user' }]}
          >
            <Select
              showSearch
              placeholder='Search and select a user'
              filterOption={false}
              onSearch={searchUsers}
              loading={searchingUsers}
              notFoundContent={
                searchingUsers ? 'Searching...' : 'No users found'
              }
            >
              {users.map(user => (
                <Option key={user.id} value={user.id}>
                  <div className='flex items-center space-x-2'>
                    <Avatar
                      size='small'
                      src={user.avatar}
                      icon={!user.avatar && <UserOutlined />}
                    >
                      {!user.avatar &&
                        `${user.firstName[0]}${user.lastName[0]}`}
                    </Avatar>
                    <span>
                      {user.firstName} {user.lastName}
                    </span>
                    <span className='text-gray-500'>({user.email})</span>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name='role'
            label='Role'
            rules={[{ required: true, message: 'Please select a role' }]}
            initialValue='MEMBER'
          >
            <Select>
              <Option value='VIEWER'>
                Viewer - Can view project and tasks
              </Option>
              <Option value='MEMBER'>Member - Can create and edit tasks</Option>
              <Option value='ADMIN'>
                Admin - Can manage project and members
              </Option>
            </Select>
          </Form.Item>

          <Form.Item className='mb-0'>
            <div className='flex justify-end space-x-2'>
              <Button
                onClick={() => {
                  setAddMemberVisible(false);
                  form.resetFields();
                  setUsers([]);
                }}
              >
                Cancel
              </Button>
              <Button type='primary' htmlType='submit' loading={loading}>
                Add Member
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Member Modal */}
      <Modal
        title='Change Member Role'
        open={editMemberVisible}
        onCancel={() => {
          setEditMemberVisible(false);
          setSelectedMember(null);
        }}
        footer={null}
        width={400}
      >
        {selectedMember && (
          <div className='space-y-4'>
            <div className='flex items-center space-x-3 p-3 bg-gray-50 rounded-lg'>
              <Avatar
                src={selectedMember.user.avatar}
                icon={!selectedMember.user.avatar && <UserOutlined />}
              >
                {!selectedMember.user.avatar &&
                  `${selectedMember.user.firstName[0]}${selectedMember.user.lastName[0]}`}
              </Avatar>
              <div>
                <div className='font-medium'>
                  {selectedMember.user.firstName} {selectedMember.user.lastName}
                </div>
                <div className='text-sm text-gray-500'>
                  {selectedMember.user.email}
                </div>
              </div>
            </div>

            <Form form={form} layout='vertical' onFinish={handleUpdateMember}>
              <Form.Item
                name='role'
                label='New Role'
                rules={[{ required: true, message: 'Please select a role' }]}
              >
                <Select>
                  <Option value='VIEWER'>
                    Viewer - Can view project and tasks
                  </Option>
                  <Option value='MEMBER'>
                    Member - Can create and edit tasks
                  </Option>
                  {isOwner && (
                    <Option value='ADMIN'>
                      Admin - Can manage project and members
                    </Option>
                  )}
                </Select>
              </Form.Item>

              <Form.Item className='mb-0'>
                <div className='flex justify-end space-x-2'>
                  <Button
                    onClick={() => {
                      setEditMemberVisible(false);
                      setSelectedMember(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type='primary' htmlType='submit' loading={loading}>
                    Update Role
                  </Button>
                </div>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};
