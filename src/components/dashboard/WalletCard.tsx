interface WalletCardProps {
  currency: string;
  amount: string;
  network: string;
  networkType: string;
  address: string;
  icon: React.ReactNode;
  bgColor?: string; // Made optional as we might not use it in the new design or use it differently
}

export function WalletCard({
  currency,
  amount,
  network,
  networkType,
  address,
  icon,
}: WalletCardProps) {
  return (
    <div className='flex h-full flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md'>
      <div className='mb-4 flex items-start justify-between'>
        <div className='flex items-center gap-3'>
          <div className='flex items-center justify-center rounded-full'>{icon}</div>
          <span className='font-medium text-gray-700'>{currency}</span>
        </div>
        <div className='font-mono text-xs text-gray-400'>{address}</div>
      </div>

      <div className='mb-4'>
        <div className='text-3xl font-bold text-gray-900'>{amount}</div>
      </div>

      <div className='flex items-center justify-between pt-2'>
        <div className='text-xs text-gray-500'>{network}</div>
        <div className='text-xs text-gray-500'>{networkType}</div>
      </div>
    </div>
  );
}
