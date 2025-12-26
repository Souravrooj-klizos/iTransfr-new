'use client';

import { AllMembersIcon } from '@/components/icons/AllMembersIcon';
import { CrossIcon } from '@/components/icons/CrossIcon';
import DeleteIcon from '@/components/icons/DeleteIcon';
import PenEdit from '@/components/icons/PenEdit';
import SendIcon from '@/components/icons/SendIcon';
import { EditRoleModal } from '@/components/team/EditRoleModal';
import { InviteMemberModal } from '@/components/team/InviteMemberModal';
import { ViewMemberModal } from '@/components/team/ViewMemberModal';
import { DataTable, type TableColumn } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { Tabs } from '@/components/ui/Tabs';
import {
  Bell,
  ClockIcon,
  Copy,
  Download,
  Edit,
  Eye,
  MoreVertical,
  Plus,
  Search,
  Send,
  ShieldIcon,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';

// Data Models
interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Approver' | 'Initiator' | 'Viewer';
  lastActive: string;
  permissions?: string[];
}

interface PendingInvitation {
  id: string;
  email: string;
  invitedBy: string;
  role: 'Admin' | 'Approver' | 'Initiator' | 'Viewer';
  status: 'Pending' | 'Expired';
  sentOn: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissionCount: number;
  userCount: number;
  color: string;
}

// Mock Data
const mockMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Alex Chan',
    email: 'aichan@acme.com',
    role: 'Admin',
    lastActive: 'Dec 28, 2025 14:32 UTC',
  },
  {
    id: '2',
    name: 'James Wilson',
    email: 'jwilson@acme.com',
    role: 'Approver',
    lastActive: 'Dec 28, 2025 14:32 UTC',
  },
  {
    id: '3',
    name: 'John Smith',
    email: 'jsmith@acme.com',
    role: 'Initiator',
    lastActive: 'Dec 28, 2025 14:32 UTC',
  },
  {
    id: '4',
    name: 'Lisa Rodriguez',
    email: 'lisa.rodriguez@acme.com',
    role: 'Approver',
    lastActive: 'Dec 28, 2025 14:32 UTC',
  },
  {
    id: '5',
    name: 'Marie Dubois',
    email: 'marie@acme.com',
    role: 'Viewer',
    lastActive: 'Dec 28, 2025 14:32 UTC',
  },
  {
    id: '6',
    name: 'Sarah Johnson',
    email: 'sarah329@acme.com',
    role: 'Viewer',
    lastActive: 'Dec 28, 2025 14:32 UTC',
  },
];

const mockInvitations: PendingInvitation[] = [
  {
    id: '1',
    email: 's.dutoit@acme.com',
    invitedBy: 'Alex Chan',
    role: 'Approver',
    status: 'Pending',
    sentOn: 'Dec 28, 2025 14:32 UTC',
  },
  {
    id: '2',
    email: 'j.senoey@acme.com',
    invitedBy: 'Jennifer Wilson',
    role: 'Approver',
    status: 'Pending',
    sentOn: 'Dec 28, 2025 14:32 UTC',
  },
  {
    id: '3',
    email: 'willsmith25@acme.com',
    invitedBy: 'John Smith',
    role: 'Initiator',
    status: 'Expired',
    sentOn: 'Dec 28, 2025 14:32 UTC',
  },
  {
    id: '4',
    email: 'm.jackson@acme.com',
    invitedBy: 'Lisa Rodriguez',
    role: 'Viewer',
    status: 'Pending',
    sentOn: 'Dec 28, 2025 14:32 UTC',
  },
];

const mockRoles: Role[] = [
  {
    id: '1',
    name: 'Admin',
    description: 'Full access to all system features and settings',
    permissionCount: 8,
    userCount: 1,
    color: '#666ad8',
  },
  {
    id: '2',
    name: 'Approver',
    description: 'Can Approve Payments + View Everything',
    permissionCount: 6,
    userCount: 2,
    color: '#2462eb',
  },
  {
    id: '3',
    name: 'Initiator',
    description: 'Can Create Transactions',
    permissionCount: 5,
    userCount: 1,
    color: '#0d8303',
  },
  {
    id: '4',
    name: 'Viewer',
    description: 'Read-Only Access',
    permissionCount: 3,
    userCount: 2,
    color: '#6b6b6b',
  },
];

