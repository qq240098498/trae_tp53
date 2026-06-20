import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  count?: number | string;
  showZero?: boolean;
  dot?: boolean;
  maxCount?: number;
  variant?: BadgeVariant;
  offset?: [number, number];
}

const variantClasses: Record<BadgeVariant, string> = {
  primary: 'bg-primary-500',
  success: 'bg-accent-500',
  warning: 'bg-warning-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
};

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      count,
      showZero = false,
      dot = false,
      maxCount = 99,
      variant = 'danger',
      offset,
      children,
      ...props
    },
    ref
  ) => {
    const displayCount =
      typeof count === 'number' && count > maxCount ? `${maxCount}+` : count;
    const isHidden =
      !dot && (count === undefined || count === null || (count === 0 && !showZero));

    if (isHidden && !children) return null;

    const [offsetX = 0, offsetY = 0] = offset || [];
    const offsetStyle = offset
      ? { transform: `translate(${offsetX}px, ${offsetY}px)` }
      : undefined;

    return (
      <span
        ref={ref}
        className={cn('relative inline-flex', className)}
        {...props}
      >
        {children}
        {!isHidden && (
          <span
            className={cn(
              'absolute z-10 inline-flex items-center justify-center text-white font-medium',
              dot
                ? 'h-2 w-2 rounded-full'
                : 'min-w-[18px] h-[18px] px-1 text-[10px] leading-none rounded-full',
              variantClasses[variant]
            )}
            style={{
              top: 0,
              right: 0,
              transform: 'translate(50%, -50%)',
              ...offsetStyle,
            }}
          >
            {!dot && displayCount}
          </span>
        )}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
