'use client';

import ReceivedIcon from '@/components/icons/ReceivedIcon';
import SendArrowIcon from '@/components/icons/SendArrowIcon';
import { DataTable, getStatusIcon, type TableColumn } from '@/components/ui/DataTable';
import { Filter, Search } from 'lucide-react';

interface CryptoTransaction {
  id: string;
  date: string;
  time: string;
  asset: {
    name: string;
    icon: React.ReactNode;
  };
  network: string;
  direction: 'Sent' | 'Received' | 'Deposit';
  status: 'Completed' | 'Processing';
  amount: string;
}

interface CryptoTransactionsTableProps {
  transactions: CryptoTransaction[];
  loading?: boolean;
}

const getDirectionIcon = (direction: string) => {
  if (direction === 'Sent') {
    return <SendArrowIcon />;
  }
  return <ReceivedIcon />;
};

export function CryptoTransactionsTable({
  transactions,
  loading = false,
}: CryptoTransactionsTableProps) {
  const columns: TableColumn<CryptoTransaction>[] = [
    {
      key: 'date',
      header: 'Date & Time',
      render: row => (
        <div>
          <div className='text-sm font-medium text-gray-700'>{row.date}</div>
          <div className='text-xs text-gray-500'>{row.time}</div>
        </div>
      ),
    },
    {
      key: 'asset',
      header: 'Asset',
      render: row => (
        <div className='flex items-center gap-2'>
          {row.asset.icon}
          <span className='text-sm font-medium text-gray-700'>{row.asset.name}</span>
        </div>
      ),
    },
    {
      key: 'network',
      header: 'Network',
      render: row => (
        <span className='rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-700'>
          {row.network}
        </span>
      ),
    },
    {
      key: 'direction',
      header: 'Direction',
      render: row => (
        <div className='flex items-center gap-1.5 text-sm text-gray-700'>
          {row.direction}
          {getDirectionIcon(row.direction)}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: row => (
        <span
          className='inline-flex items-center text-sm font-medium'
          style={{
            color:
              row.status === 'Completed'
                ? 'var(--color-success-green)'
                : 'var(--color-primary-blue)',
          }}
        >
          {getStatusIcon(row.status)}
          {row.status}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: row => (
        <div
          className='text-sm font-semibold'
          style={{
            color:
              row.direction === 'Sent' ? 'var(--color-error-red)' : 'var(--color-success-green)',
          }}
        >
          {row.amount}
        </div>
      ),
    },
  ];

  return (
    <div className='overflow-hidden rounded-xl border border-gray-200 bg-white px-4 pb-4'>
      {/* Header */}
      <div className='flex flex-col items-center justify-between py-3 lg:flex-row'>
        <h2 className='text-md font-normal text-gray-500'>Crypto Transactions</h2>
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

      {/* Table */}
      <DataTable
        data={transactions}
        columns={columns}
        getRowId={row => row.id}
        showCheckbox={true}
      />

      {transactions.length === 0 && !loading && (
        <div className='p-8 text-center'>
          <p className='text-gray-500'>No crypto transactions yet</p>
          <a href='/deposit' className='mt-2 inline-block text-blue-600 hover:text-blue-800'>
            Make your first deposit →
          </a>
        </div>
      )}
    </div>
  );
}
