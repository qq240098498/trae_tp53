import { useEffect, useRef, ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/Button';

interface ModalProps {
  open: boolean;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmLoading?: boolean;
  width?: string;
  className?: string;
  closeOnOverlayClick?: boolean;
  showClose?: boolean;
}

export default function Modal({
  open,
  title,
  children,
  footer,
  onClose,
  onConfirm,
  confirmText = '确认',
  cancelText = '取消',
  confirmLoading = false,
  width = 'max-w-lg',
  className,
  closeOnOverlayClick = true,
  showClose = true,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in-up"
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        className={cn(
          'flex flex-col w-full bg-white rounded-xl shadow-2xl max-h-[90vh]',
          width,
          className
        )}
      >
        {(title || showClose) && (
          <div className="flex items-center justify-between border-b border-surface-100 px-6 py-4">
            {title && (
              <h3 className="text-base font-semibold text-primary-500">{title}</h3>
            )}
            {showClose && (
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-surface-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        <div className="flex-1 overflow-auto px-6 py-5">{children}</div>

        {(footer !== undefined || onConfirm) && (
          <div className="flex items-center justify-end gap-2 border-t border-surface-100 px-6 py-4">
            {footer !== undefined ? (
              footer
            ) : (
              <>
                <Button variant="secondary" onClick={onClose}>
                  {cancelText}
                </Button>
                <Button onClick={onConfirm} loading={confirmLoading}>
                  {confirmText}
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
