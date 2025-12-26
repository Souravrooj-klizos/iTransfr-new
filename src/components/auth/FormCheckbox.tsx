import React from 'react';
import { cn } from '@/lib/utils';

interface FormCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function FormCheckbox({ label, className, ...props }: FormCheckboxProps) {
  return (
    <div className='flex items-center'>
      <input
        type='checkbox'
        className={cn(
          'h-4 w-4 rounded border-gray-300 text-blue-600',
          'focus:ring-2 focus:ring-blue-500 focus:ring-offset-0',
          'cursor-pointer transition-colors',
          className
        )}
        {...props}
      />
      <label htmlFor={props.id} className='ml-2 cursor-pointer text-sm text-gray-700 select-none'>
        {label}
      </label>
    </div>
  );
}
