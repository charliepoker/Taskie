'use client';

import React from 'react';
import { Card, Select, Input, DatePicker, Button, Space, Tag } from 'antd';
import {
  SearchOutlined,
  ClearOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { TaskStatus, TaskPriority, TaskFilters, User } from '../types/task';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

interface TaskFiltersProps {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  projectMembers?: User[];
  loading?: boolean;
}

const TaskFiltersComponent: React.FC<TaskFiltersProps> = ({
  filters,
  onFiltersChange,
  projectMembers = [],
  loading = false,
}) => {
  // Status options
  const statusOptions = [
    { label: 'To Do', value: TaskStatus.TODO, color: '#8c8c8c' },
    { label: 'In Progress', value: TaskStatus.IN_PROGRESS, color: '#0D65F2' },
    { label: 'In Review', value: TaskStatus.IN_REVIEW, color: '#DFB032' },
    { label: 'Done', value: TaskStatus.DONE, color: '#52c41a' },
  ];

  // Priority options
  const priorityOptions = [
    { label: 'Low', value: TaskPriority.LOW, color: '#52c41a' },
    { label: 'Medium', value: TaskPriority.MEDIUM, color: '#DFB032' },
    { label: 'High', value: TaskPriority.HIGH, color: '#fa8c16' },
    { label: 'Urgent', value: TaskPriority.URGENT, color: '#ff4d4f' },
  ];

  // Assignee options
  const assigneeOptions = projectMembers.map(member => ({
    label: `${member.firstName} ${member.lastName}`,
    value: member.id,
  }));

  // Handle filter changes
  const handleFilterChange = (key: keyof TaskFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  // Handle date range changes
  const handleDateRangeChange = (
    dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null,
    type: 'due' | 'created'
  ) => {
    if (dates) {
      const [start, end] = dates;
      if (type === 'due') {
        onFiltersChange({
          ...filters,
          dueAfter: start?.toISOString(),
          dueBefore: end?.toISOString(),
        });
      } else {
        onFiltersChange({
          ...filters,
          createdAfter: start?.toISOString(),
          createdBefore: end?.toISOString(),
        });
      }
    } else {
      if (type === 'due') {
        onFiltersChange({
          ...filters,
          dueAfter: undefined,
          dueBefore: undefined,
        });
      } else {
        onFiltersChange({
          ...filters,
          createdAfter: undefined,
          createdBefore: undefined,
        });
      }
    }
  };

  // Clear all filters
  const clearFilters = () => {
    onFiltersChange({});
  };

  // Count active filters
  const activeFiltersCount = Object.values(filters).filter(
    value => value !== undefined && value !== null && value !== ''
  ).length;

  // Get due date range value
  const dueDateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null =
    filters.dueAfter && filters.dueBefore
      ? [dayjs(filters.dueAfter), dayjs(filters.dueBefore)]
      : null;

  // Get created date range value
  const createdDateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null =
    filters.createdAfter && filters.createdBefore
      ? [dayjs(filters.createdAfter), dayjs(filters.createdBefore)]
      : null;

  return (
    <Card
      size='small'
      title={
        <div className='flex items-center'>
          <FilterOutlined className='mr-2' />
          Filters
          {activeFiltersCount > 0 && (
            <Tag color='blue' className='ml-2'>
              {activeFiltersCount}
            </Tag>
          )}
        </div>
      }
      extra={
        activeFiltersCount > 0 && (
          <Button
            type='text'
            size='small'
            icon={<ClearOutlined />}
            onClick={clearFilters}
          >
            Clear All
          </Button>
        )
      }
      className='mb-4'
    >
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
        {/* Search */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Search
          </label>
          <Input
            placeholder='Search tasks...'
            prefix={<SearchOutlined />}
            value={filters.search}
            onChange={e => handleFilterChange('search', e.target.value)}
            allowClear
          />
        </div>

        {/* Status */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Status
          </label>
          <Select
            placeholder='Select status'
            value={filters.status}
            onChange={value => handleFilterChange('status', value)}
            allowClear
            className='w-full'
            options={statusOptions.map(option => ({
              ...option,
              label: (
                <div className='flex items-center'>
                  <div
                    className='w-3 h-3 rounded-full mr-2'
                    style={{ backgroundColor: option.color }}
                  />
                  {option.label}
                </div>
              ),
            }))}
          />
        </div>

        {/* Priority */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Priority
          </label>
          <Select
            placeholder='Select priority'
            value={filters.priority}
            onChange={value => handleFilterChange('priority', value)}
            allowClear
            className='w-full'
            options={priorityOptions.map(option => ({
              ...option,
              label: (
                <div className='flex items-center'>
                  <div
                    className='w-3 h-3 rounded-full mr-2'
                    style={{ backgroundColor: option.color }}
                  />
                  {option.label}
                </div>
              ),
            }))}
          />
        </div>

        {/* Assignee */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Assignee
          </label>
          <Select
            placeholder='Select assignee'
            value={filters.assigneeId}
            onChange={value => handleFilterChange('assigneeId', value)}
            allowClear
            className='w-full'
            options={assigneeOptions}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          />
        </div>

        {/* Due Date Range */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Due Date Range
          </label>
          <RangePicker
            value={dueDateRange}
            onChange={dates => handleDateRangeChange(dates, 'due')}
            className='w-full'
            placeholder={['Start date', 'End date']}
          />
        </div>

        {/* Created Date Range */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Created Date Range
          </label>
          <RangePicker
            value={createdDateRange}
            onChange={dates => handleDateRangeChange(dates, 'created')}
            className='w-full'
            placeholder={['Start date', 'End date']}
          />
        </div>
      </div>
    </Card>
  );
};

export default TaskFiltersComponent;
