'use client';

import { useState, useEffect } from 'react';
import {
  List,
  Pagination,
  Input,
  Select,
  Row,
  Col,
  Spin,
  Alert,
  Empty,
  Space,
  Typography,
} from 'antd';
import { SearchOutlined, UserOutlined } from '@ant-design/icons';
import { UserCard } from './UserCard';
import { UserService, User, GetUsersParams } from '@/services/userService';
import { useAuth } from '@/hooks/useAuth';

const { Search } = Input;
const { Option } = Select;
const { Title } = Typography;

interface UserListProps {
  onUserSelect?: (user: User) => void;
  onUserEdit?: (user: User) => void;
  onUserDelete?: (user: User) => void;
  showActions?: boolean;
}

export function UserList({
  onUserSelect,
  onUserEdit,
  onUserDelete,
  showActions = true,
}: UserListProps) {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
    total: 0,
  });
  const [filters, setFilters] = useState<GetUsersParams>({
    page: 1,
    limit: 12,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const fetchUsers = async (params: GetUsersParams) => {
    try {
      setLoading(true);
      setError(null);
      const response = await UserService.getUsers(params);

      setUsers(response.data);
      setPagination({
        current: response.meta.page,
        pageSize: response.meta.limit,
        total: response.meta.total,
      });
    } catch (err: any) {
      setError(err.error || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(filters);
  }, [filters]);

  const handleSearch = (value: string) => {
    const newFilters = {
      ...filters,
      search: value || undefined,
      page: 1,
    };
    setFilters(newFilters);
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('-') as [
      'createdAt' | 'firstName' | 'lastName' | 'email',
      'asc' | 'desc',
    ];
    const newFilters = {
      ...filters,
      sortBy,
      sortOrder,
      page: 1,
    };
    setFilters(newFilters);
  };

  const handlePageChange = (page: number, pageSize?: number) => {
    const newFilters = {
      ...filters,
      page,
      limit: pageSize || filters.limit,
    };
    setFilters(newFilters);
  };

  const handleUserView = (user: User) => {
    onUserSelect?.(user);
  };

  const handleUserEdit = (user: User) => {
    onUserEdit?.(user);
  };

  const handleUserDelete = (user: User) => {
    onUserDelete?.(user);
  };

  if (error) {
    return (
      <Alert
        message='Error'
        description={error}
        type='error'
        showIcon
        action={
          <button
            onClick={() => fetchUsers(filters)}
            className='text-blue-600 hover:text-blue-800'
          >
            Retry
          </button>
        }
      />
    );
  }

  return (
    <div className='space-y-6'>
      <div>
        <Title level={2} className='!mb-4'>
          <UserOutlined className='mr-2' />
          Team Members
        </Title>

        <Row gutter={[16, 16]} className='mb-6'>
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder='Search users...'
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={handleSearch}
              className='w-full'
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder='Sort by'
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={handleSortChange}
              className='w-full'
            >
              <Option value='createdAt-desc'>Newest First</Option>
              <Option value='createdAt-asc'>Oldest First</Option>
              <Option value='firstName-asc'>First Name A-Z</Option>
              <Option value='firstName-desc'>First Name Z-A</Option>
              <Option value='lastName-asc'>Last Name A-Z</Option>
              <Option value='lastName-desc'>Last Name Z-A</Option>
              <Option value='email-asc'>Email A-Z</Option>
              <Option value='email-desc'>Email Z-A</Option>
            </Select>
          </Col>
        </Row>
      </div>

      <Spin spinning={loading}>
        {users.length === 0 && !loading ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description='No users found'
          />
        ) : (
          <>
            <List
              grid={{
                gutter: 16,
                xs: 1,
                sm: 1,
                md: 2,
                lg: 2,
                xl: 3,
                xxl: 4,
              }}
              dataSource={users}
              renderItem={user => (
                <List.Item>
                  <UserCard
                    user={user}
                    onView={handleUserView}
                    onEdit={handleUserEdit}
                    onDelete={handleUserDelete}
                    showActions={showActions}
                    currentUserId={currentUser?.id}
                  />
                </List.Item>
              )}
            />

            {pagination.total > pagination.pageSize && (
              <div className='flex justify-center mt-6'>
                <Pagination
                  current={pagination.current}
                  pageSize={pagination.pageSize}
                  total={pagination.total}
                  showSizeChanger
                  showQuickJumper
                  showTotal={(total, range) =>
                    `${range[0]}-${range[1]} of ${total} users`
                  }
                  onChange={handlePageChange}
                  onShowSizeChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </Spin>
    </div>
  );
}
