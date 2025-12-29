'use client';

import { Button } from '@/components/ui/Button';
import { DataTable, TableColumn } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/Input';
import { adminClientApi, BeneficialOwner } from '@/lib/api/admin-client';
import { Edit, Eye, MoreHorizontal, Plus, Search, Trash2 } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { AddRepresentativeModal } from './AddRepresentativeModal';
import { ViewRepresentativeModal } from './ViewRepresentativeModal';

interface ClientRepresentativesProps {
  clientId: string;
}

// Action Menu Component (reused from clients page but tailored for representatives)
function RepActionMenu({
  rep,
  onView,
  onEdit,
  onRemove,
}: {
  rep: BeneficialOwner;
  onView: (r: BeneficialOwner) => void;
  onEdit: (r: BeneficialOwner) => void;
  onRemove: (r: BeneficialOwner) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = 150;
      const dropdownWidth = 192;
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
                    onView(rep);
                    setIsOpen(false);
                  }}
                  className='flex w-full cursor-pointer items-center rounded-lg px-2 py-2 text-sm text-gray-700 hover:bg-gray-100'
                >
                  <Eye className='mr-2 h-4 w-4 text-gray-400' />
                  View Representative
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onEdit(rep);
                    setIsOpen(false);
                  }}
                  className='flex w-full cursor-pointer items-center rounded-lg px-2 py-2 text-sm text-gray-700 hover:bg-gray-100'
                >
                  <Edit className='mr-2 h-4 w-4 text-gray-400' />
                  Edit Representative
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onRemove(rep);
                    setIsOpen(false);
                  }}
                  className='flex w-full cursor-pointer rounded-lg px-2 py-2 text-sm text-red-600 hover:bg-gray-100'
                >
                  <Trash2 className='mr-2 h-4 w-4 text-red-400' />
                  Remove Representative
                </button>
              </div>
            </div>
          </>,
          document.body
        )}
    </div>
  );
}

export function ClientRepresentatives({ clientId }: ClientRepresentativesProps) {
  const [reps, setReps] = useState<BeneficialOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRep, setSelectedRep] = useState<BeneficialOwner | null>(null);

  // Guard against duplicate fetch calls (React StrictMode)
  const hasFetched = useRef(false);

  const fetchReps = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminClientApi.getOwners(clientId);
      if (response.success) {
        setReps(response.owners || []);
      }
    } catch (error) {
      console.error('Error fetching representatives:', error);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchReps();
    }
  }, [fetchReps]);

  const filteredReps = reps.filter(rep => {
    const fullName = `${rep.first_name} ${rep.last_name}`.toLowerCase();
    const email = (rep.email || '').toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
  });

  const getStatusBadge = (status: string) => {
    const isActive = status?.toLowerCase() === 'active' || status?.toLowerCase() === 'verified';
    const isPending = status?.toLowerCase() === 'pending' || !status;

    return (
      <div className='flex items-center gap-2'>
        <div className={`h-2 w-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-orange-500'}`} />
        <span className={`text-sm font-medium ${isActive ? 'text-green-600' : 'text-orange-600'}`}>
          {isActive ? 'Active' : 'Pending'}
        </span>
      </div>
    );
  };

  const columns: TableColumn<BeneficialOwner>[] = [
    {
      key: 'name',
      header: 'Rep. Name',
      render: rep => (
        <span className='text-sm font-medium text-gray-900'>
          {rep.first_name} {rep.last_name}
        </span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: rep => <span className='text-sm text-gray-600'>{rep.email}</span>,
    },
    {
      key: 'phone',
      header: 'Phone Number',
      render: rep => <span className='text-sm text-gray-600'>{rep.phone || 'N/A'}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      render: rep => (
        <span className='text-sm text-gray-600 uppercase'>{rep.role || 'Representative'}</span>
      ),
    },
    {
      key: 'ownership',
      header: 'Ownership Percentage',
      render: rep => (
        <span className='text-sm font-medium text-gray-900'>{rep.ownership_percentage}%</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: rep => getStatusBadge(rep.verification_status),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: rep => (
        <RepActionMenu
          rep={rep}
          onView={r => {
            setSelectedRep(r);
            setIsViewModalOpen(true);
          }}
          onEdit={() => console.log('Edit', rep)}
          onRemove={() => console.log('Remove', rep)}
        />
      ),
    },
  ];

  return (
    <div className='space-y-6 rounded-xl border border-gray-200 bg-white p-6'>
      {/* Header Info */}
      <h2 className='text-lg font-semibold text-gray-900'>Representatives ({reps.length})</h2>

      {/* Controls */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='relative w-full sm:w-80'>
          <Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400' />
          <Input
            placeholder='Search representative'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className='h-10 border-gray-200 pl-10 focus:ring-1 focus:ring-blue-500'
          />
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className='bg-gradient-blue h-10 cursor-pointer rounded-lg px-6 text-white transition-colors hover:bg-blue-700'
        >
          <Plus className='mr-2 h-4 w-4' />
          Add Representative
        </Button>
      </div>

      {/* Table Section */}
      <div className='overflow-hidden bg-white'>
        {loading ? (
          <div className='flex h-64 items-center justify-center'>
            <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600'></div>
          </div>
        ) : filteredReps.length > 0 ? (
          <DataTable data={filteredReps} columns={columns} getRowId={rep => rep.id} />
        ) : (
          <div className='flex h-64 flex-col items-center justify-center p-6 text-center'>
            <div className='mb-4 rounded-full bg-gray-50 p-4'>
              <Search className='h-8 w-8 text-gray-300' />
            </div>
            <h3 className='text-base font-semibold text-gray-900'>No representatives found</h3>
            <p className='mt-1 max-w-sm text-sm text-gray-500'>
              {searchTerm
                ? `No results match your search "${searchTerm}". Try a different term.`
                : "This client doesn't have any representatives assigned yet."}
            </p>
          </div>
        )}
      </div>

      {/* Add Representative Modal */}
      <AddRepresentativeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        clientId={clientId}
        onSuccess={() => {
          fetchReps(); // Refresh the list after adding a representative
        }}
      />

      {/* View Representative Modal */}
      <ViewRepresentativeModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        representative={selectedRep}
        onEdit={rep => {
          setIsViewModalOpen(false);
          // Handle edit logic here (e.g., open edit modal)
          console.log('Edit from View Modal', rep);
        }}
        onRemove={rep => {
          setIsViewModalOpen(false);
          // Handle remove logic here
          console.log('Remove from View Modal', rep);
        }}
      />
    </div>
  );
}
