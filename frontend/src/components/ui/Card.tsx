'use client';

import React from 'react';
import { Card as AntCard, CardProps as AntCardProps } from 'antd';
import { cn } from '@/lib/utils';

export interface CardProps extends Omit<AntCardProps, 'variant'> {
  variant?: 'default' | 'outlined' | 'elevated' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      hover = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const cardClasses = cn(
      'card-base',
      {
        // Variant styles
        'border-neutral-200 bg-white shadow-sm': variant === 'default',
        'border-neutral-300 bg-white shadow-none': variant === 'outlined',
        'border-neutral-200 bg-white shadow-lg': variant === 'elevated',
        'border-neutral-200 bg-neutral-50 shadow-sm': variant === 'filled',
        // Padding styles
        'p-0': padding === 'none',
        'p-3': padding === 'sm',
        'p-6': padding === 'md',
        'p-8': padding === 'lg',
        // Hover effect
        'hover:shadow-md transition-shadow duration-200': hover,
      },
      className
    );

    return (
      <AntCard
        ref={ref}
        className={cardClasses}
        bordered={variant === 'outlined'}
        {...props}
      >
        {children}
      </AntCard>
    );
  }
);

Card.displayName = 'Card';

export { Card };
export default Card;
