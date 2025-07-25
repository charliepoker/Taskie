'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, message, ColorPicker, Space } from 'antd';
import {
  ProjectService,
  Project,
  CreateProjectData,
  UpdateProjectData,
} from '../services/projectService';

const { TextArea } = Input;

interface ProjectFormProps {
  visible: boolean;
  project?: Project | null;
  onCancel: () => void;
  onSuccess: (project: Project) => void;
}

const DEFAULT_COLORS = [
  '#0D65F2', // Primary blue
  '#FEE9F0', // Secondary pink
  '#DFB032', // Accent gold
  '#52C41A', // Success green
  '#FF4D4F', // Error red
  '#FA8C16', // Warning orange
  '#722ED1', // Purple
  '#13C2C2', // Cyan
  '#EB2F96', // Magenta
  '#1890FF', // Blue
];

export const ProjectForm: React.FC<ProjectFormProps> = ({
  visible,
  project,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#0D65F2');

  const isEditing = !!project;

  useEffect(() => {
    if (visible) {
      if (project) {
        // Editing existing project
        form.setFieldsValue({
          name: project.name,
          description: project.description || '',
        });
        setSelectedColor(project.color);
      } else {
        // Creating new project
        form.resetFields();
        setSelectedColor('#0D65F2');
      }
    }
  }, [visible, project, form]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const projectData = {
        ...values,
        color: selectedColor,
      };

      let response;
      if (isEditing && project) {
        response = await ProjectService.updateProject(
          project.id,
          projectData as UpdateProjectData
        );
      } else {
        response = await ProjectService.createProject(
          projectData as CreateProjectData
        );
      }

      message.success(
        isEditing
          ? 'Project updated successfully'
          : 'Project created successfully'
      );
      onSuccess(response.data.project);
      handleCancel();
    } catch (error: any) {
      message.error(
        error.error || `Failed to ${isEditing ? 'update' : 'create'} project`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setSelectedColor('#0D65F2');
    onCancel();
  };

  const handleColorChange = (color: any) => {
    // Handle both string and color object from ColorPicker
    const colorValue = typeof color === 'string' ? color : color.toHexString();
    setSelectedColor(colorValue);
  };

  return (
    <Modal
      title={isEditing ? 'Edit Project' : 'Create New Project'}
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout='vertical'
        onFinish={handleSubmit}
        className='mt-4'
      >
        <Form.Item
          name='name'
          label='Project Name'
          rules={[
            { required: true, message: 'Please enter a project name' },
            {
              max: 100,
              message: 'Project name must be less than 100 characters',
            },
          ]}
        >
          <Input placeholder='Enter project name' size='large' />
        </Form.Item>

        <Form.Item
          name='description'
          label='Description'
          rules={[
            {
              max: 500,
              message: 'Description must be less than 500 characters',
            },
          ]}
        >
          <TextArea
            placeholder='Enter project description (optional)'
            rows={3}
            showCount
            maxLength={500}
          />
        </Form.Item>

        <Form.Item label='Project Color'>
          <div className='space-y-3'>
            {/* Color Picker */}
            <div className='flex items-center space-x-3'>
              <ColorPicker
                value={selectedColor}
                onChange={handleColorChange}
                showText
                size='large'
              />
              <span className='text-sm text-gray-500'>
                Choose a color to identify your project
              </span>
            </div>

            {/* Preset Colors */}
            <div>
              <p className='text-sm text-gray-600 mb-2'>Quick colors:</p>
              <div className='flex flex-wrap gap-2'>
                {DEFAULT_COLORS.map(color => (
                  <button
                    key={color}
                    type='button'
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      selectedColor === color
                        ? 'border-gray-400 scale-110'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>
        </Form.Item>

        <Form.Item className='mb-0 pt-4 border-t'>
          <div className='flex justify-end space-x-2'>
            <Button onClick={handleCancel}>Cancel</Button>
            <Button
              type='primary'
              htmlType='submit'
              loading={loading}
              size='large'
            >
              {isEditing ? 'Update Project' : 'Create Project'}
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};
