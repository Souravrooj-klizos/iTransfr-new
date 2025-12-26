'use client';

import { TransactionSummaryModal } from '@/components/transactions/TransactionSummaryModal';
import { Modal } from '@/components/ui/Modal';
import { Check, ChevronUp, Download, Eye } from 'lucide-react';
import { useState } from 'react';

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: {
    id: string;
    status: 'Completed' | 'Processing' | 'Failed' | 'Pending';
    amount: string;
    date: string;
    time: string;
    transactionType: string;
    paymentMethod: string;
    recipient: string;
    fee?: string;
  } | null;
  onOpenSummary?: () => void;
}

export function TransactionDetailsModal({
  isOpen,
  onClose,
  transaction,
  onOpenSummary,
}: TransactionDetailsModalProps) {
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);

  if (!transaction) return null;

  const handleViewSummary = () => {
    setIsSummaryModalOpen(true);
    onClose(); // Close the details modal
    onOpenSummary?.(); // Optional callback
  };

  const timelineSteps = [
    {
      title: 'Initiated',
      description: 'Transaction initiated by sender',
      timestamp: 'Dec 28, 2024 14:32 UTC',
      completed: true,
    },
    {
      title: 'Network Fee Applied',
      description: 'Tron network fee: $2.00',
      timestamp: 'Dec 28, 2024 14:32 UTC',
      completed: true,
    },
    {
      title: 'Network Fee Applied',
      description: 'Tron network fee: $2.00',
      timestamp: 'Dec 28, 2024 14:32 UTC',
      completed: true,
    },
    {
      title: 'Blockchain Confirmation',
      description: 'Confirmed on Tron network',
      timestamp: 'Dec 28, 2024 14:32 UTC',
      completed: true,
    },
    {
      title: 'Internal Processing',
      description: 'Verified by system',
      timestamp: 'Dec 28, 2024 14:32 UTC',
      completed: true,
    },
    {
      title: 'Credited to Account',
      description: 'Funds sent to wallet',
      timestamp: 'Dec 28, 2024 14:32 UTC',
      completed: true,
    },
  ];

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title='Transaction Details' size='lg'>
        <div className='space-y-4'>
          {/* Transaction Info Grid */}
          <div className='grid grid-cols-2 gap-6'>
            {/* Transaction ID */}
            <div>
              <h3 className='mb-2 text-sm font-medium text-gray-600'>Transaction ID</h3>
              <p className='text-base font-medium text-gray-900'>{transaction.id}</p>
            </div>

            {/* Status */}
            <div>
              <h3 className='mb-2 text-sm font-medium text-gray-600'>Status</h3>
              <div className='flex items-center gap-2'>
                <div
                  className={`h-2 w-2 rounded-full ${
                    transaction.status === 'Completed'
                      ? 'bg-green-500'
                      : transaction.status === 'Failed'
                        ? 'bg-red-500'
                        : transaction.status === 'Pending'
                          ? 'bg-orange-500'
                          : 'bg-blue-500'
                  }`}
                />
                <span
                  className={`text-base font-medium ${
                    transaction.status === 'Completed'
                      ? 'text-green-600'
                      : transaction.status === 'Failed'
                        ? 'text-red-600'
                        : transaction.status === 'Pending'
                          ? 'text-orange-500'
                          : 'text-blue-600'
                  }`}
                >
                  {transaction.status}
                </span>
              </div>
            </div>

            {/* Amount */}
            <div>
              <h3 className='mb-2 text-sm font-medium text-gray-600'>Amount</h3>
              <p className='text-base font-medium text-gray-900'>{transaction.amount}</p>
            </div>

            {/* Date & Time */}
            <div>
              <h3 className='mb-2 text-sm font-medium text-gray-600'>Date & Time</h3>
              <p className='text-base text-gray-900'>
                {transaction.date} {transaction.time}
              </p>
            </div>

            {/* Fee */}
            <div>
              <h3 className='mb-2 text-sm font-medium text-gray-600'>Fee</h3>
              <p className='text-base text-gray-900'>{transaction.fee || '$2.00'}</p>
            </div>

            {/* Transaction Type */}
            <div>
              <h3 className='mb-2 text-sm font-medium text-gray-600'>Transaction Type</h3>
              <p className='text-base text-gray-900'>{transaction.transactionType}</p>
            </div>
          </div>

          {/* Transaction Timeline */}
          <div className='border-t border-gray-200 pt-6'>
            <div className='mb-4 flex items-center justify-between'>
              <h3 className='text-base font-semibold text-gray-900'>Transaction Timeline</h3>
              <button className='text-gray-400 hover:text-gray-600'>
                <ChevronUp className='h-5 w-5' />
              </button>
            </div>

            <div className='space-y-4'>
              {timelineSteps.map((step, index) => (
                <div key={index} className='flex gap-3'>
                  {/* Icon */}
                  <div className='flex shrink-0 items-center'>
                    <div className='flex h-5 w-5 items-center justify-center rounded-full bg-green-500'>
                      <Check className='h-3 w-3 text-white' />
                    </div>
                  </div>

                  {/* Content */}
                  <div className='flex flex-1 items-start justify-between gap-4'>
                    <div className='flex-1'>
                      <p className='text-sm font-medium text-gray-900'>{step.title}</p>
                      <p className='text-sm text-gray-600'>{step.description}</p>
                    </div>
                    <p className='text-sm whitespace-nowrap text-gray-500'>{step.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex flex-col gap-3 border-t border-gray-200 pt-6 sm:flex-row'>
            <button
              type='button'
              className='flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50'
            >
              <Download className='h-4 w-4' />
              Export PDF
            </button>
            <button
              type='button'
              onClick={handleViewSummary}
              className='bg-gradient-blue flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700'
            >
              <Eye className='h-4 w-4' />
              View Summary
            </button>
          </div>
        </div>
      </Modal>

      {/* Transaction Summary Modal */}
      {transaction && (
        <TransactionSummaryModal
          isOpen={isSummaryModalOpen}
          onClose={() => setIsSummaryModalOpen(false)}
          transaction={{
            id: transaction.id,
            recipient: transaction.recipient,
            recipientAccount: 'USDT • TRC-20',
            recipientAddress: 'TQYrFXcKEx... • FGNlrJ',
            transactionType: transaction.transactionType,
            paymentMethod: transaction.paymentMethod,
            amount: transaction.amount,
            sourceAmount: transaction.amount,
            recipientGets: transaction.amount,
            conversionType: 'Direct transfer • no conversion',
            transferNote:
              transaction.paymentMethod === 'Crypto' ? 'No fees for crypto transfers' : undefined,
          }}
        />
      )}
    </>
  );
}
