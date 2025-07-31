'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  List,
  Avatar,
  Button,
  Input,
  message,
  Spin,
  Empty,
  Tooltip,
} from 'antd';
import { SendOutlined, UserOutlined, CommentOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '../services/taskService';
import { Comment, CreateCommentInput } from '../types/task';
import { useSession } from 'next-auth/react';

const { TextArea } = Input;

interface TaskCommentsProps {
  taskId: string;
  className?: string;
}

const TaskComments: React.FC<TaskCommentsProps> = ({ taskId, className }) => {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  // Query for comments
  const {
    data: commentsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['task-comments', taskId],
    queryFn: () => taskService.getTaskComments(taskId),
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  // Mutation for adding comments
  const addCommentMutation = useMutation({
    mutationFn: (data: CreateCommentInput) => taskService.addTaskComment(data),
    onSuccess: () => {
      setNewComment('');
      setIsSubmitting(false);
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] });
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      message.success('Comment added successfully');
    },
    onError: (error: any) => {
      setIsSubmitting(false);
      message.error(error.response?.data?.error || 'Failed to add comment');
    },
  });

  // Handle comment submission
  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      message.warning('Please enter a comment');
      return;
    }

    if (!session?.user?.id) {
      message.error('You must be logged in to comment');
      return;
    }

    setIsSubmitting(true);
    addCommentMutation.mutate({
      content: newComment.trim(),
      taskId,
    });
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmitComment();
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const comments = commentsData?.data || [];

  if (error) {
    return (
      <Card className={className} title='Comments'>
        <div className='text-center py-8'>
          <p className='text-red-500 mb-4'>Failed to load comments</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={className}
      title={
        <div className='flex items-center'>
          <CommentOutlined className='mr-2' />
          Comments ({comments.length})
        </div>
      }
    >
      {/* Comment input */}
      <div className='mb-4'>
        <TextArea
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder='Add a comment... (Ctrl+Enter to submit)'
          rows={3}
          maxLength={1000}
          showCount
          disabled={isSubmitting}
        />
        <div className='flex justify-between items-center mt-2'>
          <span className='text-xs text-gray-500'>
            Press Ctrl+Enter to submit
          </span>
          <Button
            type='primary'
            icon={<SendOutlined />}
            onClick={handleSubmitComment}
            loading={isSubmitting}
            disabled={!newComment.trim()}
          >
            Add Comment
          </Button>
        </div>
      </div>

      {/* Comments list */}
      {isLoading ? (
        <div className='text-center py-8'>
          <Spin size='large' />
        </div>
      ) : comments.length === 0 ? (
        <Empty
          description='No comments yet'
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <List
          dataSource={comments}
          renderItem={(comment: Comment) => (
            <List.Item key={comment.id} className='border-0 px-0'>
              <List.Item.Meta
                avatar={
                  <Tooltip
                    title={`${comment.author.firstName} ${comment.author.lastName}`}
                  >
                    <Avatar
                      src={comment.author.avatar}
                      icon={<UserOutlined />}
                      size='default'
                    >
                      {!comment.author.avatar &&
                        `${comment.author.firstName[0]}${comment.author.lastName[0]}`}
                    </Avatar>
                  </Tooltip>
                }
                title={
                  <div className='flex items-center justify-between'>
                    <span className='font-medium text-sm'>
                      {comment.author.firstName} {comment.author.lastName}
                    </span>
                    <span className='text-xs text-gray-500'>
                      {formatRelativeTime(comment.createdAt)}
                    </span>
                  </div>
                }
                description={
                  <div className='mt-1'>
                    <p className='text-gray-700 whitespace-pre-wrap'>
                      {comment.content}
                    </p>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  );
};

export default TaskComments;
