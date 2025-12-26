'use client';

import { QuickActionButton } from '@/components/dashboard/QuickActionButton';
import { TransactionAnalytics } from '@/components/dashboard/TransactionAnalytics';
import { TransactionTable } from '@/components/dashboard/TransactionTable';
import { WalletCard } from '@/components/dashboard/WalletCard';
import { Filter, Search } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

import KYCStatus from '@/components/client/KYCStatus';
import CryptoDeposit from '@/components/icons/CryptoDeposit';
import CryptoSend from '@/components/icons/CryptoSend';
import DepositMoney from '@/components/icons/DepositMoney';
import SendMoney from '@/components/icons/SendMoney';

// Types for API data
interface WalletData {
  currency: string;
  balance: number;
  formattedBalance: string;
  network: string;
  networkType: string;
  address: string;
  chain: string;
}

interface TransactionData {
  id: string;
  date: string;
  time: string;
  recipient: string;
  type: string;
  status: 'Completed' | 'Processing' | 'Failed' | 'Pending';
  amount: string;
  currency?: string;
  fromAmount?: string;
  amountColor: 'success' | 'error' | 'neutral';
}

// Analytics data (calculated from transactions)
const defaultAnalyticsData = [
  { label: 'Crypto Deposits', value: '$0', percentage: '0%', color: 'bg-blue-500' },
  { label: 'Wire Transfers', value: '$0', percentage: '0%', color: 'bg-green-500' },
  { label: 'SWIFT International', value: '$0', percentage: '0%', color: 'bg-yellow-500' },
  { label: 'SEPA Payments', value: '$0', percentage: '0%', color: 'bg-orange-500' },
  { label: 'Crypto Transfers', value: '$0', percentage: '0%', color: 'bg-gray-500' },
];

export default function ClientDashboard() {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [analyticsData, setAnalyticsData] = useState(defaultAnalyticsData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      setError(null);

      // Fetch wallets and transactions in parallel
      const [walletsRes, transactionsRes] = await Promise.all([
        fetch('/api/wallets/list'),
        fetch('/api/transactions/list?limit=10'),
      ]);

      // Process wallets response
      if (walletsRes.ok) {
        const walletsData = await walletsRes.json();
        setWallets(walletsData.data || []);
      }

      // Process transactions response
      if (transactionsRes.ok) {
        const txData = await transactionsRes.json();
        const formattedTransactions = (txData.data || []).map((tx: any) => ({
          id: tx.id,
          date: tx.date,
          time: tx.time,
          recipient: tx.recipient,
          type: tx.paymentMethod || 'Crypto',
          status: tx.status,
          amount: tx.amount,
          currency: tx.currency,
          fromAmount: tx.fromAmount,
          amountColor: getAmountColor(tx.transactionType, tx.status),
        }));
        setTransactions(formattedTransactions);
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  function getAmountColor(type: string, status: string): 'success' | 'error' | 'neutral' {
    if (status === 'Failed') return 'error';
    if (type === 'Deposit') return 'success';
    if (type === 'Withdrawal') return 'error';
    return 'neutral';
  }

  // Convert wallets to the format expected by WalletCard
  const walletCards =
    wallets.length > 0
      ? wallets.map(wallet => ({
          currency: wallet.currency,
          amount: wallet.formattedBalance,
          network: wallet.network,
          networkType: wallet.networkType,
          address: formatAddress(wallet.address),
          icon: (
            <Image
              src={getWalletIcon(wallet.currency)}
              alt={wallet.currency}
              width={36}
              height={36}
            />
          ),
          bgColor: getWalletBgColor(wallet.currency),
        }))
      : [
          // Default wallets when no data
          {
            currency: 'USDT',
            amount: '$ 0.00',
            network: 'Tron Network',
            networkType: 'Trc-20',
            address: 'Not connected',
            icon: <Image src='/Ellipse 3 (1).svg' alt='USDT' width={36} height={36} />,
            bgColor: 'bg-green-100',
          },
          {
            currency: 'USDC',
            amount: '$ 0.00',
            network: 'Ethereum Network',
            networkType: 'Erc-20',
            address: 'Not connected',
            icon: <Image src='/Ellipse 3.svg' alt='USDC' width={36} height={36} />,
            bgColor: 'bg-blue-100',
          },
        ];

  function formatAddress(address: string): string {
    if (!address || address.length < 10) return address || 'N/A';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  function getWalletIcon(currency: string): string {
    const icons: Record<string, string> = {
      USDT: '/Ellipse 3 (1).svg',
      USDC: '/Ellipse 3.svg',
    };
    return icons[currency] || '/Ellipse 3.svg';
  }

  function getWalletBgColor(currency: string): string {
    const colors: Record<string, string> = {
      USDT: 'bg-green-100',
      USDC: 'bg-blue-100',
    };
    return colors[currency] || 'bg-gray-100';
  }

  if (loading) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <div className='h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* KYC Status Banner */}
      <KYCStatus />

      {/* Error Banner */}
      {error && (
        <div className='rounded-lg border border-red-200 bg-red-50 p-4 text-red-700'>
          <p className='text-sm'>{error}</p>
          <button
            onClick={fetchDashboardData}
            className='mt-2 text-sm font-medium text-red-600 hover:text-red-800'
          >
            Try Again
          </button>
        </div>
      )}

      {/* Wallet Cards and Quick Actions */}
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-3 xl:grid-cols-5'>
        {/* Wallet Cards */}
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:col-span-2 xl:col-span-3'>
          {walletCards.map((wallet, index) => (
            <WalletCard key={index} {...wallet} />
          ))}
        </div>

        {/* Quick Actions */}
        <div className='flex flex-col rounded-xl border border-gray-200 bg-white px-2 py-4 transition-shadow hover:shadow-md lg:col-span-1 xl:col-span-2 xl:px-6'>
          <div className='grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4'>
            <QuickActionButton
              icon={<CryptoDeposit />}
              label='Deposit Crypto'
              variant='primary'
              href='/deposit'
            />
            <QuickActionButton icon={<CryptoSend />} label='Send Crypto' href='/send' />
            <QuickActionButton icon={<DepositMoney />} label='Deposit Money' href='/deposit' />
            <QuickActionButton icon={<SendMoney />} label='Send Money' href='/send' />
          </div>
        </div>
      </div>

      {/* Transactions and Analytics */}
      <div className='mb-3 grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3'>
        {/* Recent Transactions */}
        <div className='rounded-xl border border-gray-200 bg-white px-6 py-3 lg:col-span-2'>
          <div className='mb-4 flex flex-col items-center justify-between lg:flex-row'>
            <h2 className='text-lg font-normal text-gray-500'>Recent Transactions</h2>
            <div className='flex items-center gap-3'>
              <div className='relative'>
                <Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-500' />
                <input
                  type='text'
                  placeholder='Search'
                  className='rounded-lg border border-gray-200 py-2 pr-4 pl-10 text-sm text-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none'
                />
              </div>
              <button className='flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50'>
                <Filter className='h-4 w-4' />
                Filter
              </button>
            </div>
          </div>
          <TransactionTable transactions={transactions.length > 0 ? transactions : []} />
          {transactions.length === 0 && !loading && (
            <div className='py-8 text-center text-gray-500'>
              <p>No transactions yet</p>
              <a href='/deposit' className='mt-2 inline-block text-blue-600 hover:text-blue-800'>
                Make your first deposit →
              </a>
            </div>
          )}
        </div>

        {/* Transaction Analytics */}
        <div>
          <TransactionAnalytics totalVolume='$0' data={analyticsData} />
        </div>
      </div>
    </div>
  );
}