export default function TeamManagementPage() {
  const [activeTab, setActiveTab] = useState('all-members');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [selectedInvitations, setSelectedInvitations] = useState<Set<string>>(new Set());
  const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isViewMemberModalOpen, setIsViewMemberModalOpen] = useState(false);
  const [isInviteMemberModalOpen, setIsInviteMemberModalOpen] = useState(false);
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);

  // Filter states
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activePage, setActivePage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState('10');

  const tabs = [
    { id: 'all-members', label: 'All Members', icon: <AllMembersIcon className='h-4 w-4' /> },
    {
      id: 'pending-invitations',
      label: 'Pending Invitations',
      icon: <ClockIcon className='h-4 w-4' />,
    },
    {
      id: 'roles-permissions',
      label: 'Roles & Permissions',
      icon: <ShieldIcon className='h-4 w-4' />,
    },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside dropdown menu
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

  // Reset state when tab changes
  useEffect(() => {
    setShowActionsMenu(null);
    setSelectedMembers(new Set());
    setSelectedInvitations(new Set());
    setActivePage(1);
  }, [activeTab]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-100 text-purple-600';
      case 'Approver':
        return 'bg-blue-100 text-blue-600';
      case 'Initiator':
        return 'bg-green-100 text-green-600';
      case 'Viewer':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'text-orange-500';
      case 'Expired':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // All Members Columns
  const memberColumns: TableColumn<TeamMember>[] = [
    {
      key: 'name',
      header: 'Name',
      render: row => <div className='text-sm font-medium text-gray-900'>{row.name}</div>,
    },
    {
      key: 'email',
      header: 'Email',
      render: row => <div className='text-sm text-gray-700'>{row.email}</div>,
    },
    {
      key: 'role',
      header: 'Role',
      render: row => (
        <span
          className={`inline-block rounded-lg px-3 py-1.5 text-xs font-medium ${getRoleColor(row.role)}`}
        >
          {row.role}
        </span>
      ),
    },
    {
      key: 'lastActive',
      header: 'Last Active',
      render: row => (
        <div>
          <div className='text-sm font-medium text-gray-700'>
            {row.lastActive.split(' ').slice(0, 3).join(' ')}
          </div>
          <div className='text-xs text-gray-500'>{row.lastActive.split(' ')[3]}</div>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row, index) => (
        <div className='relative'>
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
                  setSelectedMember(row);
                  setIsViewMemberModalOpen(true);
                  setShowActionsMenu(null);
                }}
                className='flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100'
              >
                <Eye className='h-4 w-4' />
                View Member
              </button>
              <button className='flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100'>
                <PenEdit />
                Edit Permissions
              </button>
              <button className='flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50'>
                <DeleteIcon />
                Remove
              </button>
            </div>
          )}
        </div>
      ),
    },
  ];

  // Pending Invitations Columns
  const invitationColumns: TableColumn<PendingInvitation>[] = [
    {
      key: 'email',
      header: 'Email',
      render: row => <div className='text-sm text-gray-900'>{row.email}</div>,
    },
    {
      key: 'invitedBy',
      header: 'Invited By',
      render: row => <div className='text-sm text-gray-700'>{row.invitedBy}</div>,
    },
    {
      key: 'role',
      header: 'Role',
      render: row => (
        <span
          className={`inline-block rounded-lg px-3 py-1.5 text-xs font-medium ${getRoleColor(row.role)}`}
        >
          {row.role}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: row => (
        <span className={`text-sm font-medium ${getStatusColor(row.status)}`}>{row.status}</span>
      ),
    },
    {
      key: 'sentOn',
      header: 'Sent On',
      render: row => (
        <div>
          <div className='text-sm font-medium text-gray-700'>
            {row.sentOn.split(' ').slice(0, 3).join(' ')}
          </div>
          <div className='text-xs text-gray-500'>{row.sentOn.split(' ')[3]}</div>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row, index) => (
        <div className='relative'>
          <button
            onClick={() => setShowActionsMenu(showActionsMenu === row.id ? null : row.id)}
            className='cursor-pointer rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600'
          >
            <MoreVertical className='h-5 w-5' />
          </button>
          {showActionsMenu === row.id && (
            <div
              className={`absolute ${index !== undefined && index < 3 ? 'top-8' : 'bottom-8'} right-0 z-10 w-56 rounded-lg border border-gray-200 bg-white p-2 shadow-lg`}
            >
              <button className='flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100'>
                <PenEdit />
                Edit Invite
              </button>
              <button className='flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100'>
                <Copy className='h-4 w-4' />
                Copy Invitation Link
              </button>
              <button className='flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100'>
                <SendIcon className='h-4 w-4' />
                Resend
              </button>
              <button className='flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100'>
                <Bell className='h-4 w-4' />
                Remind
              </button>
              <button className='flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50'>
                <DeleteIcon />
                Delete Invite
              </button>
            </div>
          )}
        </div>
      ),
    },
  ];

  // Roles & Permissions Columns
  const roleColumns: TableColumn<Role>[] = [
    {
      key: 'name',
      header: 'Role Name',
      render: row => (
        <div className='flex items-center gap-3'>
          <div className='h-3 w-3 rounded-full' style={{ backgroundColor: row.color }} />
          <span className='text-sm font-medium text-gray-900'>{row.name}</span>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: row => <div className='text-sm text-gray-700'>{row.description}</div>,
    },
    {
      key: 'permissions',
      header: 'Permissions',
      render: row => <div className='text-sm text-gray-700'>{row.permissionCount} Permissions</div>,
    },
    {
      key: 'users',
      header: 'Users',
      render: row => (
        <div className='text-sm text-gray-700'>
          {row.userCount} User{row.userCount !== 1 ? 's' : ''}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row, index) => (
        <div className='relative'>
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
                  setSelectedRole(row);
                  setIsEditRoleModalOpen(true);
                  setShowActionsMenu(null);
                }}
                className='flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100'
              >
                <PenEdit />
                Edit Role
              </button>
              <button className='flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100'>
                <Copy className='h-4 w-4' />
                Duplicate Role
              </button>
              <button className='flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100'>
                <Users className='h-4 w-4' />
                Assign Members
              </button>
            </div>
          )}
        </div>
      ),
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'all-members':
        return (
          <div className='space-y-4'>
            {/* Search and Filters */}
            <div className='flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center'>
              <div className='flex w-full flex-wrap items-center gap-3'>
                <div className='relative flex-1 sm:flex-initial'>
                  <Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-500' />
                  <input
                    type='text'
                    placeholder='Search members'
                    className='w-full cursor-text rounded-lg border border-gray-200 py-2 pr-4 pl-10 text-sm text-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none sm:w-64'
                  />
                </div>
                <Select
                  options={[
                    { value: 'all', label: 'All Roles' },
                    { value: 'admin', label: 'Admin' },
                    { value: 'approver', label: 'Approver' },
                    { value: 'initiator', label: 'Initiator' },
                    { value: 'viewer', label: 'Viewer' },
                  ]}
                  value={roleFilter}
                  onChange={setRoleFilter}
                  className='w-40'
                />
                <div className='flex items-center rounded-full border border-gray-200 bg-gray-50 p-1'>
                  <button className='cursor-pointer rounded-full bg-white px-4 py-1.5 text-sm font-medium text-gray-900 shadow-sm transition-all'>
                    Active
                  </button>
                  <button className='cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium text-gray-500 transition-all hover:text-gray-700'>
                    Inactive
                  </button>
                </div>
              </div>
            </div>

            {/* Data Table */}
            <DataTable
              data={mockMembers}
              columns={memberColumns}
              getRowId={row => row.id}
              showCheckbox={true}
              selectedIds={selectedMembers}
              onSelectionChange={setSelectedMembers}
            />

            {/* Bulk Actions Bar */}
            {selectedMembers.size > 0 && (
              <div className='bg-gradient-dark fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-xl px-4 py-3 text-white shadow-xl md:left-[calc(50%+8rem)]'>
                <span className='text-sm font-light'>
                  {selectedMembers.size} member(s) selected
                </span>

                <div className='flex items-center gap-3 border-l border-gray-600 pl-4'>
                  <button className='flex cursor-pointer items-center gap-2 rounded-lg bg-[#E63D3D] px-3 py-1.5 text-xs font-light text-white transition-colors hover:bg-white/20'>
                    <DeleteIcon />
                    Remove
                  </button>
                  <button className='bg-gradient-blue flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-light text-white transition-colors hover:bg-blue-700'>
                    <Download className='h-3.5 w-3.5' />
                    Export PDF
                  </button>
                  <button
                    onClick={() => setSelectedMembers(new Set())}
                    className='ml-1 cursor-pointer text-xs font-light text-gray-400 hover:text-white'
                  >
                    Deselect
                  </button>
                </div>
              </div>
            )}

            {/* Pagination */}
            <Pagination
              currentPage={activePage}
              totalPages={10}
              onPageChange={setActivePage}
              itemsPerPage={rowsPerPage}
              onItemsPerPageChange={setRowsPerPage}
            />
          </div>
        );

      case 'pending-invitations':
        return (
          <div className='space-y-4'>
            {/* Search and Filters */}
            <div className='flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center'>
              <div className='flex w-full flex-wrap items-center gap-3'>
                <div className='relative flex-1 sm:flex-initial'>
                  <Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-500' />
                  <input
                    type='text'
                    placeholder='Search invitations'
                    className='w-full cursor-text rounded-lg border border-gray-200 py-2 pr-4 pl-10 text-sm text-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none sm:w-64'
                  />
                </div>
                <Select
                  options={[
                    { value: 'all', label: 'All Roles' },
                    { value: 'admin', label: 'Admin' },
                    { value: 'approver', label: 'Approver' },
                    { value: 'initiator', label: 'Initiator' },
                    { value: 'viewer', label: 'Viewer' },
                  ]}
                  value={roleFilter}
                  onChange={setRoleFilter}
                  className='w-40'
                />
                <Select
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'expired', label: 'Expired' },
                  ]}
                  value={statusFilter}
                  onChange={setStatusFilter}
                  className='w-40'
                />
              </div>
            </div>

            {/* Data Table */}
            <DataTable
              data={mockInvitations}
              columns={invitationColumns}
              getRowId={row => row.id}
              showCheckbox={true}
              selectedIds={selectedInvitations}
              onSelectionChange={setSelectedInvitations}
            />

            {/* Bulk Actions Bar */}
            {selectedInvitations.size > 0 && (
              <div className='bg-gradient-dark fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-xl px-4 py-3 text-white shadow-xl md:left-[calc(50%+8rem)]'>
                <span className='text-sm font-light'>
                  {selectedInvitations.size} invitation(s) selected
                </span>

                <div className='flex items-center gap-3 border-l border-gray-600 pl-4'>
                  <button className='flex cursor-pointer items-center gap-2 rounded-lg bg-[#E63D3D] px-3 py-1.5 text-xs font-light text-white transition-colors hover:bg-white/20'>
                    <CrossIcon />
                    Cancel Invite
                  </button>
                  <button
                    onClick={() => setSelectedInvitations(new Set())}
                    className='text-decoration-underline ml-1 cursor-pointer text-xs font-light text-gray-400 hover:text-white'
                  >
                    Deselect
                  </button>
                </div>
              </div>
            )}

            {/* Pagination */}
            {/* Pagination */}
            <Pagination
              currentPage={activePage}
              totalPages={10}
              onPageChange={setActivePage}
              itemsPerPage={rowsPerPage}
              onItemsPerPageChange={setRowsPerPage}
            />
          </div>
        );

      case 'roles-permissions':
        return (
          <div className='space-y-4'>
            {/* Search */}
            <div className='flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center'>
              <div className='relative flex-1 sm:flex-initial'>
                <Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-500' />
                <input
                  type='text'
                  placeholder='Search roles'
                  className='w-full cursor-text rounded-lg border border-gray-200 py-2 pr-4 pl-10 text-sm text-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none sm:w-64'
                />
              </div>
            </div>

            {/* Data Table */}
            <DataTable
              data={mockRoles}
              columns={roleColumns}
              getRowId={row => row.id}
              showCheckbox={false}
            />

            {/* Pagination */}
            {/* Pagination */}
            <Pagination
              currentPage={activePage}
              totalPages={10}
              onPageChange={setActivePage}
              itemsPerPage={rowsPerPage}
              onItemsPerPageChange={setRowsPerPage}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className='space-y-6'>
      {/* Tabs */}
      <div className='flex items-center justify-between px-1'>
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} variant='pills' />
        <div className='flex flex-col items-start justify-between gap-4 px-1 sm:flex-row sm:items-center'>
          <button
            onClick={() => {
              if (activeTab === 'roles-permissions') {
                setIsEditRoleModalOpen(true);
              } else {
                setIsInviteMemberModalOpen(true);
              }
            }}
            className='bg-gradient-blue flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90'
          >
            <Plus className='h-4 w-4' />
            {activeTab === 'roles-permissions' ? 'Create New Role' : 'Invite Member'}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className='rounded-xl border border-gray-200 bg-white p-6'>{renderTabContent()}</div>

      {/* Modals */}
      <ViewMemberModal
        isOpen={isViewMemberModalOpen}
        onClose={() => setIsViewMemberModalOpen(false)}
        member={selectedMember}
      />

      <InviteMemberModal
        isOpen={isInviteMemberModalOpen}
        onClose={() => setIsInviteMemberModalOpen(false)}
        onSubmit={(data: { email: string; role: string; customPermissions?: string[] }) => {
          console.log('Inviting member:', data);
          setIsInviteMemberModalOpen(false);
        }}
      />

      <EditRoleModal
        isOpen={isEditRoleModalOpen}
        onClose={() => setIsEditRoleModalOpen(false)}
        role={selectedRole}
        onSubmit={(data: { name: string; description: string; permissions: string[] }) => {
          console.log('Saving role:', data);
          setIsEditRoleModalOpen(false);
        }}
      />
    </div>
  );
}
