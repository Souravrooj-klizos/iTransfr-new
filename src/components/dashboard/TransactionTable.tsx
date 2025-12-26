import {
  DataTable,
  getAmountColor,
  getStatusIcon,
  type TableColumn,
} from '@/components/ui/DataTable';

interface Transaction {
  id: string;
  date: string;
  time: string;
  recipient: string;
  type: string;
  status: 'Completed' | 'Processing' | 'Failed' | 'Pending';
  amount: string;
  currency?: string;
  fromAmount?: string;
  amountColor?: 'success' | 'error' | 'neutral';
}

interface TransactionTableProps {
  transactions: Transaction[];
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  const columns: TableColumn<Transaction>[] = [
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
      key: 'recipient',
      header: 'Recipient',
      render: row => <div className='text-sm text-gray-700'>{row.recipient}</div>,
    },
    {
      key: 'type',
      header: 'Transaction Type',
      render: row => (
        <div className='text-sm text-gray-700'>
          <span className='rounded-lg border border-gray-200 px-2 py-1'>{row.type}</span>
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
        <div>
          <div className='text-sm font-semibold' style={{ color: getAmountColor(row.amountColor) }}>
            {row.amount}
          </div>
          {row.fromAmount && <div className='text-xs text-gray-500'>{row.fromAmount}</div>}
        </div>
      ),
    },
  ];

  return (
    <div className='overflow-hidden'>
      <DataTable
        data={transactions}
        columns={columns}
        getRowId={row => row.id}
        showCheckbox={true}
      />
    </div>
  );
}
