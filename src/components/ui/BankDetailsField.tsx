'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

interface BankDetailsFieldProps {
  label: string;
  value: string;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
  copyable?: boolean;
}

export function BankDetailsField({
  label,
  value,
  className = '',
  labelClassName = '',
  valueClassName = '',
  copyable = true,
}: BankDetailsFieldProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label className={labelClassName || 'text-sm font-medium text-gray-700'}>{label}</label>
      )}
      <div className='relative'>
        <div className='flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 py-0.5 pr-0.5 pl-4'>
          <span className={valueClassName || 'text-sm font-normal tracking-widest text-gray-800'}>
            {value}
          </span>
          {copyable && (
            <button
              onClick={handleCopy}
              className='z-10 flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2 py-[9px] text-xs text-gray-500 transition-all hover:text-gray-700 active:scale-95'
              type='button'
            >
              {copied ? (
                <>
                  <Check className='h-4 w-4 text-green-600' />
                  <span className='text-green-600'>Copied</span>
                </>
              ) : (
                <>
                  <Copy className='h-4 w-4' />
                  <span>Copy</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
