'use client';

import { DatePicker } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { DataTable, TableColumn } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { adminTransactionApi } from '@/lib/api/admin';
import { Transaction } from '@/lib/api/types';
import { CheckCircle2, Clock, Download, Search, XCircle } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface ClientTransactionsProps {
  clientId: string;
}

export function ClientTransactions({ clientId }: ClientTransactionsProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    payment: 'all',
    currency: 'all',
    status: 'all',
    recipient: 'all',
    date: 'any',
  });

  // Guard against duplicate fetch calls (React StrictMode)
  const hasFetched = useRef(false);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminTransactionApi.list({ userId: clientId, limit: 100 });
      if (response.success) {
        setTransactions(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchTransactions();
    }
  }, [fetchTransactions]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className='h-4 w-4 text-green-500' />;
      case 'FAILED':
      case 'CANCELLED':
        return <XCircle className='h-4 w-4 text-red-500' />;
      case 'PROCESSING':
      case 'PAYOUT_IN_PROGRESS':
      case 'SWAP_IN_PROGRESS':
        return <Clock className='h-4 w-4 text-blue-500' />;
      default:
        return <Clock className='h-4 w-4 text-orange-500' />;
    }
  };

  const getStatusText = (status: string) => {
    if (status === 'COMPLETED') return 'Completed';
    if (status === 'FAILED') return 'Failed';
    if (status === 'PROCESSING' || status.includes('PROGRESS')) return 'Processing';
    return 'Pending';
  };

  const getStatusColor = (status: string) => {
    if (status === 'COMPLETED') return 'text-green-600';
    if (status === 'FAILED') return 'text-red-600';
    if (status === 'PROCESSING' || status.includes('PROGRESS')) return 'text-blue-600';
    return 'text-orange-600';
  };

  const getTypeBadge = (type: string) => {
    const styles = {
      deposit: 'bg-green-50 text-green-600 border-green-100',
      withdrawal: 'bg-red-50 text-red-600 border-red-100',
      payout: 'bg-blue-50 text-blue-600 border-blue-100',
      swap: 'bg-orange-50 text-orange-600 border-orange-100',
    };

    const label = type.charAt(0).toUpperCase() + type.slice(1);
    const style =
      styles[type.toLowerCase() as keyof typeof styles] ||
      'bg-gray-50 text-gray-600 border-gray-100';

    return (
      <span className={`rounded-md border px-2.5 py-1 text-xs font-medium ${style}`}>
        {label === 'Payout' ? 'Bank Payment' : label}
      </span>
    );
  };

  const formatAmount = (amount: number, type: string, currency: string) => {
    const isPositive = type.toLowerCase() === 'deposit';
    return (
      <div className='flex flex-col'>
        <span
          className={`text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-gray-900'}`}
        >
          {isPositive ? '' : ''}
          {amount.toLocaleString()} {currency}
        </span>
        {/* Mocking conversion subtext for design parity */}
        {amount > 10000 && <span className='text-[10px] text-gray-400'>From 45,000 USDT</span>}
      </div>
    );
  };

  const columns: TableColumn<Transaction>[] = [
    {
      key: 'date',
      header: 'Date & Time',
      render: t => (
        <div className='flex flex-col text-xs'>
          <span className='font-medium text-gray-900'>
            {new Date(t.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          <span className='text-gray-400'>
            {new Date(t.createdAt).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })}{' '}
            UTC
          </span>
        </div>
      ),
    },
    {
      key: 'id',
      header: 'Transaction ID',
      render: t => (
        <span className='text-sm text-gray-600'>{t.referenceNumber || t.id.slice(0, 12)}</span>
      ),
    },
    {
      key: 'type',
      header: 'Transaction Type',
      render: t => getTypeBadge(t.type),
    },
    {
      key: 'transfer',
      header: 'From -> To',
      render: t => (
        <span className='text-sm text-gray-600'>
          {t.type === 'deposit' ? 'Bank Transfer → USD Wallet' : 'EUR Wallet → Bank Transfer'}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: t => formatAmount(t.amount, t.type, t.currency),
    },
    {
      key: 'status',
      header: 'Status',
      render: t => (
        <div className='flex items-center gap-2'>
          {getStatusIcon(t.status)}
          <span className={`text-sm font-medium ${getStatusColor(t.status)}`}>
            {getStatusText(t.status)}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className='space-y-6 rounded-xl border border-gray-200 bg-white p-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold text-gray-900'>
          Transactions ({transactions.length})
        </h2>
        <Button
          variant='outline'
          className='bg-gradient-blue flex h-8 cursor-pointer items-center gap-2 rounded-lg border-none px-4 text-white hover:bg-blue-700'
        >
          <Download className='h-4 w-4' />
          Export CSV
        </Button>
      </div>

      {/* Filter Bar */}
      <div className='flex items-center justify-between gap-3 flex-col md:flex-row'>
        <div className='flex flex-wrap items-center gap-3'>
          <div className='relative w-64'>
            <Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400' />
            <Input
              placeholder='Search transactions'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='h-10 rounded-lg border-gray-200 pl-10 text-sm focus:ring-blue-500'
            />
          </div>

          <Select
            value={filters.type}
            onChange={val => setFilters({ ...filters, type: val })}
            options={[
              { label: 'All Transactions', value: 'all' },
              { label: 'Deposit', value: 'deposit' },
              { label: 'Withdrawal', value: 'withdrawal' },
            ]}
            className='h-10 w-44 border-gray-200'
          />

          <Select
            value={filters.payment}
            onChange={val => setFilters({ ...filters, payment: val })}
            options={[
              { label: 'All Payments', value: 'all' },
              { label: 'Bank Transfer', value: 'bank' },
              { label: 'Crypto', value: 'crypto' },
            ]}
            className='h-10 w-40 border-gray-200'
          />

          <Select
            value={filters.currency}
            onChange={val => setFilters({ ...filters, currency: val })}
            options={[
              { label: 'All Currencies', value: 'all' },
              { label: 'USD', value: 'usd' },
              { label: 'EUR', value: 'eur' },
              { label: 'USDT', value: 'usdt' },
            ]}
            className='h-10 w-40 border-gray-200'
          />

          <Select
            value={filters.status}
            onChange={val => setFilters({ ...filters, status: val })}
            options={[
              { label: 'All Statuses', value: 'all' },
              { label: 'Completed', value: 'completed' },
              { label: 'Processing', value: 'processing' },
              { label: 'Failed', value: 'failed' },
            ]}
            className='h-10 w-40 border-gray-200'
          />

          <Select
            value={filters.recipient}
            onChange={val => setFilters({ ...filters, recipient: val })}
            options={[{ label: 'All Recipients', value: 'all' }]}
            className='h-10 w-44 border-gray-200'
          />
        </div>

        <div className='relative w-44'>
          <DatePicker
            value={filters.date}
            onChange={val => setFilters({ ...filters, date: val })}
            className='w-full md:w-40'
          />
        </div>
      </div>

      {/* Table Section */}
      <div className='overflow-hidden rounded-xl border border-gray-200 bg-white'>
        {loading ? (
          <div className='flex h-64 items-center justify-center'>
            <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600'></div>
          </div>
        ) : transactions.length > 0 ? (
          <DataTable data={transactions} columns={columns} getRowId={t => t.id} />
        ) : (
          <div className='flex h-64 flex-col items-center justify-center p-6 text-center'>
            <div className='mb-4 rounded-full bg-gray-50 p-4'>
              <Search className='h-8 w-8 text-gray-300' />
            </div>
            <h3 className='text-base font-semibold text-gray-900'>No transactions found</h3>
            <p className='mt-1 max-w-sm text-sm text-gray-500'>
              There are no transactions matching your current filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
