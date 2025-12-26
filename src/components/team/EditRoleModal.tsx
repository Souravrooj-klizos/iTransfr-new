import { Modal } from '@/components/ui/Modal';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Role {
  id: string;
  name: string;
  description: string;
  permissionCount: number;
  userCount: number;
  color: string;
}

interface EditRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role | null;
  onSubmit: (data: { name: string; description: string; permissions: string[] }) => void;
}

interface PermissionGroup {
  name: string;
  permissions: string[];
  defaultExpanded?: boolean;
}

export function EditRoleModal({ isOpen, onClose, role, onSubmit }: EditRoleModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [expandedGroup, setExpandedGroup] = useState<string>(''); // All groups start collapsed

  useEffect(() => {
    if (role) {
      setName(role.name);
      setDescription(role.description);
    } else {
      setName('');
      setDescription('');
      setSelectedPermissions(new Set());
    }
  }, [role]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      description,
      permissions: Array.from(selectedPermissions),
    });
    setName('');
    setDescription('');
    setSelectedPermissions(new Set());
  };

  const togglePermission = (permission: string) => {
    const newPermissions = new Set(selectedPermissions);
    if (newPermissions.has(permission)) {
      newPermissions.delete(permission);
    } else {
      newPermissions.add(permission);
    }
    setSelectedPermissions(newPermissions);
  };

  const toggleGroup = (groupName: string) => {
    // If clicking the currently open group, close it. Otherwise, open the new group.
    setExpandedGroup(expandedGroup === groupName ? '' : groupName);
  };

  const toggleGroupPermissions = (groupPermissions: string[]) => {
    const newPermissions = new Set(selectedPermissions);
    const allSelected = groupPermissions.every(p => selectedPermissions.has(p));

    if (allSelected) {
      // Deselect all permissions in this group
      groupPermissions.forEach(p => newPermissions.delete(p));
    } else {
      // Select all permissions in this group
      groupPermissions.forEach(p => newPermissions.add(p));
    }

    setSelectedPermissions(newPermissions);
  };

  const permissionGroups: PermissionGroup[] = [
    {
      name: 'Admin',
      permissions: [
        'Manage Team',
        'Initiate Transactions',
        'Approve Transactions',
        'View Balances',
        'View History',
        'Add Recipients',
        'Manage Organization',
        'Export Data',
      ],
      defaultExpanded: true,
    },
    {
      name: 'Approver',
      permissions: ['Approve Transaction', 'View Balancs', 'Views History', 'Exports Data'],
    },
    {
      name: 'Initiator',
      permissions: ['Initiate Transactiions', 'View Balanrces', 'View Histtory', 'Add Reciipients'],
    },
  ];

  const getGroupPermissionCount = (groupPermissions: string[]) => {
    return groupPermissions.filter(p => selectedPermissions.has(p)).length;
  };

  const isGroupFullySelected = (groupPermissions: string[]) => {
    return groupPermissions.length > 0 && groupPermissions.every(p => selectedPermissions.has(p));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Create New Role' size='lg'>
      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Two Column Header - Role Name and Selected Permissions */}
        <div className='grid grid-cols-[1.4fr_1fr] gap-x-8'>
          {/* Left Column - Role Name */}
          <div>
            <label className='mb-2 block text-sm text-gray-500'>Role Name</label>
            <div className='flex items-center gap-2 rounded-lg border border-gray-200 p-2'>
              <div className='h-4 w-4 flex-shrink-0 rounded-full border border-[#0D8303] bg-[#0EA800]' />
              <input
                type='text'
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder='Custom name'
                required
                className='flex-1 cursor-text border-none px-0 py-0 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:outline-none'
              />
            </div>
          </div>

          {/* Right Column - Selected Permissions */}
          <div>
            <label className='mb-2 block text-sm text-gray-500'>Selected Permissions</label>
            <div className='flex items-center gap-2 rounded-lg border border-gray-200 p-2'>
              <input
                type='text'
                value={`${selectedPermissions.size} of ${permissionGroups.reduce((acc, g) => acc + g.permissions.length, 0)}`}
                readOnly
                className='flex-1 cursor-text border-none px-0 py-0 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:outline-none'
              />
            </div>
          </div>
        </div>

        {/* Description - Full Width */}
        <div>
          <label className='mb-2 block text-sm text-gray-500'>Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder='Describe what this role can do...'
            required
            rows={3}
            className='w-full cursor-text resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none'
          />
        </div>

        {/* Permissions Section */}
        <div>
          <label className='mb-3 block text-sm text-gray-500'>Permissions</label>
          <div className='space-y-2'>
            {permissionGroups.map(group => {
              const isExpanded = expandedGroup === group.name;
              const selectedCount = getGroupPermissionCount(group.permissions);
              const totalCount = group.permissions.length;

              return (
                <div key={group.name} className='overflow-hidden rounded-lg border border-gray-200'>
                  {/* Group Header */}
                  <button
                    type='button'
                    onClick={() => toggleGroup(group.name)}
                    className='flex w-full cursor-pointer items-center justify-between bg-white px-4 py-3 transition-colors hover:bg-gray-50'
                  >
                    <div className='flex items-center gap-2'>
                      {isExpanded ? (
                        <ChevronUp className='h-4 w-4 text-gray-500' />
                      ) : (
                        <ChevronDown className='h-4 w-4 text-gray-500' />
                      )}
                      <span className='font-medium text-gray-900'>{group.name}</span>
                    </div>
                    <span className='flex items-center gap-2'>
                      <span className='text-sm text-gray-500'>
                        {' '}
                        {selectedCount}/{totalCount}
                      </span>
                      <input
                        type='checkbox'
                        checked={isGroupFullySelected(group.permissions)}
                        onChange={e => {
                          e.stopPropagation();
                          toggleGroupPermissions(group.permissions);
                        }}
                        onClick={e => e.stopPropagation()}
                        className='h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                      />
                    </span>
                  </button>

                  {/* Group Permissions */}
                  {isExpanded && (
                    <div className='border-gray-200 px-4 py-3'>
                      <div className='space-y-2.5'>
                        {group.permissions.map(permission => (
                          <div key={permission} className='flex items-start gap-2.5'>
                            <input
                              type='checkbox'
                              id={`${group.name}-${permission}`}
                              checked={selectedPermissions.has(permission)}
                              onChange={() => togglePermission(permission)}
                              className='mt-0.5 h-3.5 w-3.5 flex-shrink-0 cursor-pointer rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500'
                            />
                            <label
                              htmlFor={`${group.name}-${permission}`}
                              className='cursor-pointer text-sm leading-tight text-gray-700'
                            >
                              {permission}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Save Button */}
        <div className='border-t border-gray-200 pt-6'>
          <button
            type='submit'
            className='bg-gradient-blue flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3 font-medium text-white transition-opacity hover:opacity-90'
          >
            Save Role
          </button>
        </div>
      </form>
    </Modal>
  );
}
