'use client';

import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface FormSelectProps {
  label?: string;
  value: string;
  onChange?: (value: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  disabled?: boolean;
}

export function FormSelect({
  label,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
}: FormSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue);
    setIsOpen(false);
  };

  return (
    <div className='w-full' ref={containerRef}>
      {label && (
        <label className='mb-2 block text-sm font-medium text-gray-700'>
          {label}
          {required && <span className='ml-1 text-red-500'>*</span>}
        </label>
      )}
      <div className='relative'>
        <button
          type='button'
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`group flex h-11 w-full items-center justify-between rounded-lg border bg-white px-4 py-3 text-sm transition-all focus:outline-none ${
            disabled ? 'cursor-not-allowed bg-gray-100 text-gray-400' : 'hover:bg-gray-50'
          } ${
            isOpen
              ? 'border-blue-500 ring-2 ring-blue-500/20'
              : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
          }`}
        >
          <span className={`truncate ${!selectedOption ? 'text-gray-500' : 'text-gray-900'}`}>
            {selectedOption ? selectedOption.label : 'Select an option'}
          </span>
          <ChevronDown
            className={`ml-2 h-5 w-5 text-gray-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isOpen && (
          <div className='animate-in fade-in zoom-in-95 absolute top-full left-0 z-50 mt-1.5 w-full min-w-[180px] overflow-hidden rounded-lg border border-gray-200 bg-white p-1 shadow-lg duration-100'>
            <div className='max-h-60 overflow-y-auto'>
              {options.map(option => (
                <button
                  key={option.value}
                  type='button'
                  onClick={() => handleSelect(option.value)}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors ${
                    option.value === value
                      ? 'bg-blue-50 font-medium text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className='truncate'>{option.label}</span>
                  {option.value === value && <Check className='ml-2 h-4 w-4 text-blue-600' />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
