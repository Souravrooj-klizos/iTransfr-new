'use client';

interface AnalyticsData {
  label: string;
  value: string;
  percentage: string;
  color: string;
}

interface TransactionAnalyticsProps {
  totalVolume: string;
  data: AnalyticsData[];
}

export function TransactionAnalytics({ totalVolume, data }: TransactionAnalyticsProps) {
  // Calculate total for percentage
  const total = 360; // Full circle

  return (
    <div className='rounded-xl border border-gray-200 bg-white p-6'>
      <div className='mb-4 flex items-center justify-between'>
        <h3 className='text-lg font-medium text-gray-500'>Transaction Analytics</h3>
        <button className='text-gray-400 hover:text-gray-600'>
          <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z'
            />
          </svg>
        </button>
      </div>

      <div className='flex flex-col items-center justify-center py-8'>
        {/* Donut Chart */}
        <div className='relative mb-6 h-48 w-48'>
          <svg className='h-full w-full -rotate-90 transform' viewBox='0 0 100 100'>
            {/* Background circle */}
            <circle cx='50' cy='50' r='40' fill='none' stroke='#f3f4f6' strokeWidth='12' />

            {/* Colored segments */}
            <circle
              cx='50'
              cy='50'
              r='40'
              fill='none'
              stroke='var(--color-primary-blue)'
              strokeWidth='12'
              strokeDasharray='75.4 251.2'
              strokeDashoffset='0'
            />
            <circle
              cx='50'
              cy='50'
              r='40'
              fill='none'
              stroke='var(--color-teal-accent)'
              strokeWidth='12'
              strokeDasharray='62.8 251.2'
              strokeDashoffset='-75.4'
            />
            <circle
              cx='50'
              cy='50'
              r='40'
              fill='none'
              stroke='var(--color-warning-orange)'
              strokeWidth='12'
              strokeDasharray='50.2 251.2'
              strokeDashoffset='-138.2'
            />
            <circle
              cx='50'
              cy='50'
              r='40'
              fill='none'
              stroke='var(--color-gray-600)'
              strokeWidth='12'
              strokeDasharray='62.8 251.2'
              strokeDashoffset='-188.4'
            />
          </svg>

          {/* Center text */}
          <div className='absolute inset-0 flex flex-col items-center justify-center'>
            <div className='mb-1 text-xs text-gray-500'>Volume</div>
            <div className='text-2xl font-bold text-gray-900'>{totalVolume}</div>
          </div>
        </div>

        {/* Legend */}
        <div className='w-full space-y-3'>
          {data.map((item, index) => (
            <div key={index} className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <div className={`h-3 w-3 rounded-full ${item.color}`}></div>
                <span className='text-sm text-gray-600'>{item.label}</span>
              </div>
              <div className='text-right'>
                <div className='text-sm font-semibold text-gray-900'>{item.value}</div>
                <div className='text-xs text-gray-500'>{item.percentage}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
