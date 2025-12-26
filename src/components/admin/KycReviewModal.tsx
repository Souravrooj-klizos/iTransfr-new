'use client';

import CheckCircle from '@/components/icons/CheckCircle';
import CloseCircle from '@/components/icons/CloseCircle';
import { Modal } from '@/components/ui/Modal';
import { FileText } from 'lucide-react';

// You might want to move this to a shared types file
export interface KYCRecord {
  id: string;
  userId: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  notes: string[];
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  amlbotRequestId?: string | null;
  riskScore?: number | null;
  client_profiles: {
    id: string;
    first_name: string;
    last_name: string;
    company_name: string;
    country?: string;
  };
  kyc_documents: {
    id: string;
    documentType: string;
    fileUrl: string;
    fileName: string;
    s3Key?: string;
    fileSize?: number;
    mimeType?: string;
    uploadedAt?: string;
  }[];
}

interface KycReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: KYCRecord | null;
  onUpdateStatus: (id: string, status: string, notes: string[]) => Promise<void>;
  loading?: boolean;
}

export default function KycReviewModal({
  isOpen,
  onClose,
  record,
  onUpdateStatus,
  loading = false,
}: KycReviewModalProps) {
  if (!record) return null;

  const handleReject = () => {
    const reason = prompt('Please enter a reason for rejection:');
    if (reason) {
      onUpdateStatus(record.id, 'rejected', [reason]);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title='KYC Details'
      size='lg'
      footer={
        <div className='flex w-full items-center justify-between'>
          <button
            onClick={handleReject}
            disabled={loading || record.status !== 'pending'}
            className='mr-3 flex-1 cursor-pointer rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50'
          >
            <div className='flex items-center justify-center gap-1'>
              <CloseCircle />
              Reject KYC
            </div>
          </button>
          <button
            onClick={() => onUpdateStatus(record.id, 'approved', [])}
            disabled={loading || record.status !== 'pending'}
            className='ml-3 flex-1 cursor-pointer rounded-lg border border-blue-600 bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50'
          >
            <div className='flex items-center justify-center gap-1'>
              <CheckCircle />
              {loading ? 'Processing...' : 'Approve KYC'}
            </div>
          </button>
        </div>
      }
    >
      <div className='space-y-4'>
        {/* Business Details Section */}
        <div>
          <h3 className='mb-3 text-base font-medium text-gray-900'>Business Details</h3>
          <div className='grid grid-cols-2 gap-x-8 gap-y-4'>
            <div>
              <p className='text-xs font-normal text-gray-500'>Legal Business Name</p>
              <p className='mt-1 text-sm font-medium text-gray-900'>
                {record.client_profiles.company_name}
              </p>
            </div>
            <div>
              <p className='text-xs font-normal text-gray-500'>Website</p>
              <a
                href='#'
                className='mt-1 flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline'
              >
                www.{record.client_profiles.company_name.toLowerCase().replace(/\s+/g, '')}.com{' '}
                <span className='text-xs'>↗</span>
              </a>
            </div>
            <div>
              <p className='text-xs font-normal text-gray-500'>Country</p>
              <p className='mt-1 text-sm font-medium text-gray-900'>{record.client_profiles?.country || '-'}</p>
            </div>
            <div>
              <p className='text-xs font-normal text-gray-500'>Registration Number</p>
              <p className='mt-1 text-sm font-medium text-gray-900'>BR-29384723</p>
            </div>
            <div>
              <p className='text-xs font-normal text-gray-500'>Business Type</p>
              <p className='mt-1 text-sm font-medium text-gray-900'>Corporation</p>
            </div>
            <div>
              <p className='text-xs font-normal text-gray-500'>Industry</p>
              <p className='mt-1 text-sm font-medium text-gray-900'>Manufacturing</p>
            </div>
          </div>
        </div>

        {/* Separator */}
        <hr className='border-gray-100' />

        {/* Authorized Representative Section */}
        <div>
          <h3 className='mb-3 text-base font-medium text-gray-900'>Authorized Representative</h3>
          <div className='grid grid-cols-2 gap-x-8 gap-y-4'>
            <div>
              <p className='text-xs font-normal text-gray-500'>Full Name</p>
              <p className='mt-1 text-sm font-medium text-gray-900'>
                {record.client_profiles.first_name} {record.client_profiles.last_name}
              </p>
            </div>
            <div>
              <p className='text-xs font-normal text-gray-500'>Email</p>
              <p className='mt-1 text-sm font-medium text-gray-900'>
                {record.client_profiles.first_name.toLowerCase()}.
                {record.client_profiles.last_name.toLowerCase()}@
                {record.client_profiles.company_name.toLowerCase().replace(/\s+/g, '')}.com
              </p>
            </div>
            <div>
              <p className='text-xs font-normal text-gray-500'>Phone</p>
              <p className='mt-1 text-sm font-medium text-gray-900'>+55 11 99888-1122</p>
            </div>
            <div>
              <p className='text-xs font-normal text-gray-500'>ID Provided</p>
              <p className='mt-1 text-sm font-medium text-gray-900'>
                Passport / National ID / Photo ID
              </p>
            </div>
          </div>
        </div>

        {/* Separator */}
        <hr className='border-gray-100' />

        {/* Uploaded Documents Section */}
        <div>
          <h3 className='mb-3 text-base font-medium text-gray-900'>Uploaded Documents</h3>
          <div className='flex flex-col gap-3'>
            {record.kyc_documents?.map(doc => (
              <div
                key={doc.id}
                className='flex items-center justify-between rounded-lg border border-gray-200 p-2'
              >
                <div className='flex items-center gap-2'>
                  <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100/50 text-blue-600'>
                    <FileText className='h-5 w-5' />
                  </div>
                  <span className='text-sm text-gray-900'>{doc.fileName}</span>
                </div>
                <a
                  href={doc.fileUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50'
                >
                  View Document
                </a>
              </div>
            ))}
            {(!record.kyc_documents || record.kyc_documents.length === 0) && (
              <div className='rounded-lg border border-dashed border-gray-300 bg-gray-50 py-8 text-center'>
                <p className='text-sm text-gray-500'>No documents uploaded.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
