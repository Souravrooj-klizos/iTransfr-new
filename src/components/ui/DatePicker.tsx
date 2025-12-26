'use client';

import { Calendar, ChevronDown, X } from 'lucide-react';
import { useRef, useState } from 'react';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  className?: string;
  placeholder?: string;
}

export function DatePicker({
  value,
  onChange,
  className = '',
  placeholder = 'Any date',
}: DatePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  const handleContainerClick = () => {
    inputRef.current?.showPicker();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  // Format display date
  const displayDate = value
    ? new Date(value).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : placeholder;

  return (
    <div className={`relative ${className}`}>
      <div
        onClick={handleContainerClick}
        className={`flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 transition-all focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 hover:bg-gray-50 ${
          value ? 'border-blue-500 bg-blue-50/50 text-blue-900' : ''
        }`}
      >
        <Calendar className={`h-4 w-4 ${value ? 'text-blue-600' : 'text-gray-500'}`} />
        <span className='flex-1 whitespace-nowrap'>{displayDate}</span>

        {value ? (
          <div role='button' onClick={handleClear} className='rounded-full p-0.5 hover:bg-black/5'>
            <X className='h-3 w-3 text-blue-600' />
          </div>
        ) : (
          <ChevronDown className='h-4 w-4 text-gray-500' />
        )}
      </div>

      <input
        ref={inputRef}
        type='date'
        className='absolute inset-0 -z-10 opacity-0'
        onChange={e => onChange(e.target.value)}
        value={value}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </div>
  );
}
