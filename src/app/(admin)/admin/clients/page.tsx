'use client';

import { Button } from '@/components/ui/Button';
import { DataTable, TableColumn } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { OnboardingStepSkeleton } from '@/components/ui/SkeletonLoader';
import { useToast } from '@/components/ui/Toast';
import { useDebouncedSearch } from '@/hooks/useDebouncedSearch';
import { adminClientApi } from '@/lib/api/admin-client';
import {
  AlertCircle,
  CheckCircle,
  CircleGauge,
  Clock,
  Edit,
  Eye,
  MoreHorizontal,
  Plus,
  PlusIcon,
  Search,
  Trash2,
  UserPlus,
  XCircle,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

// Import validation helper hook
import { useClientOnboarding } from '@/hooks/useClientOnboarding';

// Import onboarding step components
import { Step1AccountType } from '@/app/(public)/signup/steps/Step1AccountType';
import { Step2BusinessInfo } from '@/app/(public)/signup/steps/Step2BusinessInfo';
import Step3BusinessDetails from '@/app/(public)/signup/steps/Step3BusinessDetails';
import { Step4VolumeOperations } from '@/app/(public)/signup/steps/Step4VolumeOperations';
import { Step5OwnersRepresentatives } from '@/app/(public)/signup/steps/Step5OwnersRepresentatives';
import { Step6PEPSanctionsScreening } from '@/app/(public)/signup/steps/Step6PEPSanctionsScreening';
import { Step7DocumentUpload } from '@/app/(public)/signup/steps/Step7DocumentUpload';
import { Step8InformationSubmitted } from '@/app/(public)/signup/steps/Step8InformationSubmitted';
import { useRouter } from 'next/navigation';

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  company_name: string;
  email: string;
  mobile: string;
  country: string;
  city: string;
  status: 'pending_kyc' | 'active' | 'suspended' | 'onboarding' | 'rejected';
  account_type: 'personal' | 'business' | 'fintech' | null;
  onboarding_step: number;
  onboarding_completed: boolean;
  createdAt: string;
  kyc_status?: string;
  owner_count?: number;
  // New fields for design
  monthly_volume?: string;
  client_id_display?: string; // e.g., GLBX-78945
}

