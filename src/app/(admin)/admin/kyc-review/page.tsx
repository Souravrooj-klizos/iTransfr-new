'use client';

import KycReviewModal, { type KYCRecord } from '@/components/admin/KycReviewModal';
import { DataTable, getStatusIcon, type TableColumn } from '@/components/ui/DataTable';
import { DatePicker } from '@/components/ui/DatePicker';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import adminApi from '@/lib/api/admin';
import { Eye, FileText, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function KYCReviewPage() {
  const [kycRecords, setKycRecords] = useState<KYCRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<KYCRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [status, setStatus] = useState('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [activePage, setActivePage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState('10');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const toast = useToast();

  useEffect(() => {
    fetchKYCRecords();
  }, []);

  async function fetchKYCRecords() {
    try {
      setLoading(true);
      const { data: kycRecords } = await adminApi.kyc.list({
        status: status !== 'all' ? status : undefined,
      });
      if (kycRecords) {
        setKycRecords(kycRecords as any);
      }
    } catch (error) {
      console.error('Error fetching KYC records:', error);
      toast.error('Failed to load KYC records', 'Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  }

  async function updateKYCStatus(id: string, status: string, notes: string[]) {
    setActionLoading(true);
    try {
      let result;
      if (status === 'approved') {
        result = await adminApi.kyc.approve(id, notes[0]);
        toast.success('KYC Approved', 'The client has been notified of their approval.');
      } else if (status === 'rejected') {
        result = await adminApi.kyc.reject(id, notes[0]);
        toast.warning('KYC Rejected', 'The client has been notified with the rejection reason.');
      } else {
        console.warn('Only approve/reject supported via helper');
        toast.info('Status Update', 'Only approve/reject actions are supported.');
        return;
      }

      if (result) {
        await fetchKYCRecords();
        setSelectedRecord(null);
      }
    } catch (error: any) {
      console.error('Error updating KYC status:', error);
      toast.error('Failed to Update KYC', error.message || 'Please try again.');
    } finally {
      setActionLoading(false);
    }
  }

  /* eslint-disable react/display-name */
  const columns: TableColumn<KYCRecord>[] = [
    {
      key: 'companyName',
      header: 'Company Name',
      // width: '200px',
      render: row => (
        <span className='text-sm text-gray-800'>{row.client_profiles.company_name}</span>
      ),
    },
    {
      key: 'country',
      header: 'Country',
      render: row => <span className='text-sm text-gray-800'>{row.client_profiles?.country || '-'}</span>,
    },
    {
      key: 'submitted',
      header: 'Submitted',
      render: row => (
        <div className='flex flex-col'>
          <span className='text-sm text-gray-800'>
            {new Date(row.createdAt).toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
          <span className='text-xs text-gray-500'>
            {new Date(row.createdAt).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
              timeZone: 'UTC',
            })}{' '}
            UTC
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: row => {
        const getIconStatus = (status: string) => {
          switch (status) {
            case 'approved':
              return 'Completed';
            case 'rejected':
              return 'Failed';
            case 'pending':
              return 'Pending';
            case 'under_review':
              return 'Processing';
            default:
              return 'Processing';
          }
        };

        const getColorAndText = (status: string) => {
          switch (status) {
            case 'approved':
              return { color: 'var(--color-success-green)', text: 'Approved' };
            case 'rejected':
              return { color: 'var(--color-error-red)', text: 'Rejected' };
            case 'pending':
              return { color: '#FF9500', text: 'Pending' };
            case 'under_review':
              return { color: 'var(--color-primary-blue)', text: 'Under Review' };
            default:
              return { color: 'var(--color-primary-blue)', text: status };
          }
        };

        const { color, text } = getColorAndText(row.status);

        return (
          <span className='inline-flex items-center text-sm font-medium' style={{ color }}>
            {getStatusIcon(getIconStatus(row.status))}
            {text}
          </span>
        );
      },
    },
    {
      key: 'comments',
      header: 'Comments',
      render: row => (
        <span
          className={`text-sm ${row.notes && row.notes.length > 0 ? 'text-gray-500' : 'font-light text-gray-400'}`}
        >
          {row.notes && row.notes.length > 0 ? row.notes[0] : 'No Comments'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row, index) => (
        <button
          onClick={() => setSelectedRecord(row)}
          className='inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50'
        >
          <Eye className='h-4 w-4 text-gray-600' />
          View
        </button>
      ),
    },
  ];

  const handleSelectionChange = (ids: Set<string>) => {
    setSelectedIds(ids);
  };

  console.log(kycRecords);
  return (
    <>
      {/* Document Review Modal */}
      <KycReviewModal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        record={selectedRecord}
        onUpdateStatus={updateKYCStatus} // @ts-ignore
        loading={actionLoading}
      />

      <div className='space-y-6'>
        {loading ? (
          <div className='py-12 text-center'>
            <div className='mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'></div>
            <p className='mt-4 text-gray-500'>Loading records...</p>
          </div>
        ) : kycRecords.length === 0 ? (
          <div className='rounded-lg border border-gray-200 bg-white py-12 text-center'>
            <FileText className='mx-auto mb-4 h-12 w-12 text-gray-400' />
            <h3 className='text-lg font-medium text-gray-900'>No Pending KYC Requests</h3>
            <p className='mt-2 text-gray-500'>
              All caught up! There are no KYC documents waiting for review.
            </p>
          </div>
        ) : (
          <>
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
                      placeholder='Search companies'
                      className='w-full rounded-lg border border-gray-200 py-2 pr-4 pl-10 text-sm text-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none'
                    />
                  </div>

                  {/* Filters Row */}
                  <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 md:flex md:flex-wrap md:items-center'>
                    <Select
                      options={[
                        { value: 'all', label: 'All Companies' },
                        { value: 'Liberty Trading Inc.', label: 'Liberty Trading Inc.' },
                      ]}
                      value={filter}
                      onChange={setFilter}
                      className='w-full md:w-40'
                    />

                    <Select
                      options={[
                        { value: 'all', label: 'All Statuses' },
                        { value: 'completed', label: 'Completed' },
                        { value: 'processing', label: 'Processing' },
                        { value: 'failed', label: 'Failed' },
                        { value: 'pending', label: 'Pending' },
                      ]}
                      value={status}
                      onChange={setStatus}
                      className='w-full md:w-40'
                    />
                  </div>
                </div>

                {/* Right Side: Date Picker */}
                <div className='w-full md:w-auto'>
                  <DatePicker
                    value={dateFilter}
                    onChange={setDateFilter}
                    className='w-full md:w-40'
                  />
                </div>
              </div>

              {/* Table */}
              <DataTable
                data={kycRecords}
                columns={columns}
                getRowId={row => row.id}
                showCheckbox={true}
                onSelectionChange={handleSelectionChange}
                selectedIds={selectedIds}
              />

              {/* Pagination */}
              <Pagination
                currentPage={activePage}
                totalPages={25}
                onPageChange={setActivePage}
                itemsPerPage={rowsPerPage}
                onItemsPerPageChange={setRowsPerPage}
              />
            </div>
          </>
        )}
      </div>
    </>
  );
}
