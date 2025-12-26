'use client';

import { ReactNode } from 'react';

export interface DepositMethod {
  id: string;
  name: string;
  subtitle: string;
  icon: ReactNode;
  iconBgColor: string;
  maxAmount?: string;
  minAmount: string;
  noLimits?: boolean;
  processingTime: string;
}

interface DepositMethodCardProps {
  method: DepositMethod;
  isSelected: boolean;
  onSelect: () => void;
}

export function DepositMethodCard({ method, isSelected, onSelect }: DepositMethodCardProps) {
  return (
    <div className='flex flex-col rounded-xl border border-gray-200 bg-white p-5'>
      {/* Header with Icon and Title */}
      <div className='mb-3 flex items-start gap-3'>
        <div
          className={`h-14 w-14 rounded-md ${method.iconBgColor} flex shrink-0 items-center justify-center`}
        >
          {method.icon}
        </div>
        <div className='min-w-0 flex-1'>
          <h3 className='text-lg font-semibold text-gray-900'>{method.name}</h3>
          <p className='mt-0.5 text-sm text-gray-600'>{method.subtitle}</p>
        </div>
      </div>

      {/* Details Section */}
      <div className='mb-5 space-y-2 border-t border-gray-200 pt-3 text-xs'>
        <div className='flex items-center justify-between'>
          <p className='text-gray-500'>Max. Amount</p>
          <p className='font-medium text-gray-900'>
            {method.noLimits ? 'No Limits' : method.maxAmount}
          </p>
        </div>
        <div className='flex items-center justify-between'>
          <p className='text-gray-500'>Min. Amount</p>
          <p className='font-medium text-gray-900'>{method.minAmount}</p>
        </div>
        <div className='flex items-center justify-between'>
          <p className='text-gray-500'>Processing Time</p>
          <p className='font-medium text-gray-900'>{method.processingTime}</p>
        </div>
      </div>

      {/* Select Button */}
      <button
        onClick={onSelect}
        className={`w-full cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-all ${
          isSelected
            ? 'bg-linear-to-b from-[#4D4D4D] to-[#212121] text-white'
            : 'border border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
        }`}
      >
        {isSelected ? 'Selected' : 'Select Method'}
      </button>
    </div>
  );
}
