'use client';

import React from 'react';
import { Modal as AntModal, ModalProps as AntModalProps } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { cn } from '@/lib/utils';
import Button from './Button';

export interface ModalProps extends Omit<AntModalProps, 'size'> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className,
  children,
  onCancel,
  ...props
}) => {
  const getModalWidth = () => {
    switch (size) {
      case 'sm':
        return 400;
      case 'md':
        return 600;
      case 'lg':
        return 800;
      case 'xl':
        return 1000;
      case 'full':
        return '90vw';
      default:
        return 600;
    }
  };

  const modalClasses = cn(
    'rounded-lg overflow-hidden',
    {
      'max-h-[90vh]': size !== 'full',
      'h-[90vh]': size === 'full',
    },
    className
  );

  const handleCancel = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onCancel) {
      onCancel(e);
    }
  };

  return (
    <AntModal
      width={getModalWidth()}
      className={modalClasses}
      maskClosable={closeOnOverlayClick}
      keyboard={closeOnEscape}
      closeIcon={
        showCloseButton ? (
          <CloseOutlined className='text-neutral-400 hover:text-neutral-600' />
        ) : null
      }
      onCancel={handleCancel}
      styles={{
        mask: {
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(4px)',
        },
        content: {
          padding: 0,
          borderRadius: '8px',
          overflow: 'hidden',
        },
        header: {
          padding: '20px 24px',
          borderBottom: '1px solid #e8e8e8',
          marginBottom: 0,
        },
        body: {
          padding: '24px',
          maxHeight: size === 'full' ? 'calc(90vh - 120px)' : '60vh',
          overflowY: 'auto',
        },
        footer: {
          padding: '16px 24px',
          borderTop: '1px solid #e8e8e8',
          marginTop: 0,
        },
      }}
      {...props}
    >
      {children}
    </AntModal>
  );
};

Modal.displayName = 'Modal';

// Modal Header component
export interface ModalHeaderProps {
  children: React.ReactNode;
  className?: string;
}

const ModalHeader: React.FC<ModalHeaderProps> = ({ children, className }) => {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <h2 className='text-lg font-semibold text-neutral-800'>{children}</h2>
    </div>
  );
};

// Modal Body component
export interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

const ModalBody: React.FC<ModalBodyProps> = ({ children, className }) => {
  return <div className={cn('py-4', className)}>{children}</div>;
};

// Modal Footer component
export interface ModalFooterProps {
  children?: React.ReactNode;
  className?: string;
  onCancel?: () => void;
  onConfirm?: () => void;
  cancelText?: string;
  confirmText?: string;
  confirmLoading?: boolean;
  confirmDisabled?: boolean;
  showCancel?: boolean;
  showConfirm?: boolean;
}

const ModalFooter: React.FC<ModalFooterProps> = ({
  children,
  className,
  onCancel,
  onConfirm,
  cancelText = 'Cancel',
  confirmText = 'Confirm',
  confirmLoading = false,
  confirmDisabled = false,
  showCancel = true,
  showConfirm = true,
}) => {
  if (children) {
    return (
      <div className={cn('flex justify-end gap-3', className)}>{children}</div>
    );
  }

  return (
    <div className={cn('flex justify-end gap-3', className)}>
      {showCancel && (
        <Button variant='secondary' onClick={onCancel}>
          {cancelText}
        </Button>
      )}
      {showConfirm && (
        <Button
          variant='primary'
          onClick={onConfirm}
          isLoading={confirmLoading}
          disabled={confirmDisabled}
        >
          {confirmText}
        </Button>
      )}
    </div>
  );
};

export { Modal, ModalHeader, ModalBody, ModalFooter };
export default Modal;
