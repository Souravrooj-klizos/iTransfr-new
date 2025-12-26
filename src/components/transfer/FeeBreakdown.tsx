interface FeeBreakdownProps {
  quotedRate: string;
  fxFee: string;
  wireFeeLabel: string;
  wireFee: string;
  totalFees: string;
}

export function FeeBreakdown({
  quotedRate,
  fxFee,
  wireFeeLabel,
  wireFee,
  totalFees,
}: FeeBreakdownProps) {
  return (
    <div className='mb-6 border-t border-gray-200 pt-4'>
      <div className='mb-3 text-sm font-medium text-gray-900'>Fees</div>

      <div className='space-y-2 text-sm'>
        <div className='flex justify-between'>
          <span className='text-gray-600'>Quoted Rate</span>
          <span className='text-gray-900'>{quotedRate}</span>
        </div>

        <div className='flex justify-between'>
          <span className='text-gray-600'>FX Fee</span>
          <span style={{ color: 'var(--color-error-red)' }}>{fxFee}</span>
        </div>

        <div className='flex justify-between'>
          <span className='text-gray-600'>{wireFeeLabel}</span>
          <span style={{ color: 'var(--color-error-red)' }}>{wireFee}</span>
        </div>

        <div className='flex justify-between border-t border-gray-200 pt-2 font-semibold'>
          <span className='text-gray-900'>Total Fees</span>
          <span style={{ color: 'var(--color-error-red)' }}>{totalFees}</span>
        </div>
      </div>
    </div>
  );
}
