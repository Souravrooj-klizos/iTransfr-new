'use client';

import Receipt from '@/components/icons/Receipt';
import { TransactionDetailsModal } from '@/components/transactions/TransactionDetailsModal';
import { DataTable, getStatusIcon, type TableColumn } from '@/components/ui/DataTable';
import { DatePicker } from '@/components/ui/DatePicker';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import {
    CheckCircle,
    Download,
    Eye,
    Loader2,
    MoreVertical,
    RefreshCw,
    Search,
    Send,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface Transaction {
  id: string;
  date: string;
  time: string;
  recipient: string;
  clientName?: string;
  transactionType: 'Deposit' | 'Withdrawal' | 'Bank Payment';
  paymentMethod: 'Crypto' | 'Fedwire' | 'SWIFT';
  status: 'Completed' | 'Processing' | 'Failed' | 'Pending';
  rawStatus?: string;
  amount: string;
  fromAmount?: string;
  availableActions?: string[];
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Filter states
  const [filter, setFilter] = useState('all');
  const [currency, setCurrency] = useState('all');
  const [status, setStatus] = useState('all');
  const [client, setClient] = useState('all');
  const [paymentType, setPaymentType] = useState('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [activePage, setActivePage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState('10');
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchTransactions();

    // Poll every 5 seconds for real-time updates
    const intervalId = setInterval(() => {
      // Only fetch if not already loading (to avoid stacking requests)
      // Note: In a real app, you might want to use SWR or React Query for better polling handling
      if (!document.hidden) {
        fetchTransactions(true); // true = silent refresh (don't set main loading state)
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [activePage, rowsPerPage, filter, status]);

  async function fetchTransactions(silent = false) {
    try {
      if (!silent) setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('page', activePage.toString());
      params.set('limit', rowsPerPage);
      if (filter !== 'all') params.set('type', filter);
      if (status !== 'all') params.set('status', status);

      const response = await fetch(`/api/admin/transactions/list?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      setTransactions(data.data || data.transactions || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }

  async function executeAction(transactionId: string, action: string) {
    try {
      setActionLoading(`${transactionId}-${action}`);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/admin/transactions/${transactionId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Action failed');
      }

      setSuccess(`${getActionLabel(action)} completed successfully`);

      // Refresh transactions list
      await fetchTransactions();
    } catch (err: any) {
      console.error('Action error:', err);
      setError(err.message || 'Failed to execute action');
    } finally {
      setActionLoading(null);
      setShowActionsMenu(null);
    }
  }

  function getActionLabel(action: string): string {
    const labels: Record<string, string> = {
      mark_received: 'Mark Received',
      execute_swap: 'Execute Swap',
      send_payout: 'Send Payout',
      mark_complete: 'Mark Complete',
    };
    return labels[action] || action;
  }

  const handleSelectionChange = (ids: Set<string>) => {
    setSelectedIds(ids);
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showActionsMenu && !target.closest('.relative')) {
        setShowActionsMenu(null);
      }
    };

    if (showActionsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showActionsMenu]);

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'Deposit':
        return 'bg-green-100 text-green-600';
      case 'Withdrawal':
        return 'bg-red-100 text-red-600';
      case 'Bank Payment':
        return 'bg-blue-100 text-blue-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const columns: TableColumn<Transaction>[] = [
    {
      key: 'date',
      header: 'Date & Time',
      render: row => (
        <div>
          <div className='text-sm font-medium text-gray-900'>{row.date}</div>
          <div className='text-xs text-gray-500'>{row.time}</div>
        </div>
      ),
    },
    {
      key: 'client',
      header: 'Client',
      render: row => <div className='text-sm text-gray-900'>{row.clientName || 'Unknown'}</div>,
    },
    {
      key: 'recipient',
      header: 'Recipient',
      render: row => <div className='text-sm text-gray-900'>{row.recipient}</div>,
    },
    {
      key: 'transactionType',
      header: 'Type',
      render: row => (
        <span
          className={`inline-block rounded-lg px-3 py-1.5 text-xs font-medium ${getTransactionTypeColor(row.transactionType)}`}
        >
          {row.transactionType}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: row => (
        <div>
          <span
            className='inline-flex items-center text-sm font-medium'
            style={{
              color:
                row.status === 'Completed'
                  ? 'var(--color-success-green)'
                  : row.status === 'Failed'
                    ? 'var(--color-error-red)'
                    : row.status === 'Pending'
                      ? '#FF9500'
                      : 'var(--color-primary-blue)',
            }}
          >
            {getStatusIcon(row.status)}
            {row.status}
          </span>
          {row.rawStatus && row.rawStatus !== row.status && (
            <div className='text-xs text-gray-400'>{row.rawStatus}</div>
          )}
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: row => (
        <div className='text-right'>
          <div
            className={`text-sm font-semibold ${
              row.transactionType === 'Deposit'
                ? 'text-green-600'
                : row.transactionType === 'Withdrawal'
                  ? 'text-red-600'
                  : 'text-gray-900'
            }`}
          >
            {row.amount}
          </div>
          {row.fromAmount && <div className='text-xs text-gray-500'>{row.fromAmount}</div>}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row, index) => (
        <div className='relative flex items-center justify-end gap-2'>
          {/* Quick Action Buttons */}
          {row.availableActions?.includes('mark_received') && (
            <button
              onClick={() => executeAction(row.id, 'mark_received')}
              disabled={actionLoading === `${row.id}-mark_received`}
              className='flex items-center gap-1 rounded-lg bg-green-100 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-200 disabled:opacity-50'
              title='Mark as Received'
            >
              {actionLoading === `${row.id}-mark_received` ? (
                <Loader2 className='h-3 w-3 animate-spin' />
              ) : (
                <CheckCircle className='h-3 w-3' />
              )}
              Received
            </button>
          )}
          {row.availableActions?.includes('execute_swap') && (
            <button
              onClick={() => executeAction(row.id, 'execute_swap')}
              disabled={actionLoading === `${row.id}-execute_swap`}
              className='flex items-center gap-1 rounded-lg bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200 disabled:opacity-50'
              title='Execute Swap'
            >
              {actionLoading === `${row.id}-execute_swap` ? (
                <Loader2 className='h-3 w-3 animate-spin' />
              ) : (
                <RefreshCw className='h-3 w-3' />
              )}
              Swap
            </button>
          )}
          {row.availableActions?.includes('send_payout') && (
            <button
              onClick={() => executeAction(row.id, 'send_payout')}
              disabled={actionLoading === `${row.id}-send_payout`}
              className='flex items-center gap-1 rounded-lg bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 hover:bg-purple-200 disabled:opacity-50'
              title='Send Payout'
            >
              {actionLoading === `${row.id}-send_payout` ? (
                <Loader2 className='h-3 w-3 animate-spin' />
              ) : (
                <Send className='h-3 w-3' />
              )}
              Payout
            </button>
          )}
          {row.availableActions?.includes('mark_complete') && (
            <button
              onClick={() => executeAction(row.id, 'mark_complete')}
              disabled={actionLoading === `${row.id}-mark_complete`}
              className='flex items-center gap-1 rounded-lg bg-green-100 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-200 disabled:opacity-50'
              title='Mark as Completed'
            >
              {actionLoading === `${row.id}-mark_complete` ? (
                <Loader2 className='h-3 w-3 animate-spin' />
              ) : (
                <CheckCircle className='h-3 w-3' />
              )}
              Complete
            </button>
          )}

          {/* More Actions Menu */}
          <button
            onClick={() => setShowActionsMenu(showActionsMenu === row.id ? null : row.id)}
            className='cursor-pointer rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600'
          >
            <MoreVertical className='h-5 w-5' />
          </button>
          {showActionsMenu === row.id && (
            <div
              className={`absolute ${index !== undefined && index < 3 ? 'top-8' : 'bottom-8'} right-0 z-10 w-48 rounded-lg border border-gray-200 bg-white p-2 shadow-lg`}
            >
              <button
                onClick={() => {
                  setSelectedTransaction(row);
                  setIsDetailsModalOpen(true);
                  setShowActionsMenu(null);
                }}
                className='flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100'
              >
                <Eye className='h-4 w-4' />
                View Details
              </button>
              <button
                onClick={() => {
                  window.open(`/api/receipts/${row.id}`, '_blank');
                  setShowActionsMenu(null);
                }}
                className='flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100'
              >
                <Receipt />
                View Receipt
              </button>
              <button
                onClick={() => {
                  const win = window.open(`/api/receipts/${row.id}`, '_blank');
                  if (win) {
                    win.onload = () => win.print();
                  }
                  setShowActionsMenu(null);
                }}
                className='flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100'
              >
                <Download className='h-4 w-4' />
                Export PDF
              </button>
            </div>
          )}
        </div>
      ),
    },
  ];

  if (loading && transactions.length === 0) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <div className='h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Success/Error Messages */}
      {success && (
        <div className='flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-4 text-green-700'>
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className='text-green-600 hover:text-green-800'>
            ×
          </button>
        </div>
      )}
      {error && (
        <div className='flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4 text-red-700'>
          <span>{error}</span>
          <button onClick={() => setError(null)} className='text-red-600 hover:text-red-800'>
            ×
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className='rounded-xl border border-gray-200 bg-white p-6'>
        <div className='mb-4 flex flex-col justify-between gap-4 md:flex-row md:items-center'>
          {/* Left Side: Search + Filters */}
          <div className='flex flex-1 flex-col gap-3 lg:flex-row lg:items-center'>
            {/* Search */}
            <div className='relative w-full lg:w-64'>
              <Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-500' />
              <input
                type='text'
                placeholder='Search transactions'
                className='w-full rounded-lg border border-gray-200 py-2 pr-4 pl-10 text-sm text-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none'
              />
            </div>

            {/* Filters Row */}
            <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 md:flex md:flex-wrap md:items-center'>
              <Select
                options={[
                  { value: 'all', label: 'All Transactions' },
                  { value: 'deposit', label: 'Deposit' },
                  { value: 'withdrawal', label: 'Withdrawal' },
                  { value: 'payout', label: 'Bank Payment' },
                ]}
                value={filter}
                onChange={setFilter}
                className='w-full md:w-40'
              />

              <Select
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'PENDING', label: 'Pending' },
                  { value: 'DEPOSIT_RECEIVED', label: 'Deposit Received' },
                  { value: 'SWAP_COMPLETED', label: 'Swap Completed' },
                  { value: 'COMPLETED', label: 'Completed' },
                  { value: 'FAILED', label: 'Failed' },
                ]}
                value={status}
                onChange={setStatus}
                className='w-full md:w-40'
              />

              <Select
                options={[{ value: 'all', label: 'All Clients' }]}
                value={client}
                onChange={setClient}
                className='w-full md:w-40'
              />
            </div>
          </div>

          {/* Right Side: Refresh + Date Picker */}
          <div className='flex items-center gap-2'>
            <button
              onClick={() => fetchTransactions()}
              disabled={loading}
              className='flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50'
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <DatePicker value={dateFilter} onChange={setDateFilter} className='w-full md:w-40' />
          </div>
        </div>

        {/* Table */}
        <DataTable
          data={transactions}
          columns={columns}
          getRowId={row => row.id}
          showCheckbox={true}
          onSelectionChange={handleSelectionChange}
          selectedIds={selectedIds}
        />

        {/* Empty State */}
        {transactions.length === 0 && !loading && (
          <div className='py-12 text-center text-gray-500'>
            <p className='text-lg'>No transactions found</p>
            <p className='text-sm'>
              Transactions will appear here once clients start making deposits
            </p>
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={activePage}
          totalPages={totalPages}
          onPageChange={setActivePage}
          itemsPerPage={rowsPerPage}
          onItemsPerPageChange={setRowsPerPage}
        />
      </div>

      {/* Floating Action Bar */}
      {selectedIds.size > 0 && (
        <div className='bg-gradient-dark fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-xl px-4 py-3 text-white shadow-xl md:left-[calc(50%+8rem)]'>
          <span className='text-sm font-light'>{selectedIds.size} transaction(s) selected</span>

          <div className='flex items-center gap-3 border-l border-gray-600 pl-4'>
            <button className='flex cursor-pointer items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-light text-white transition-colors hover:bg-white/20'>
              <Eye className='h-3.5 w-3.5' />
              View Receipt
            </button>
            <button className='bg-gradient-blue flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-light text-white transition-colors hover:bg-blue-700'>
              <Download className='h-3.5 w-3.5' />
              Export PDF
            </button>
            <button
              onClick={handleDeselectAll}
              className='ml-1 cursor-pointer text-xs font-light text-gray-400 hover:text-white'
            >
              Deselect
            </button>
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      <TransactionDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        transaction={selectedTransaction}
      />
    </div>
  );
}
