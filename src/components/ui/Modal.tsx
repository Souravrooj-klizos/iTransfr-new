'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  className,
}: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-5xl',
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4'>
      {/* Backdrop */}
      <div
        className='fixed inset-0 bg-black/50 transition-opacity'
        onClick={onClose}
        aria-hidden='true'
      />

      {/* Modal */}
      <div
        className={`relative z-10 w-full ${sizeClasses[size]} max-h-[calc(100vh-4rem)] overflow-y-auto rounded-xl bg-white shadow-xl ${className || ''}`}
      >
        {/* Header */}
        {title && (
          <div className='px-6'>
            <div className='flex items-center justify-between border-b border-gray-200 py-4'>
              <h2 className='text-xl font-semibold text-gray-900'>{title}</h2>
              <button
                onClick={onClose}
                className='cursor-pointer rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600'
              >
                <X className='h-5 w-5' />
              </button>
            </div>
          </div>
        )}

        {/* Body */}
        <div className='px-6 py-4'>{children}</div>

        {/* Footer */}
        {footer && <div className='border-t border-gray-200 px-6 py-4'>{footer}</div>}
      </div>
    </div>
  );
}
