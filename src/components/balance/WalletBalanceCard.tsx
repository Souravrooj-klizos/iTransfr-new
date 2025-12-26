import { QuickActionButton } from '@/components/dashboard/QuickActionButton';
import { WalletCard } from '@/components/dashboard/WalletCard';
import CryptoDeposit from '@/components/icons/CryptoDeposit';
import CryptoSend from '@/components/icons/CryptoSend';
import Image from 'next/image';

interface WalletInfo {
  currency: string;
  amount: string;
  network: string;
  networkType: string;
  address: string;
  icon: React.ReactNode;
  bgColor?: string;
}

interface WalletBalanceCardProps {
  totalBalance: string;
  wallets: WalletInfo[];
  onDepositClick?: () => void;
  onSendClick?: () => void;
  onAddWalletClick?: () => void;
}

export function WalletBalanceCard({
  totalBalance,
  wallets,
  onDepositClick,
  onSendClick,
  onAddWalletClick,
}: WalletBalanceCardProps) {
  return (
    <div className='space-y-4'>
      {/* Total Balance Card */}
      <div>
        <h3 className='mb-2 text-sm font-normal text-gray-500'>Total Wallet Balance</h3>
        <p className='mb-6 text-3xl font-bold text-gray-900'>{totalBalance}</p>

        {/* Action Buttons */}
        <div className='grid grid-cols-2 gap-3'>
          <QuickActionButton
            icon={<CryptoDeposit />}
            label='Deposit Crypto'
            variant='primary'
            onClick={onDepositClick}
          />
          <QuickActionButton icon={<CryptoSend />} label='Send Crypto' onClick={onSendClick} />
        </div>
      </div>

      <div className='mt-6 space-y-3 rounded-xl bg-gray-100 p-2'>
        {/* Individual Wallet Cards */}
        {wallets.map((wallet, index) => (
          <WalletCard
            key={index}
            currency={wallet.currency}
            amount={wallet.amount}
            network={wallet.network}
            networkType={wallet.networkType}
            address={wallet.address}
            icon={wallet.icon}
          />
        ))}

        {/* Add New Wallet Button */}
        <button
          onClick={onAddWalletClick}
          className='flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white p-4 text-sm font-medium text-gray-600 transition-colors hover:border-blue-500 hover:text-blue-600'
        >
          <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
          </svg>
          Add New Wallet
        </button>
      </div>
    </div>
  );
}
