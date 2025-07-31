'use client';

import React from 'react';
import { Button as AntButton, ButtonProps as AntButtonProps } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends Omit<AntButtonProps, 'size' | 'type' | 'variant'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const getAntVariant = () => {
      switch (variant) {
        case 'primary':
          return 'primary';
        case 'secondary':
          return 'default';
        case 'outline':
          return 'default';
        case 'ghost':
          return 'text';
        case 'link':
          return 'link';
        case 'danger':
          return 'primary';
        default:
          return 'default';
      }
    };

    const getAntSize = () => {
      switch (size) {
        case 'sm':
          return 'small';
        case 'md':
          return 'middle';
        case 'lg':
          return 'large';
        default:
          return 'middle';
      }
    };

    const buttonClasses = cn(
      'btn-base',
      {
        // Variant styles
        'border-primary-500 bg-primary-500 text-white hover:bg-primary-600 hover:border-primary-600':
          variant === 'primary',
        'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400':
          variant === 'secondary',
        'border-primary-500 bg-transparent text-primary-500 hover:bg-primary-50':
          variant === 'outline',
        'border-transparent bg-transparent text-neutral-700 hover:bg-neutral-100':
          variant === 'ghost',
        'border-transparent bg-transparent text-primary-500 hover:text-primary-600 p-0':
          variant === 'link',
        'border-error-500 bg-error-500 text-white hover:bg-error-600 hover:border-error-600':
          variant === 'danger',
        // Size styles
        'h-6 px-2 text-xs': size === 'sm',
        'h-8 px-4 text-sm': size === 'md',
        'h-10 px-6 text-base': size === 'lg',
      },
      className
    );

    return (
      <AntButton
        ref={ref}
        type={getAntVariant()}
        size={getAntSize()}
        loading={isLoading}
        disabled={disabled || isLoading}
        className={buttonClasses}
        icon={isLoading ? <LoadingOutlined /> : leftIcon ? leftIcon : undefined}
        {...props}
      >
        <span className='flex items-center gap-2'>
          {children}
          {rightIcon && !isLoading && rightIcon}
        </span>
      </AntButton>
    );
  }
);

Button.displayName = 'Button';

export { Button };
export default Button;
