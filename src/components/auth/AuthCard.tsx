import React from 'react';
import { cn } from '@/lib/utils';

interface AuthCardProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
}

export function AuthCard({ children, title, subtitle, className }: AuthCardProps) {
  return (
    <div className={cn('mx-auto w-full max-w-md', className)}>
      {/* Main Card */}
      <div className='rounded-lg border border-gray-200 bg-white p-8 shadow-sm'>
        {/* iTransfr Logo/Branding - Inside Card */}
        <div className='mb-8 flex items-center justify-center'>
          <div className='flex items-center gap-2'>
            {/* IT Icon */}
            <img src='/logo_dark.svg' alt='iTransfr Icon' className='h-8 w-auto' />
            {/* iTransfr Text */}
            <img src='/vector.svg' alt='iTransfr' className='h-6 w-auto' />
          </div>
        </div>

        {/* Title Section */}
        <div className='mb-6 text-center'>
          <h1 className='mb-2 text-2xl font-semibold text-gray-900'>{title}</h1>
          {subtitle && <p className='text-sm text-gray-600'>{subtitle}</p>}
        </div>

        {/* Content */}
        {children}
      </div>

      {/* Copyright */}
      <div className='mt-6 text-center text-xs text-gray-500'>
        <p>Copyright © 2025 iTransfr</p>
      </div>
    </div>
  );
}
