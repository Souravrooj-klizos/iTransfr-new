'use client';

import { CryptoTransactionsTable } from '@/components/balance/CryptoTransactionsTable';
import { WalletBalanceCard } from '@/components/balance/WalletBalanceCard';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface WalletData {
  currency: string;
  amount: string;
  network: string;
  networkType: string;
  address: string;
  icon: React.ReactNode;
}

interface CryptoTransaction {
  id: string;
  date: string;
  time: string;
  asset: {
    name: string;
    icon: React.ReactNode;
  };
  network: string;
  direction: 'Sent' | 'Deposit' | 'Received';
  status: 'Completed' | 'Processing';
  amount: string;
}

export default function BalancePage() {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [transactions, setTransactions] = useState<CryptoTransaction[]>([]);
  const [totalBalance, setTotalBalance] = useState('$ 0.00');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchBalanceData();
  }, []);

  async function fetchBalanceData() {
    try {
      setLoading(true);

      // Fetch wallets and transactions in parallel
      const [walletsRes, transactionsRes] = await Promise.all([
        fetch('/api/wallets/list'),
        fetch('/api/transactions/list?limit=10&type=deposit'),
      ]);

      // Process wallets
      if (walletsRes.ok) {
        const walletsData = await walletsRes.json();
        const formattedWallets = (walletsData.data || []).map((w: any) => ({
          currency: w.currency,
          amount: w.formattedBalance || `$ ${w.balance?.toFixed(2) || '0.00'}`,
          network: w.network,
          networkType: w.networkType,
          address: formatAddress(w.address),
          icon: <Image src={getWalletIcon(w.currency)} alt={w.currency} width={36} height={36} />,
        }));
        setWallets(formattedWallets);

        // Calculate total balance
        const total = (walletsData.data || []).reduce(
          (sum: number, w: any) => sum + (w.balance || 0),
          0
        );
        setTotalBalance(
          `$ ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        );
      }

      // Process transactions
      if (transactionsRes.ok) {
        const txData = await transactionsRes.json();
        const formattedTx = (txData.data || []).map((tx: any) => ({
          id: tx.id,
          date: tx.date,
          time: tx.time,
          asset: {
            name: tx.currency || 'USDT',
            icon: (
              <Image
                src={getWalletIcon(tx.currency)}
                alt={tx.currency || 'USDT'}
                width={24}
                height={24}
              />
            ),
          },
          network: getNetworkType(tx.currency),
          direction: mapDirection(tx.transactionType),
          status: tx.status === 'Completed' ? 'Completed' : 'Processing',
          amount: tx.amount,
        }));
        setTransactions(formattedTx);
      }
    } catch (err) {
      console.error('Error fetching balance data:', err);
    } finally {
      setLoading(false);
    }
  }

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

  function getNetworkType(currency: string): string {
    const networks: Record<string, string> = {
      USDT: 'TRC-20',
      USDC: 'ERC-20',
    };
    return networks[currency] || 'TRC-20';
  }

  function mapDirection(type: string): 'Sent' | 'Deposit' | 'Received' {
    switch (type?.toLowerCase()) {
      case 'deposit':
        return 'Deposit';
      case 'withdrawal':
        return 'Sent';
      default:
        return 'Received';
    }
  }

  // Default wallets when no data
  const displayWallets =
    wallets.length > 0
      ? wallets
      : [
          {
            currency: 'USDT',
            amount: '$ 0.00',
            network: 'Tron Network',
            networkType: 'Trc-20',
            address: 'Not connected',
            icon: <Image src='/Ellipse 3 (1).svg' alt='USDT' width={36} height={36} />,
          },
          {
            currency: 'USDC',
            amount: '$ 0.00',
            network: 'Ethereum Network',
            networkType: 'Erc-20',
            address: 'Not connected',
            icon: <Image src='/Ellipse 3.svg' alt='USDC' width={36} height={36} />,
          },
        ];

  if (loading) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <div className='h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        {/* Left Column - Wallet Balance Card */}
        <div className='rounded-xl border border-gray-200 bg-white p-6 lg:col-span-1'>
          <WalletBalanceCard
            totalBalance={totalBalance}
            wallets={displayWallets}
            onDepositClick={() => router.push('/deposit')}
            onSendClick={() => router.push('/send')}
            onAddWalletClick={() => console.log('Add wallet clicked')}
          />
        </div>

        {/* Right Column - Crypto Transactions Table */}
        <div className='lg:col-span-2'>
          <CryptoTransactionsTable transactions={transactions} loading={loading} />
        </div>
      </div>
    </div>
  );
}
