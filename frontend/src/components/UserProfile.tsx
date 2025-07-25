'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Avatar,
  Typography,
  Button,
  Form,
  Input,
  Upload,
  message,
  Spin,
  Alert,
  Divider,
  Row,
  Col,
  Statistic,
  Modal,
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  CameraOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import { UserService, User, UpdateUserData } from '@/services/userService';
import { useAuth } from '@/hooks/useAuth';

const { Title, Text } = Typography;
const { confirm } = Modal;

interface UserProfileProps {
  userId?: string;
  onUserUpdate?: (user: User) => void;
  onUserDelete?: (userId: string) => void;
}

export function UserProfile({
  userId,
  onUserUpdate,
  onUserDelete,
}: UserProfileProps) {
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const targetUserId = userId || currentUser?.id;
  const isCurrentUser = currentUser?.id === targetUserId;

  const fetchUser = async () => {
    if (!targetUserId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await UserService.getUserById(targetUserId);
      setUser(response.data.user);

      // Initialize form with user data
      form.setFieldsValue({
        firstName: response.data.user.firstName,
        lastName: response.data.user.lastName,
      });

      // Set avatar in file list if exists
      if (response.data.user.avatar) {
        setFileList([
          {
            uid: '-1',
            name: 'avatar',
            status: 'done',
            url: response.data.user.avatar,
          },
        ]);
      }
    } catch (err: any) {
      setError(err.error || 'Failed to fetch user profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [targetUserId]);

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    form.resetFields();
    // Reset file list to original avatar
    if (user?.avatar) {
      setFileList([
        {
          uid: '-1',
          name: 'avatar',
          status: 'done',
          url: user.avatar,
        },
      ]);
    } else {
      setFileList([]);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);
      const values = await form.validateFields();

      const updateData: UpdateUserData = {
        firstName: values.firstName,
        lastName: values.lastName,
      };

      // Handle avatar upload
      if (fileList.length > 0 && fileList[0].originFileObj) {
        const avatarResponse = await UserService.uploadAvatar(
          fileList[0].originFileObj
        );
        updateData.avatar = avatarResponse.url;
      } else if (fileList.length === 0) {
        updateData.avatar = null;
      }

      const response = await UserService.updateUser(user.id, updateData);
      setUser(response.data.user);
      setEditing(false);
      onUserUpdate?.(response.data.user);
      message.success('Profile updated successfully');
    } catch (err: any) {
      message.error(err.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!user) return;

    confirm({
      title: 'Delete Account',
      icon: <ExclamationCircleOutlined />,
      content:
        'Are you sure you want to delete your account? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await UserService.deleteUser(user.id);
          message.success('Account deleted successfully');
          onUserDelete?.(user.id);
        } catch (err: any) {
          message.error(err.error || 'Failed to delete account');
        }
      },
    });
  };

  const uploadProps: UploadProps = {
    name: 'avatar',
    listType: 'picture-circle',
    fileList,
    beforeUpload: file => {
      const isJpgOrPng =
        file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJpgOrPng) {
        message.error('You can only upload JPG/PNG files!');
        return false;
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('Image must smaller than 2MB!');
        return false;
      }
      return false; // Prevent auto upload
    },
    onChange: ({ fileList: newFileList }) => {
      setFileList(newFileList);
    },
    onRemove: () => {
      setFileList([]);
    },
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <Spin size='large' />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message='Error'
        description={error}
        type='error'
        showIcon
        action={
          <Button onClick={fetchUser} type='primary'>
            Retry
          </Button>
        }
      />
    );
  }

  if (!user) {
    return (
      <Alert
        message='User not found'
        description='The requested user profile could not be found.'
        type='warning'
        showIcon
      />
    );
  }

  return (
    <div className='max-w-4xl mx-auto space-y-6'>
      <Card>
        <div className='text-center mb-6'>
          {editing ? (
            <div className='space-y-4'>
              <Upload {...uploadProps}>
                {fileList.length === 0 && (
                  <div className='flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-full hover:border-blue-500 cursor-pointer'>
                    <CameraOutlined className='text-2xl text-gray-400' />
                    <Text type='secondary' className='text-xs mt-1'>
                      Upload
                    </Text>
                  </div>
                )}
              </Upload>
            </div>
          ) : (
            <Avatar
              size={128}
              src={user.avatar}
              icon={<UserOutlined />}
              className='mb-4'
            >
              {!user.avatar && getInitials(user.firstName, user.lastName)}
            </Avatar>
          )}

          {editing ? (
            <Form form={form} layout='vertical' className='max-w-md mx-auto'>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name='firstName'
                    label='First Name'
                    rules={[
                      { required: true, message: 'Please enter first name' },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name='lastName'
                    label='Last Name'
                    rules={[
                      { required: true, message: 'Please enter last name' },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          ) : (
            <div>
              <Title level={2} className='!mb-2'>
                {user.firstName} {user.lastName}
              </Title>
              <Text type='secondary' className='text-lg'>
                @{user.username}
              </Text>
              <br />
              <Text type='secondary'>{user.email}</Text>
            </div>
          )}

          {isCurrentUser && (
            <div className='mt-4 space-x-2'>
              {editing ? (
                <>
                  <Button
                    type='primary'
                    icon={<SaveOutlined />}
                    onClick={handleSave}
                    loading={saving}
                  >
                    Save Changes
                  </Button>
                  <Button icon={<CloseOutlined />} onClick={handleCancel}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  type='primary'
                  icon={<EditOutlined />}
                  onClick={handleEdit}
                >
                  Edit Profile
                </Button>
              )}
            </div>
          )}
        </div>

        <Divider />

        <Row gutter={[24, 24]}>
          <Col xs={24} sm={8}>
            <Statistic
              title='Projects'
              value={user._count?.projects || 0}
              prefix={<UserOutlined />}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic
              title='Tasks Assigned'
              value={user._count?.assignedTasks || 0}
              prefix={<UserOutlined />}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic
              title='Comments'
              value={user._count?.comments || 0}
              prefix={<UserOutlined />}
            />
          </Col>
        </Row>

        <Divider />

        <div className='space-y-2'>
          <div>
            <Text strong>Member since:</Text>
            <Text className='ml-2'>{formatDate(user.createdAt)}</Text>
          </div>
          <div>
            <Text strong>Last updated:</Text>
            <Text className='ml-2'>{formatDate(user.updatedAt)}</Text>
          </div>
        </div>

        {isCurrentUser && (
          <>
            <Divider />
            <div className='text-center'>
              <Button
                type='primary'
                danger
                icon={<DeleteOutlined />}
                onClick={handleDelete}
              >
                Delete Account
              </Button>
              <Text type='secondary' className='block mt-2 text-sm'>
                This action cannot be undone
              </Text>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
