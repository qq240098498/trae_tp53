import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

type TagVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'purple';

interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: TagVariant;
  size?: 'sm' | 'md';
}

const variantClasses: Record<TagVariant, string> = {
  default: 'bg-surface-100 text-gray-600 border-surface-200',
  primary: 'bg-primary-50 text-primary-600 border-primary-200',
  success: 'bg-accent-50 text-accent-600 border-accent-200',
  warning: 'bg-warning-50 text-warning-600 border-warning-200',
  danger: 'bg-red-50 text-red-600 border-red-200',
  info: 'bg-blue-50 text-blue-600 border-blue-200',
  purple: 'bg-purple-50 text-purple-600 border-purple-200',
};

const sizeClasses = {
  sm: 'h-5 px-2 text-xs',
  md: 'h-6 px-2.5 text-xs',
};

const Tag = forwardRef<HTMLSpanElement, TagProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md border font-medium',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Tag.displayName = 'Tag';

export default Tag;
