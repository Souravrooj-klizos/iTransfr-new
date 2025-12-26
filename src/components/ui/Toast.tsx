'use client';

import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

// Toast types
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Toast Provider Component
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

// Hook to use toast
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  const { addToast, removeToast } = context;

  return {
    success: (title: string, message?: string) =>
      addToast({ type: 'success', title, message, duration: 4000 }),
    error: (title: string, message?: string) =>
      addToast({ type: 'error', title, message, duration: 5000 }),
    warning: (title: string, message?: string) =>
      addToast({ type: 'warning', title, message, duration: 4000 }),
    info: (title: string, message?: string) =>
      addToast({ type: 'info', title, message, duration: 4000 }),
    dismiss: removeToast,
  };
}

// Toast Container
function ToastContainer() {
  const context = useContext(ToastContext);
  if (!context) return null;

  const { toasts } = context;

  return (
    <div className='fixed top-4 right-4 z-[100] flex flex-col gap-3'>
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

// Individual Toast Item
function ToastItem({ toast }: { toast: Toast }) {
  const context = useContext(ToastContext);
  const [isVisible, setIsVisible] = useState(false);

  const handleRemove = useCallback(() => {
    setIsVisible(false);
    // Wait for animation to finish before removing from state
    setTimeout(() => {
      context?.removeToast(toast.id);
    }, 400); // Match transition duration
  }, [context, toast.id]);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => {
      setIsVisible(true);
    });

    // Auto-dismiss after duration - use a separate timeout that doesn't depend on handleRemove
    if (toast.duration) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        // Wait for animation to finish before removing from state
        setTimeout(() => {
          context?.removeToast(toast.id);
        }, 400);
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast.duration, toast.id, context]);

  const icons = {
    success: <CheckCircle className='h-5 w-5 text-green-500' />,
    error: <AlertCircle className='h-5 w-5 text-red-500' />,
    warning: <AlertTriangle className='h-5 w-5 text-amber-500' />,
    info: <Info className='h-5 w-5 text-blue-500' />,
  };

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-amber-50 border-amber-200',
    info: 'bg-blue-50 border-blue-200',
  };

  return (
    <div
      className={`flex w-80 items-start gap-3 rounded-[10px] border p-4 shadow-lg transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      } ${bgColors[toast.type]}`}
    >
      <div className='mt-0.5 shrink-0'>{icons[toast.type]}</div>
      <div className='min-w-0 flex-1'>
        <p className='text-sm font-semibold text-gray-900'>{toast.title}</p>
        {toast.message && (
          <p className='mt-1 text-sm wrap-break-word text-gray-600'>{toast.message}</p>
        )}
      </div>
      <button
        onClick={handleRemove}
        className='shrink-0 cursor-pointer rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600'
      >
        <X className='h-4 w-4' />
      </button>
    </div>
  );
}
