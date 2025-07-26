'use client';

import React, { useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  message,
  Avatar,
} from 'antd';
import { UserOutlined } from '@ant-design/icons';
import MDEditor from '@uiw/react-md-editor';
import {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  TaskStatus,
  TaskPriority,
  User,
} from '../types/task';
import dayjs from 'dayjs';

const { Option } = Select;

interface TaskFormProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (data: CreateTaskInput | UpdateTaskInput) => Promise<void>;
  task?: Task | null;
  projectId?: string;
  projectMembers?: User[];
  loading?: boolean;
}

const TaskForm: React.FC<TaskFormProps> = ({
  visible,
  onCancel,
  onSubmit,
  task,
  projectId,
  projectMembers = [],
  loading = false,
}) => {
  const [form] = Form.useForm();
  const [description, setDescription] = React.useState<string>('');

  const isEditing = !!task;

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

  // Initialize form when task changes
  useEffect(() => {
    if (visible) {
      if (isEditing && task) {
        form.setFieldsValue({
          title: task.title,
          status: task.status,
          priority: task.priority,
          assigneeId: task.assigneeId,
          dueDate: task.dueDate ? dayjs(task.dueDate) : null,
        });
        setDescription(task.description || '');
      } else {
        form.setFieldsValue({
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
        });
        setDescription('');
      }
    }
  }, [visible, task, isEditing, form]);

  // Handle form submission
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const formData = {
        ...values,
        description: description || null,
        dueDate: values.dueDate ? values.dueDate.toISOString() : null,
        assigneeId: values.assigneeId || null,
      };

      if (!isEditing) {
        formData.projectId = projectId;
      }

      await onSubmit(formData);
      handleCancel();
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    form.resetFields();
    setDescription('');
    onCancel();
  };

  // Disable past dates for due date
  const disabledDate = (current: dayjs.Dayjs) => {
    return current && current < dayjs().startOf('day');
  };

  return (
    <Modal
      title={isEditing ? 'Edit Task' : 'Create New Task'}
      open={visible}
      onCancel={handleCancel}
      width={800}
      footer={[
        <Button key='cancel' onClick={handleCancel}>
          Cancel
        </Button>,
        <Button
          key='submit'
          type='primary'
          loading={loading}
          onClick={handleSubmit}
        >
          {isEditing ? 'Update Task' : 'Create Task'}
        </Button>,
      ]}
      destroyOnClose
    >
      <Form form={form} layout='vertical' requiredMark={false}>
        {/* Title */}
        <Form.Item
          name='title'
          label='Task Title'
          rules={[
            { required: true, message: 'Please enter a task title' },
            { max: 200, message: 'Title must be less than 200 characters' },
          ]}
        >
          <Input placeholder='Enter task title...' maxLength={200} showCount />
        </Form.Item>

        {/* Description */}
        <Form.Item label='Description'>
          <div data-color-mode='light'>
            <MDEditor
              value={description}
              onChange={val => setDescription(val || '')}
              preview='edit'
              height={200}
              visibleDragBar={false}
              textareaProps={{
                placeholder: 'Enter task description...',
                style: { fontSize: 14 },
              }}
            />
          </div>
        </Form.Item>

        {/* Status and Priority Row */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <Form.Item
            name='status'
            label='Status'
            rules={[{ required: true, message: 'Please select a status' }]}
          >
            <Select placeholder='Select status'>
              {statusOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  <div className='flex items-center'>
                    <div
                      className='w-3 h-3 rounded-full mr-2'
                      style={{ backgroundColor: option.color }}
                    />
                    {option.label}
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name='priority'
            label='Priority'
            rules={[{ required: true, message: 'Please select a priority' }]}
          >
            <Select placeholder='Select priority'>
              {priorityOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  <div className='flex items-center'>
                    <div
                      className='w-3 h-3 rounded-full mr-2'
                      style={{ backgroundColor: option.color }}
                    />
                    {option.label}
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>
        </div>

        {/* Assignee and Due Date Row */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <Form.Item name='assigneeId' label='Assignee'>
            <Select
              placeholder='Select assignee'
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.children as string)
                  ?.toLowerCase()
                  .includes(input.toLowerCase())
              }
            >
              {projectMembers.map(member => (
                <Option key={member.id} value={member.id}>
                  <div className='flex items-center'>
                    <Avatar
                      size='small'
                      src={member.avatar}
                      icon={<UserOutlined />}
                      className='mr-2'
                    >
                      {!member.avatar &&
                        `${member.firstName[0]}${member.lastName[0]}`}
                    </Avatar>
                    {member.firstName} {member.lastName}
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name='dueDate' label='Due Date'>
            <DatePicker
              className='w-full'
              placeholder='Select due date'
              disabledDate={disabledDate}
              showTime={{ format: 'HH:mm' }}
              format='YYYY-MM-DD HH:mm'
            />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
};

export default TaskForm;
