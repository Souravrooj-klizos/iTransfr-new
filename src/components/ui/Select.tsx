'use client';

import { Check, ChevronDown, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  dropdownClassName?: string;
  direction?: 'up' | 'down';
  error?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = 'Select option',
  className = '',
  dropdownClassName,
  direction = 'down',
  error,
  searchable = false,
  searchPlaceholder = 'Search...',
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  // Filter options based on search query
  const filteredOptions = searchable && searchQuery
    ? options.filter(opt =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const handleSelect = (option: SelectOption) => {
    onChange(option.value);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (isOpen) {
      setSearchQuery('');
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type='button'
        onClick={handleToggle}
        className={`flex w-full items-center justify-between rounded-lg border bg-white px-2 py-2 text-sm transition-all hover:bg-gray-50 focus:ring-2 focus:outline-none ${
          error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
            : isOpen
              ? 'border-blue-500 ring-2 ring-blue-500/20'
              : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'
        }`}
      >
        <span className={`truncate ${!selectedOption ? 'text-gray-500' : 'text-gray-600'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`ml-2 h-4 w-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          className={`animate-in fade-in zoom-in-95 absolute left-0 z-50 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg duration-100 ${
            direction === 'up' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          } ${dropdownClassName ?? 'min-w-[180px]'}`}
        >
          {/* Search input */}
          {searchable && (
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full rounded-md border border-gray-200 bg-white py-1.5 pl-8 pr-3 text-sm text-gray-900 outline-none placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                />
              </div>
            </div>
          )}

          <div className='max-h-[130px] overflow-y-auto p-1'>
            {filteredOptions.length === 0 ? (
              <div className="px-2 py-3 text-center text-sm text-gray-500">
                No options found
              </div>
            ) : (
              filteredOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option)}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors ${
                    option.value === value
                      ? 'bg-blue-50 font-medium text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className='truncate'>{option.label}</span>
                  {option.value === value && <Check className='ml-2 h-4 w-4 text-blue-600' />}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

