import { ReactNode } from 'react';

interface TransferMethodCardProps {
  id: string;
  icon: ReactNode;
  title: string;
  subtitle: string;
  iconBgColor: string;
  timing: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
}

export function TransferMethodCard({
  icon,
  title,
  subtitle,
  iconBgColor,
  timing,
  description,
  isSelected,
  onClick,
}: TransferMethodCardProps) {
  return (
    <div
      role='button'
      onClick={onClick}
      className={`group flex h-full w-full cursor-pointer flex-col rounded-xl border border-gray-200 bg-white p-5 transition-all`}
    >
      <div className='mb-2 flex items-start justify-between gap-2'>
        <div className='flex min-w-0 items-center gap-3'>
          <div
            className={`h-14 w-14 rounded-md ${iconBgColor} flex shrink-0 items-center justify-center text-xl`}
          >
            {icon}
          </div>
          <div className='min-w-0'>
            <h3 className='truncate font-semibold text-gray-900'>{title}</h3>
            <p className='truncate text-xs text-gray-500'>{subtitle}</p>
          </div>
        </div>
        <span className='shrink-0 rounded border border-gray-200 bg-white px-2 py-1 text-xs font-medium whitespace-nowrap text-gray-600'>
          {timing}
        </span>
      </div>
      <p className='mb-5 space-y-2 border-t border-gray-200 pt-3 text-sm text-gray-600'>
        {description}
      </p>
      <div className='mt-3 text-center'>
        <button
          className={`w-full cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            isSelected
              ? 'bg-linear-to-b from-[#4D4D4D] to-[#212121] text-white'
              : 'border border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
          }`}
        >
          {isSelected ? 'Selected' : 'Select Method'}
        </button>
      </div>
    </div>
  );
}
