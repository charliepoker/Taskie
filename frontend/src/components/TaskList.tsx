'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  message,
  Spin,
  Empty,
  Pagination,
  Modal,
  Space,
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '../services/taskService';
import {
  Task,
  TaskFilters,
  TaskQueryParams,
  CreateTaskInput,
  UpdateTaskInput,
  TaskStatus,
  User,
} from '../types/task';
import TaskCard from './TaskCard';
import TaskFilters from './TaskFilters';
import TaskForm from './TaskForm';
import TaskDetails from './TaskDetails';

const { confirm } = Modal;

interface TaskListProps {
  projectId?: string;
  projectMembers?: User[];
  showFilters?: boolean;
  showCreateButton?: boolean;
  pageSize?: number;
}

const TaskList: React.FC<TaskListProps> = ({
  projectId,
  projectMembers = [],
  showFilters = true,
  showCreateButton = true,
  pageSize = 20,
}) => {
  const [filters, setFilters] = useState<TaskFilters>({
    ...(projectId && { projectId }),
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const queryClient = useQueryClient();

  // Build query parameters
  const queryParams: TaskQueryParams = {
    ...filters,
    page: currentPage,
    limit: pageSize,
  };

  // Query for tasks
  const {
    data: tasksData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['tasks', queryParams],
    queryFn: () => taskService.getTasks(queryParams),
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: (data: CreateTaskInput) => taskService.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      message.success('Task created successfully');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || 'Failed to create task');
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskInput }) =>
      taskService.updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      message.success('Task updated successfully');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || 'Failed to update task');
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => taskService.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      message.success('Task deleted successfully');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || 'Failed to delete task');
    },
  });

  // Handle filter changes
  const handleFiltersChange = (newFilters: TaskFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle create task
  const handleCreateTask = () => {
    setSelectedTask(null);
    setIsEditing(false);
    setShowTaskForm(true);
  };

  // Handle edit task
  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsEditing(true);
    setShowTaskForm(true);
    setShowTaskDetails(false);
  };

  // Handle view task details
  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetails(true);
  };

  // Handle delete task
  const handleDeleteTask = (taskId: string) => {
    confirm({
      title: 'Delete Task',
      icon: <ExclamationCircleOutlined />,
      content:
        'Are you sure you want to delete this task? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        deleteTaskMutation.mutate(taskId);
        setShowTaskDetails(false);
      },
    });
  };

  // Handle form submission
  const handleFormSubmit = async (data: CreateTaskInput | UpdateTaskInput) => {
    if (isEditing && selectedTask) {
      await updateTaskMutation.mutateAsync({
        id: selectedTask.id,
        data: data as UpdateTaskInput,
      });
    } else {
      await createTaskMutation.mutateAsync(data as CreateTaskInput);
    }
  };

  // Handle drag and drop
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // If dropped outside a droppable area
    if (!destination) {
      return;
    }

    // If dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Find the task being moved
    const task = tasks.find(t => t.id === draggableId);
    if (!task) return;

    // Determine new status based on destination
    let newStatus: TaskStatus;
    switch (destination.droppableId) {
      case 'TODO':
        newStatus = TaskStatus.TODO;
        break;
      case 'IN_PROGRESS':
        newStatus = TaskStatus.IN_PROGRESS;
        break;
      case 'IN_REVIEW':
        newStatus = TaskStatus.IN_REVIEW;
        break;
      case 'DONE':
        newStatus = TaskStatus.DONE;
        break;
      default:
        return;
    }

    // Update task status if it changed
    if (task.status !== newStatus) {
      updateTaskMutation.mutate({
        id: task.id,
        data: { status: newStatus },
      });
    }
  };

  // Group tasks by status for kanban view
  const groupTasksByStatus = (tasks: Task[]) => {
    return {
      [TaskStatus.TODO]: tasks.filter(task => task.status === TaskStatus.TODO),
      [TaskStatus.IN_PROGRESS]: tasks.filter(
        task => task.status === TaskStatus.IN_PROGRESS
      ),
      [TaskStatus.IN_REVIEW]: tasks.filter(
        task => task.status === TaskStatus.IN_REVIEW
      ),
      [TaskStatus.DONE]: tasks.filter(task => task.status === TaskStatus.DONE),
    };
  };

  const tasks = tasksData?.data || [];
  const totalTasks = tasksData?.meta.total || 0;
  const groupedTasks = groupTasksByStatus(tasks);

  // Status column configuration
  const statusColumns = [
    { key: TaskStatus.TODO, title: 'To Do', color: '#8c8c8c' },
    { key: TaskStatus.IN_PROGRESS, title: 'In Progress', color: '#0D65F2' },
    { key: TaskStatus.IN_REVIEW, title: 'In Review', color: '#DFB032' },
    { key: TaskStatus.DONE, title: 'Done', color: '#52c41a' },
  ];

  if (error) {
    return (
      <div className='text-center py-8'>
        <p className='text-red-500 mb-4'>Failed to load tasks</p>
        <Button onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <h2 className='text-xl font-semibold text-gray-900'>
          Tasks ({totalTasks})
        </h2>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
            loading={isLoading}
          >
            Refresh
          </Button>
          {showCreateButton && (
            <Button
              type='primary'
              icon={<PlusOutlined />}
              onClick={handleCreateTask}
            >
              Create Task
            </Button>
          )}
        </Space>
      </div>

      {/* Filters */}
      {showFilters && (
        <TaskFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          projectMembers={projectMembers}
          loading={isLoading}
        />
      )}

      {/* Task Board */}
      {isLoading ? (
        <div className='text-center py-12'>
          <Spin size='large' />
        </div>
      ) : tasks.length === 0 ? (
        <Empty
          description='No tasks found'
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          {showCreateButton && (
            <Button type='primary' onClick={handleCreateTask}>
              Create First Task
            </Button>
          )}
        </Empty>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            {statusColumns.map(column => (
              <Card
                key={column.key}
                title={
                  <div className='flex items-center'>
                    <div
                      className='w-3 h-3 rounded-full mr-2'
                      style={{ backgroundColor: column.color }}
                    />
                    {column.title}
                    <span className='ml-2 text-sm text-gray-500'>
                      ({groupedTasks[column.key].length})
                    </span>
                  </div>
                }
                size='small'
                className='h-fit'
                bodyStyle={{ padding: '8px' }}
              >
                <Droppable droppableId={column.key}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[200px] transition-colors ${
                        snapshot.isDraggingOver ? 'bg-blue-50' : ''
                      }`}
                    >
                      {groupedTasks[column.key].map((task, index) => (
                        <Draggable
                          key={task.id}
                          draggableId={task.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <TaskCard
                                task={task}
                                onEdit={handleEditTask}
                                onDelete={handleDeleteTask}
                                onView={handleViewTask}
                                isDragging={snapshot.isDragging}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </Card>
            ))}
          </div>
        </DragDropContext>
      )}

      {/* Pagination */}
      {totalTasks > pageSize && (
        <div className='flex justify-center mt-6'>
          <Pagination
            current={currentPage}
            total={totalTasks}
            pageSize={pageSize}
            onChange={handlePageChange}
            showSizeChanger={false}
            showQuickJumper
            showTotal={(total, range) =>
              `${range[0]}-${range[1]} of ${total} tasks`
            }
          />
        </div>
      )}

      {/* Task Form Modal */}
      <TaskForm
        visible={showTaskForm}
        onCancel={() => setShowTaskForm(false)}
        onSubmit={handleFormSubmit}
        task={isEditing ? selectedTask : null}
        projectId={projectId}
        projectMembers={projectMembers}
        loading={createTaskMutation.isPending || updateTaskMutation.isPending}
      />

      {/* Task Details Modal */}
      <TaskDetails
        visible={showTaskDetails}
        onClose={() => setShowTaskDetails(false)}
        task={selectedTask}
        onEdit={handleEditTask}
        onDelete={handleDeleteTask}
        loading={deleteTaskMutation.isPending}
      />
    </div>
  );
};

export default TaskList;
