'use client';

import DeleteIcon from '@/components/icons/DeleteIcon';
import PenEdit from '@/components/icons/PenEdit';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { BeneficialOwner } from '@/lib/api/admin-client';
import { Edit, Trash2 } from 'lucide-react';

interface ViewRepresentativeModalProps {
  isOpen: boolean;
  onClose: () => void;
  representative: BeneficialOwner | null;
  onEdit: (rep: BeneficialOwner) => void;
  onRemove: (rep: BeneficialOwner) => void;
}

interface DataFieldProps {
  label: string;
  value: string | number | undefined;
}

function DataField({ label, value }: DataFieldProps) {
  return (
    <div className='space-y-1'>
      <p className='text-sm font-medium text-gray-500'>{label}</p>
      <p className='text-base font-medium text-gray-800'>{value || 'N/A'}</p>
    </div>
  );
}

export function ViewRepresentativeModal({
  isOpen,
  onClose,
  representative,
  onEdit,
  onRemove,
}: ViewRepresentativeModalProps) {
  if (!representative) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='View Representative' size='md' className='p-0'>
      <div className='space-y-4'>
        {/* Basic Information Section */}
        <div className='space-y-3'>
          <h3 className='text-base font-medium text-gray-800'>Basic Information</h3>

          <div className='grid grid-cols-1 gap-6'>
            <DataField
              label='Full Name'
              value={`${representative.first_name} ${representative.last_name}`}
            />
          </div>

          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <DataField label='Email' value={representative.email} />
            <DataField label='Date of Birth' value={representative.date_of_birth} />
          </div>

          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <DataField label='Phone' value={representative.phone} />
            <DataField label='Title' value={representative.role} />
          </div>
        </div>

        {/* Ownership & Employment Section */}
        <div className='space-y-3'>
          <h3 className='border-t border-gray-200 pt-4 pb-2 text-base font-medium text-gray-800'>
            Ownership & Employment (for USD Banking)
          </h3>

          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <DataField
              label='Ownership Percentage'
              value={`${representative.ownership_percentage}%`}
            />
            <DataField label='Employment Status' value={representative.employment_status} />
          </div>

          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <DataField label='Occupation' value={representative.occupation} />
            <DataField label='Employer' value='N/A' />{' '}
          </div>

          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <DataField label='Annual Income' value='N/A' />{' '}
            <DataField label='Tax ID / SSN' value='N/A' />{' '}
          </div>

          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <DataField label='Source of Funds' value='N/A' />
            <DataField label='Source of Wealth' value='N/A' />
          </div>
        </div>

        {/* Footer Actions */}
        <div className='grid grid-cols-1 gap-4 pt-4 md:grid-cols-2'>
          <Button
            variant='outline'
            onClick={() => onRemove(representative)}
            className='flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-red-100 font-normal text-red-500 hover:bg-red-50 hover:text-red-600'
          >
            <DeleteIcon />
            Remove Representative
          </Button>
          <Button
            onClick={() => onEdit(representative)}
            className='bg-gradient-blue flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg font-normal text-white transition-all hover:bg-blue-700'
          >
            <PenEdit />
            Edit Representative
          </Button>
        </div>
      </div>
    </Modal>
  );
}
