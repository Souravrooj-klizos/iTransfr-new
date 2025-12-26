'use client';

import Receipt from '@/components/icons/Receipt';
import { Modal } from '@/components/ui/Modal';

interface TransactionSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: {
    id: string;
    recipient: string;
    recipientAccount?: string;
    recipientAddress?: string;
    transactionType: string;
    paymentMethod: string;
    amount: string;
    sourceCurrency?: string;
    sourceAmount?: string;
    recipientGets?: string;
    transferNote?: string;
    conversionType?: string;
  } | null;
}

export function TransactionSummaryModal({
  isOpen,
  onClose,
  transaction,
}: TransactionSummaryModalProps) {
  if (!transaction) return null;

  // Determine transfer method icon/badge color based on payment method
  const getPaymentMethodColor = () => {
    switch (transaction.paymentMethod) {
      case 'Crypto':
        return 'bg-purple-100 text-purple-700';
      case 'Fedwire':
        return 'bg-blue-100 text-blue-700';
      case 'SWIFT':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPaymentMethodLabel = () => {
    switch (transaction.paymentMethod) {
      case 'Crypto':
        return 'Crypto Transfers';
      case 'Fedwire':
        return 'Fedwire Transfer';
      case 'SWIFT':
        return 'SWIFT Transfer';
      default:
        return transaction.paymentMethod;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Transaction Summary' size='md'>
      <div className='space-y-4'>
        {/* Transfer Method */}
        <div className='border-b border-gray-200 pb-4'>
          <h3 className='mb-3 text-sm font-medium text-gray-600'>Transfer Method</h3>
          <div className='flex items-center gap-2'>
            <span
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${getPaymentMethodColor()}`}
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='16'
                height='16'
                viewBox='0 0 16 16'
                fill='none'
              >
                <path
                  d='M8 0C3.58 0 0 3.58 0 8C0 12.42 3.58 16 8 16C12.42 16 16 12.42 16 8C16 3.58 12.42 0 8 0ZM8 14C4.69 14 2 11.31 2 8C2 4.69 4.69 2 8 2C11.31 2 14 4.69 14 8C14 11.31 11.31 14 8 14Z'
                  fill='currentColor'
                />
              </svg>
              {getPaymentMethodLabel()}
            </span>
          </div>
        </div>

        {/* Recipient */}
        <div className='border-b border-gray-200 pb-4'>
          <h3 className='mb-3 text-sm font-medium text-gray-600'>Recipient</h3>
          <div className='space-y-2'>
            <p className='text-base font-semibold text-gray-900'>{transaction.recipient}</p>
            {transaction.recipientAccount && (
              <p className='text-sm text-gray-600'>{transaction.recipientAccount}</p>
            )}
            {transaction.recipientAddress && (
              <p className='font-mono text-sm text-gray-500'>{transaction.recipientAddress}</p>
            )}
          </div>
        </div>

        {/* Source Currency */}
        <div className='border-b border-gray-200 pb-4'>
          <h3 className='mb-3 text-sm font-medium text-gray-600'>Source Currency</h3>
          <p className='text-xl font-bold text-gray-900'>
            {transaction.sourceAmount || transaction.amount}
          </p>
        </div>

        {/* Recipient Gets */}
        <div className='border-b border-gray-200 pb-4'>
          <h3 className='mb-3 text-sm font-medium text-gray-600'>Recipient Gets</h3>
          <p className='text-xl font-bold text-gray-900'>
            {transaction.recipientGets || transaction.amount}
          </p>
        </div>

        {/* Conversion Type */}
        {transaction.conversionType && (
          <div className='rounded-lg bg-gray-50 px-4 py-3'>
            <p className='text-sm text-gray-600'>{transaction.conversionType}</p>
          </div>
        )}

        {/* Transfer Note */}
        {transaction.transferNote && (
          <div className='rounded-lg bg-blue-50 px-4 py-3'>
            <p className='text-sm text-blue-700'>{transaction.transferNote}</p>
          </div>
        )}

        {/* View Receipt Button */}
        <div className='border-t border-gray-200 pt-6'>
          <button
            type='button'
            className='bg-gradient-blue flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700'
          >
            <Receipt />
            View Receipt
          </button>
        </div>
      </div>
    </Modal>
  );
}