// Simple Action Menu Component
function ActionMenu({
  client,
  onView,
  onEdit,
  onDelete,
}: {
  client: Client;
  onView: (c: Client) => void;
  onEdit: (c: Client) => void;
  onDelete: (c: Client) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = 150;
      const dropdownWidth = 192; // w-48 = 12rem = 192px
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward = spaceBelow < dropdownHeight;

      setMenuPosition({
        top: openUpward ? rect.top - dropdownHeight : rect.bottom + 4,
        left: Math.max(8, rect.right - dropdownWidth),
      });
    }

    setIsOpen(!isOpen);
  };

  return (
    <div className='relative'>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className='cursor-pointer rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700'
      >
        <MoreHorizontal className='h-4 w-4' />
      </button>

      {isOpen &&
        ReactDOM.createPortal(
          <>
            <div className='fixed inset-0 z-50' onClick={() => setIsOpen(false)} />
            <div
              className='ring-opacity-5 fixed z-50 w-48 rounded-lg bg-white p-1 shadow-lg ring-1 ring-gray-200'
              style={{ top: menuPosition.top, left: menuPosition.left }}
            >
              <div className='py-1' role='menu'>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onView(client);
                    setIsOpen(false);
                  }}
                  className='flex w-full cursor-pointer items-center rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                >
                  <Eye className='mr-3 h-4 w-4 text-gray-400' />
                  View Client
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onEdit(client);
                    setIsOpen(false);
                  }}
                  className='flex w-full cursor-pointer items-center rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                >
                  <Edit className='mr-3 h-4 w-4 text-gray-400' />
                  Edit Client
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onDelete(client);
                    setIsOpen(false);
                  }}
                  className='flex w-full cursor-pointer items-center rounded-lg px-4 py-2 text-sm text-red-600 hover:bg-gray-100'
                >
                  <Trash2 className='mr-3 h-4 w-4 text-red-400' />
                  Delete Client
                </button>
              </div>
            </div>
          </>,
          document.body
        )}
    </div>
  );
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [jumpToPage, setJumpToPage] = useState('');

  // Search state - using debounced search hook
  const [searchInput, debouncedSearchTerm, setSearchInput, isSearchDebouncing] = useDebouncedSearch(
    '',
    500
  );

  const toast = useToast();
  const router = useRouter();

  // Add client onboarding flow state - using custom hook
  const STORAGE_KEY = 'admin_onboarding_session_id';
  const {
    currentStep: onboardingStep,
    sessionId,
    isSubmitting,
    isGoingBack,
    isLoadingSession: isResumingSession,
    isLoadingStepData,
    validationErrors,
    formData: clientFormData,
    setCurrentStep: setOnboardingStep,
    updateFormData: updateClientFormData,
    setFormData: setClientFormData,
    goToNextStep,
    goToPreviousStep: handleOnboardingBack,
    resetOnboarding,
    resumeSession,
    setSessionId,
  } = useClientOnboarding({
    mode: 'admin',
    storageKey: STORAGE_KEY,
    onComplete: () => {
      // Clear storage and close modal
      localStorage.removeItem(STORAGE_KEY);
      setShowAddModal(false);
      fetchClients();
    },
  });

  const isMounted = useRef(false);

  // Effect for search/filter changes - reset to page 1
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }

    console.log('[ClientsPage] Search/filter changed, resetting to page 1:', {
      debouncedSearchTerm,
      statusFilter,
      typeFilter,
      pageSize,
    });
    // If we are already on page 1, the page change effect won't run, so we must fetch manually.
    // If we are NOT on page 1, setting current page to 1 will trigger the page change effect.
    if (currentPage === 1) {
      fetchClients(1);
    } else {
      setCurrentPage(1);
    }
    setJumpToPage(''); // Clear jump input when resetting to page 1
  }, [debouncedSearchTerm, statusFilter, typeFilter, pageSize]);

  // Effect for page changes
  useEffect(() => {
    fetchClients(currentPage);
  }, [currentPage]);

  const fetchClients = useCallback(
    async (page = currentPage, search = debouncedSearchTerm) => {
      try {
        setLoading(true);

        // Fetch clients from the Admin API with pagination and filters
        const result = await adminClientApi.listClients({
          search: search || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          type: typeFilter !== 'all' ? typeFilter : undefined,
          page,
          limit: pageSize,
        });

        // Transform and mock data for design
        const transformedClients = result.clients.map(client => ({
          ...client,
          // Mock fields for design
          monthly_volume: Math.random() > 0.5 ? '$100,000+' : '$10,000-$50,000',
          client_id_display: `CLT-${client.id.substring(0, 5).toUpperCase()}`,
          status: client.status || 'pending_kyc', // Ensure status exists
        }));

        setClients(transformedClients);
        setTotal(result.total);
        setTotalPages(result.totalPages);
        setCurrentPage(result.page);
      } catch (error: any) {
        console.error('Error fetching clients:', error);
        toast.error('Error', 'Failed to load clients');
      } finally {
        setLoading(false);
      }
    },
    [currentPage, debouncedSearchTerm, statusFilter, typeFilter, pageSize]
  );

  // Handle Add Client button click - check for existing session
  const handleAddClientClick = () => {
    const savedSessionId = localStorage.getItem(STORAGE_KEY);
    if (savedSessionId) {
      setShowResumePrompt(true);
    } else {
      resetOnboarding();
      setShowAddModal(true);
    }
  };

  const handleResumeConfirm = async () => {
    const savedSessionId = localStorage.getItem(STORAGE_KEY);
    if (savedSessionId) {
      await resumeSession(savedSessionId);
    }
    setShowResumePrompt(false);
    setShowAddModal(true);
  };

  const handleNewClientConfirm = () => {
    resetOnboarding();
    setShowResumePrompt(false);
    setShowAddModal(true);
  };

  // Handle delete client
  const handleDeleteClient = async () => {
    if (!clientToDelete) return;

    setIsDeleting(true);
    try {
      await adminClientApi.deleteClient(clientToDelete.id);
      toast.success('Success', 'Client deleted successfully');
      fetchClients(); // Refresh the list
      setShowDeleteConfirm(false);
      setClientToDelete(null);
    } catch (error: any) {
      console.error('Error deleting client:', error);
      toast.error('Error', error.message || 'Failed to delete client');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle edit client - resume onboarding for editing
  const handleEditClient = async (client: Client) => {
    try {
      // For editing, we'll resume the session to allow modifications
      await resumeSession(client.id);
      setShowAddModal(true);
    } catch (error: any) {
      console.error('Error resuming session for edit:', error);
      toast.error('Error', 'Failed to load client for editing');
    }
  };

  // Handle view client - navigate to detail page
  const handleViewClient = (client: Client) => {
    router.push(`/admin/clients/${client.id}`);
  };

  const getStatusBadge = (status: string, onboardingCompleted: boolean) => {
    if (!onboardingCompleted) {
      return (
        <span className='inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium text-blue-500'>
          <CircleGauge className='mr-2 h-4 w-4' />
          In Onboarding
        </span>
      );
    }

    switch (status) {
      case 'active':
        return (
          <span className='inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium text-green-600'>
            <CheckCircle className='mr-2 h-4 w-4' />
            Active
          </span>
        );
      case 'pending_kyc':
        return (
          <span className='inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium text-orange-400'>
            <Clock className='mr-2 h-4 w-4' />
            Pending KYC
          </span>
        );
      case 'suspended':
        return (
          <span className='inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium text-red-600'>
            <XCircle className='mr-2 h-4 w-4' />
            Suspended
          </span>
        );
      default:
        return (
          <span className='inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium text-gray-600'>
            <AlertCircle className='mr-2 h-4 w-4' />
            Unknown
          </span>
        );
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleJumpToPage = () => {
    const page = parseInt(jumpToPage, 10);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setJumpToPage(''); // Clear the input after jumping
    }
  };

  const handleJumpInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJumpToPage();
    }
  };

  const renderOnboardingStep = () => {
    switch (onboardingStep) {
      case 1:
        return (
          <Step1AccountType
            selectedType={clientFormData.accountType}
            onSelect={type => updateClientFormData('accountType', type)}
          />
        );
      case 2:
        return (
          <Step2BusinessInfo
            formData={clientFormData}
            onChange={updateClientFormData}
            errors={validationErrors}
          />
        );
      case 3:
        return (
          <Step3BusinessDetails
            formData={clientFormData}
            onChange={updateClientFormData}
            errors={validationErrors}
          />
        );
      case 4:
        return (
          <Step4VolumeOperations
            formData={clientFormData}
            onChange={updateClientFormData}
            errors={validationErrors}
          />
        );
      case 5:
        return (
          <Step5OwnersRepresentatives
            formData={clientFormData}
            onChange={updateClientFormData}
            errors={validationErrors}
          />
        );
      case 6:
        return (
          <Step6PEPSanctionsScreening
            formData={clientFormData}
            onChange={updateClientFormData}
            errors={validationErrors}
          />
        );
      case 7:
        return (
          <Step7DocumentUpload
            formData={clientFormData}
            onChange={updateClientFormData}
            sessionId={sessionId}
          />
        );
      case 8:
        return (
          <Step8InformationSubmitted
            formData={clientFormData}
            onChange={updateClientFormData}
            errors={validationErrors}
          />
        );
      default:
        return (
          <div className='flex h-40 items-center justify-center text-gray-500'>
            Step {onboardingStep} content coming soon...
          </div>
        );
    }
  };

  const getOnboardingStepConfig = () => {
    switch (onboardingStep) {
      case 1:
        return {
          title: 'Choose Account Type',
          subtitle: "Select the type of account you'd like to create",
          showBack: false,
        };
      case 2:
        return {
          title: 'Business Information',
          subtitle: 'Enter the legal entity details',
          showBack: true,
        };
      case 3:
        return {
          title: 'Business Details',
          subtitle: 'Tell us more about the business',
          showBack: true,
        };
      case 4:
        return {
          title: 'Volume & Operations',
          subtitle: 'Tell us about expected transaction volumes and operational regions',
          showBack: true,
        };
      case 5:
        return {
          title: 'Owner & Representatives',
          subtitle: 'Tell us about the ownership and representatives',
          showBack: true,
        };
      case 6:
        return {
          title: 'PEP & Sanctions Screening',
          subtitle: 'Answer the following questions about political exposure',
          showBack: true,
        };
      case 7:
        return {
          title: 'Document Upload',
          subtitle: 'Upload required business documents',
          showBack: true,
        };
      case 8:
        return {
          title: 'Review & Submit',
          subtitle: 'Review all information before creating the client',
          showBack: true,
        };
      default:
        return {
          title: 'Step ' + onboardingStep,
          subtitle: 'Details for step ' + onboardingStep,
          showBack: true,
        };
    }
  };

  // Define Table Columns
  const columns: TableColumn<Client>[] = [
    {
      key: 'client_id_display',
      header: 'Client ID',
      render: client => (
        <span className='text-xs font-medium text-gray-500'>
          {client.client_id_display || client.id.substring(0, 8)}
        </span>
      ),
    },
    {
      key: 'company_name',
      header: 'Business Name',
      render: client => (
        <div className='flex flex-col'>
          <button
            onClick={() => handleViewClient(client)}
            className='cursor-pointer text-left text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline'
          >
            {client.company_name || 'No company'}
          </button>
          {/* <span className='text-xs text-gray-500'>
            {client.first_name} {client.last_name}
          </span> */}
        </div>
      ),
    },
    {
      key: 'account_type',
      header: 'Type',
      render: client => {
        const type = client.account_type || 'regular';
        const isFintech = type === 'fintech';
        return (
          <span
            className={`inline-flex items-center rounded-lg border px-3 py-1 text-xs font-medium ${
              isFintech
                ? 'border-purple-200 bg-purple-100 text-purple-500'
                : 'border-blue-200 bg-blue-100 text-blue-500'
            }`}
          >
            {isFintech ? 'MSB / Fintech' : 'Regular'}
          </span>
        );
      },
    },
    {
      key: 'country',
      header: 'Country',
      render: client => (
        <span className='text-sm font-medium text-gray-500'>{client.country || 'N/A'}</span>
      ),
    },
    {
      key: 'progress',
      header: 'Progress',
      render: client => (
        <div className='min-w-[100px]'>
          <div className='text-sm text-gray-700'>Step {client.onboarding_step}/8</div>
          <div className='mt-1 h-1 w-full rounded-full bg-gray-200'>
            <div
              className='h-1 rounded-full bg-blue-500'
              style={{ width: `${(client.onboarding_step / 8) * 100}%` }}
            ></div>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: client => getStatusBadge(client.status, client.onboarding_completed),
    },
    {
      key: 'monthly_volume',
      header: 'Monthly Volume',
      render: client => (
        <span className='text-sm font-medium text-gray-700'>{client.monthly_volume || '$0'}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: client => (
        <ActionMenu
          client={client}
          onView={handleViewClient}
          onEdit={handleEditClient}
          onDelete={c => {
            setClientToDelete(c);
            setShowDeleteConfirm(true);
          }}
        />
      ),
    },
  ];

  return (
    <div className='space-y-6 rounded-lg border bg-white p-4'>
      {/* Filters */}
      <div className='mb-4 flex flex-col justify-between gap-4 xl:flex-row'>
        {/* ... existing filters ... */}
        <div className='flex flex-1 flex-col items-start gap-3 lg:flex-row lg:items-center'>
          <div className='relative w-full lg:w-72'>
            <Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
            <Input
              placeholder='Search name or ID...'
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className='pl-10'
            />
            {isSearchDebouncing && (
              <div className='absolute top-1/2 right-3 -translate-y-1/2'>
                <div className='h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500'></div>
              </div>
            )}
          </div>

          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { value: 'all', label: 'All Type' },
              { value: 'onboarding', label: 'Regular' },
              { value: 'active', label: 'Fintech' },
            ]}
            className='w-full lg:w-40'
          />

          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'onboarding', label: 'In Onboarding' },
              { value: 'active', label: 'Active' },
              { value: 'pending_kyc', label: 'Pending KYC' },
              { value: 'suspended', label: 'Suspended' },
            ]}
            className='w-full lg:w-40'
          />

          {/* Jump to Page */}
          <div className='flex items-center gap-2'>
            <span className='hidden text-sm whitespace-nowrap text-gray-600 sm:inline'>
              Go to page:
            </span>
            <span className='text-sm whitespace-nowrap text-gray-600 sm:hidden'>Page:</span>
            <Input
              type='number'
              value={jumpToPage}
              onChange={e => setJumpToPage(e.target.value)}
              onKeyPress={handleJumpInputKeyPress}
              placeholder='1'
              min='1'
              max={totalPages}
              className='h-8 w-16 text-center text-sm'
            />
            <Button
              onClick={handleJumpToPage}
              disabled={
                !jumpToPage || parseInt(jumpToPage, 10) < 1 || parseInt(jumpToPage, 10) > totalPages
              }
              className='h-8 cursor-pointer bg-blue-600 px-3 text-xs hover:bg-blue-700 disabled:bg-gray-300'
            >
              Go
            </Button>
          </div>
        </div>

        <div>
          <Button
            onClick={handleAddClientClick}
            className='bg-gradient-blue cursor-pointer px-4 text-white transition-all hover:bg-blue-700'
          >
            <PlusIcon className='mr-1 h-4 w-4 text-white' />
            Add Client
          </Button>
        </div>
      </div>

      {/* Clients Table */}
      {loading ? (
        <div className='flex h-64 items-center justify-center rounded-lg border bg-white'>
          <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600'></div>
        </div>
      ) : (
        <>
          <DataTable
            data={clients}
            columns={columns}
            getRowId={client => client.id}
            showCheckbox={true}
            onSelectionChange={ids => console.log('Selected:', ids)}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='mt-6 border-t border-gray-200 bg-white px-4 py-3 sm:px-6'>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                itemsPerPage={pageSize.toString()}
                onItemsPerPageChange={value => {
                  setPageSize(parseInt(value, 10));
                  setCurrentPage(1);
                  setJumpToPage('');
                }}
                itemsPerPageOptions={[
                  { value: '5', label: '5' },
                  { value: '10', label: '10' },
                  { value: '20', label: '20' },
                  { value: '50', label: '50' },
                  { value: '100', label: '100' },
                ]}
                showItemsPerPage={true}
                renderLeft={
                  <p className='text-sm text-gray-700'>
                    Showing <span className='font-medium'>{(currentPage - 1) * pageSize + 1}</span>{' '}
                    to{' '}
                    <span className='font-medium'>{Math.min(currentPage * pageSize, total)}</span>{' '}
                    of <span className='font-medium'>{total}</span> results
                  </p>
                }
                className='mt-0'
              />
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {clients.length === 0 && !loading && (
        <div className='rounded-lg border bg-white py-12 text-center'>
          <UserPlus className='mx-auto h-12 w-12 text-gray-400' />
          <h3 className='mt-2 text-sm font-medium text-gray-900'>No clients found</h3>
          <p className='mt-1 text-sm text-gray-500'>
            {debouncedSearchTerm || statusFilter !== 'all' || typeFilter !== 'all'
              ? 'Try adjusting your search or filters.'
              : 'Get started by adding your first client.'}
          </p>
          <div className='mt-6'>
            <Button
              onClick={() => setShowAddModal(true)}
              className='bg-gradient-blue cursor-pointer px-4 text-white transition-all hover:bg-blue-700'
            >
              <Plus className='mr-2 h-4 w-4' />
              Add Client
            </Button>
          </div>
        </div>
      )}

      {/* Add Client Modal - Full Onboarding Flow */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          // Don't reset sessionId or step - keep for resume
          // Session clears when onboarding completes successfully
        }}
        title=''
        size='xl'
        className='p-0'
      >
        <div className='max-h-[90vh] overflow-y-auto py-2'>
          {isResumingSession ? (
            // Show skeleton loader while resuming session
            <div className='space-y-4'>
              <div className='text-center'>
                <h3 className='mb-2 text-lg font-semibold'>Loading your progress...</h3>
                <p className='text-sm text-gray-600'>Please wait while we retrieve your session</p>
              </div>
              <OnboardingStepSkeleton />
            </div>
          ) : (
            <>
              {/* Title and Subtitle */}
              <div className='mb-6'>
                <div className='flex items-center justify-between'>
                  <h1 className='mb-2 text-3xl font-semibold text-gray-900'>
                    {getOnboardingStepConfig().title}
                  </h1>
                  <div className='text-sm text-gray-500'>Step {onboardingStep} of 8</div>
                </div>
                <p className='text-gray-600'>{getOnboardingStepConfig().subtitle}</p>
              </div>

              {/* Progress Bars - matching signup design */}
              <div className='mb-8 flex gap-2'>
                {Array.from({ length: 8 }).map((_, i) => {
                  const currentStepNumber = i + 1;
                  let bgColor = 'bg-gray-200';
                  if (currentStepNumber < onboardingStep) {
                    bgColor = 'bg-green-600';
                  } else if (currentStepNumber === onboardingStep) {
                    bgColor = 'bg-blue-600';
                  }

                  return <div key={i} className={`h-1 flex-1 rounded-full ${bgColor}`} />;
                })}
              </div>

              {/* Step Content */}
              <div className='mb-8 max-h-[59vh] overflow-y-auto'>{renderOnboardingStep()}</div>
            </>
          )}

          {/* Navigation Buttons */}
          <div className='flex items-center justify-between'>
            {onboardingStep > 1 ? (
              <Button
                variant='outline'
                onClick={handleOnboardingBack}
                disabled={isGoingBack}
                className='cursor-pointer px-8 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50'
              >
                {isGoingBack ? 'Loading...' : 'Previous'}
              </Button>
            ) : (
              <div></div> /* Spacer */
            )}

            <div className='flex gap-3'>
              <Button
                variant='outline'
                onClick={() => {
                  setShowAddModal(false);
                  setOnboardingStep(1);
                  setSessionId(null);
                }}
                className='cursor-pointer px-5 text-gray-500 hover:text-gray-700'
              >
                Cancel
              </Button>

              <Button
                onClick={goToNextStep}
                disabled={isSubmitting}
                className='bg-gradient-blue cursor-pointer px-8 text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50'
              >
                {isSubmitting ? 'Saving...' : onboardingStep < 8 ? 'Next' : 'Create Client'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Client Details Modal (placeholder for future) */}
      {selectedClient && (
        <Modal
          isOpen={!!selectedClient}
          onClose={() => setSelectedClient(null)}
          title='Client Details'
          size='lg'
        >
          <div className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700'>Name</label>
                <p className='text-sm text-gray-900'>
                  {selectedClient.first_name} {selectedClient.last_name}
                </p>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700'>Company</label>
                <p className='text-sm text-gray-900'>{selectedClient.company_name || 'N/A'}</p>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700'>Email</label>
                <p className='text-sm text-gray-900'>{selectedClient.email}</p>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700'>Status</label>
                {getStatusBadge(selectedClient.status, selectedClient.onboarding_completed)}
              </div>
            </div>
          </div>

          <div className='mt-6 flex justify-end'>
            <Button
              variant='outline'
              onClick={() => setSelectedClient(null)}
              className='cursor-pointer text-gray-600'
            >
              Close
            </Button>
          </div>
        </Modal>
      )}
      {/* Resume Prompt Modal */}
      <Modal
        isOpen={showResumePrompt}
        onClose={() => setShowResumePrompt(false)}
        title='Resume Application?'
        size='sm'
      >
        <div className='space-y-4'>
          <p className='text-gray-600'>
            You have an unfinished client application in progress. Would you like to resume where
            you left off or start a new application?
          </p>
          <div className='flex flex-col gap-3 pt-2'>
            <Button
              onClick={handleResumeConfirm}
              className='bg-gradient-blue w-full cursor-pointer text-white hover:bg-blue-700'
            >
              Resume Existing Application
            </Button>
            <Button
              variant='outline'
              onClick={handleNewClientConfirm}
              className='w-full cursor-pointer text-gray-600'
            >
              Start New Application
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => !isDeleting && setShowDeleteConfirm(false)}
        title='Delete Client'
        size='sm'
      >
        <div className='space-y-4'>
          <div className='flex items-start gap-3'>
            <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100'>
              <Trash2 className='h-5 w-5 text-red-600' />
            </div>
            <div className='space-y-2'>
              <h3 className='text-lg font-medium text-gray-900'>
                Are you sure you want to delete this client?
              </h3>
              <p className='text-sm text-gray-600'>
                This action cannot be undone. This will permanently delete the client{' '}
                <span className='font-medium'>
                  {clientToDelete?.first_name} {clientToDelete?.last_name}
                </span>{' '}
                and all associated data including:
              </p>
              <ul className='list-inside list-disc space-y-1 text-sm text-gray-600'>
                <li>Client profile and account information</li>
                <li>KYC records and verification status</li>
                <li>Uploaded documents and files</li>
                <li>Onboarding session data</li>
                <li>Audit logs and activity history</li>
              </ul>
            </div>
          </div>

          <div className='flex flex-col gap-3 border-t pt-4'>
            <Button
              onClick={handleDeleteClient}
              disabled={isDeleting}
              className='w-full cursor-pointer bg-red-600 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50'
            >
              {isDeleting ? 'Deleting...' : 'Yes, Delete Client'}
            </Button>
            <Button
              variant='outline'
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
              className='w-full cursor-pointer text-gray-600 disabled:opacity-50'
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
