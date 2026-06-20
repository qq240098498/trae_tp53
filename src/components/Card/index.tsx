import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover = false, header, footer, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col rounded-lg border border-surface-200 bg-white transition-all duration-200',
          hover && 'hover:shadow-lg hover:-translate-y-0.5 cursor-pointer',
          className
        )}
        {...props}
      >
        {header && (
          <div className="flex items-center justify-between border-b border-surface-100 px-5 py-4">
            {header}
          </div>
        )}
        <div className="flex-1 p-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-surface-100 px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
