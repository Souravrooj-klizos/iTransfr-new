'use client';

import DeleteIcon from '@/components/icons/DeleteIcon';
import PenEdit from '@/components/icons/PenEdit';
import { Modal } from '@/components/ui/Modal';
import Image from 'next/image';

interface Recipient {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: 'Domestic' | 'International' | 'Crypto';
  bankName?: string;
  currency?: string;
  routingNumber?: string;
  accountNumber?: string;
  address?: string;
  lastUsed: string;
  added: string;
}

interface ViewRecipientModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipient: Recipient | null;
  onEdit?: () => void;
}

export function ViewRecipientModal({
  isOpen,
  onClose,
  recipient,
  onEdit,
}: ViewRecipientModalProps) {
  if (!recipient) return null;

  // Mask account number - show only last 4 digits
  const maskAccountNumber = (accountNumber: string) => {
    if (!accountNumber) return '';
    const lastFour = accountNumber.slice(-4);
    return `**** **** ${lastFour}`;
  };

  // Get type color based on recipient type
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Crypto':
        return 'bg-purple-100 text-purple-600';
      case 'International':
        return 'bg-green-100 text-green-600';
      case 'Domestic':
        return 'bg-blue-100 text-blue-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Recipient Details' size='lg'>
      <div className='space-y-6'>
        {/* Full Name */}
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
          <div>
            <h3 className='mb-2 text-sm font-medium text-gray-600'>Full Name</h3>
            <p className='text-base font-medium text-gray-900'>{recipient.name}</p>
          </div>
          <div>
            <h3 className='mb-2 text-sm font-medium text-gray-600'>Type</h3>
            <span
              className={`inline-block rounded-lg px-3 py-1.5 text-sm font-medium ${getTypeColor(recipient.type)}`}
            >
              {recipient.type}
            </span>
          </div>
        </div>

        {/* Contact Email and Phone Number */}
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
          <div>
            <h3 className='mb-2 text-sm font-medium text-gray-600'>Contact Email</h3>
            <p className='text-base text-gray-900'>{recipient.email}</p>
          </div>
          <div>
            <h3 className='mb-2 text-sm font-medium text-gray-600'>Phone Number</h3>
            <p className='text-base text-gray-900'>{recipient.phone}</p>
          </div>
        </div>

        {/* Last Used and Added */}
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
          <div>
            <h3 className='mb-2 text-sm font-medium text-gray-600'>Last Used</h3>
            <p className='text-base text-gray-900'>{recipient.lastUsed}</p>
          </div>
          <div>
            <h3 className='mb-2 text-sm font-medium text-gray-600'>Added</h3>
            <p className='text-base text-gray-900'>{recipient.added}</p>
          </div>
        </div>

        {/* Financial Details */}
        {recipient.bankName && (
          <div className='border-t border-gray-200 pt-4'>
            <h3 className='mb-4 text-base font-semibold text-gray-900'>Financial Details</h3>
            <div className='space-y-6'>
              {/* Bank Name and Currency */}
              <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                <div>
                  <h4 className='mb-2 text-sm font-medium text-gray-600'>Bank Name</h4>
                  <p className='text-base text-gray-900'>{recipient.bankName}</p>
                </div>
                <div>
                  <h4 className='mb-2 text-sm font-medium text-gray-600'>Currency</h4>
                  <p className='text-base text-gray-900'>{recipient.currency}</p>
                </div>
              </div>

              {/* Wire Routing Number and Account Number */}
              <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                <div>
                  <h4 className='mb-2 text-sm font-medium text-gray-600'>Wire Routing Number</h4>
                  <p className='text-base text-gray-900'>{recipient.routingNumber}</p>
                </div>
                <div>
                  <h4 className='mb-2 text-sm font-medium text-gray-600'>Account Number</h4>
                  <p className='text-base text-gray-900'>
                    {maskAccountNumber(recipient.accountNumber || '')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Address */}
        {recipient.address && (
          <div className='border-t border-gray-200 pt-4'>
            <h3 className='mb-4 text-base font-semibold text-gray-900'>Address</h3>
            <div>
              <h4 className='mb-2 text-sm font-medium text-gray-600'>Full Address</h4>
              <p className='text-base text-gray-900'>{recipient.address}</p>
            </div>
          </div>
        )}

        {/* Footer with buttons */}
        <div className='flex flex-col gap-3 border-t border-gray-200 pt-6 sm:flex-row'>
          <button
            type='button'
            className='flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50'
          >
            <DeleteIcon />
            Remove
          </button>
          <button
            type='button'
            onClick={onEdit}
            className='bg-gradient-blue flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm text-white transition-colors hover:bg-blue-700'
          >
            <PenEdit />
            Edit
          </button>
        </div>
      </div>
    </Modal>
  );
}
