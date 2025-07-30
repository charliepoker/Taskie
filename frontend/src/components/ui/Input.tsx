'use client';

import React from 'react';
import { Input as AntInput, InputProps as AntInputProps } from 'antd';
import { cn } from '@/lib/utils';

export interface InputProps extends Omit<AntInputProps, 'variant' | 'size'> {
  variant?: 'default' | 'filled' | 'outlined';
  inputSize?: 'sm' | 'md' | 'lg';
  error?: boolean;
  helperText?: string;
  label?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<any, InputProps>(
  (
    {
      variant = 'default',
      inputSize = 'md',
      error = false,
      helperText,
      label,
      leftIcon,
      rightIcon,
      className,
      ...props
    },
    ref
  ) => {
    const inputClasses = cn(
      'input-base',
      {
        // Variant styles
        'border-neutral-300 bg-white': variant === 'default',
        'border-neutral-200 bg-neutral-50': variant === 'filled',
        'border-2 border-neutral-300 bg-white': variant === 'outlined',
        // Size styles
        'h-8 text-sm': inputSize === 'sm',
        'h-10 text-base': inputSize === 'md',
        'h-12 text-lg': inputSize === 'lg',
        // Error state
        'border-error-500 focus:border-error-500': error,
      },
      className
    );

    const getAntSize = () => {
      switch (inputSize) {
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

    return (
      <div className='w-full'>
        {label && (
          <label className='block text-sm font-medium text-neutral-700 mb-1'>
            {label}
          </label>
        )}
        <div className='relative'>
          {leftIcon && (
            <div className='absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400'>
              {leftIcon}
            </div>
          )}
          <AntInput
            ref={ref}
            size={getAntSize()}
            className={inputClasses}
            style={{
              paddingLeft: leftIcon ? '2.5rem' : undefined,
              paddingRight: rightIcon ? '2.5rem' : undefined,
            }}
            status={error ? 'error' : undefined}
            {...props}
          />
          {rightIcon && (
            <div className='absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400'>
              {rightIcon}
            </div>
          )}
        </div>
        {helperText && (
          <p
            className={cn(
              'mt-1 text-xs',
              error ? 'text-error-500' : 'text-neutral-500'
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// TextArea component
export interface TextAreaProps
  extends Omit<
    React.ComponentProps<typeof AntInput.TextArea>,
    'variant' | 'size'
  > {
  variant?: 'default' | 'filled' | 'outlined';
  inputSize?: 'sm' | 'md' | 'lg';
  error?: boolean;
  helperText?: string;
  label?: string;
}

const TextArea = React.forwardRef<any, TextAreaProps>(
  (
    {
      variant = 'default',
      inputSize = 'md',
      error = false,
      helperText,
      label,
      className,
      ...props
    },
    ref
  ) => {
    const textAreaClasses = cn(
      'input-base',
      {
        // Variant styles
        'border-neutral-300 bg-white': variant === 'default',
        'border-neutral-200 bg-neutral-50': variant === 'filled',
        'border-2 border-neutral-300 bg-white': variant === 'outlined',
        // Size styles
        'text-sm': inputSize === 'sm',
        'text-base': inputSize === 'md',
        'text-lg': inputSize === 'lg',
        // Error state
        'border-error-500 focus:border-error-500': error,
      },
      className
    );

    const getAntSize = () => {
      switch (inputSize) {
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

    return (
      <div className='w-full'>
        {label && (
          <label className='block text-sm font-medium text-neutral-700 mb-1'>
            {label}
          </label>
        )}
        <AntInput.TextArea
          ref={ref}
          size={getAntSize()}
          className={textAreaClasses}
          status={error ? 'error' : undefined}
          {...props}
        />
        {helperText && (
          <p
            className={cn(
              'mt-1 text-xs',
              error ? 'text-error-500' : 'text-neutral-500'
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';

export { Input, TextArea };
export default Input;
