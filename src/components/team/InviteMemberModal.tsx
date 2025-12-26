import { Modal } from '@/components/ui/Modal';
import { Mail } from 'lucide-react';
import { useState } from 'react';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { email: string; role: string }) => void;
}

export function InviteMemberModal({ isOpen, onClose, onSubmit }: InviteMemberModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Admin');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ email, role });
    setEmail('');
    setRole('Admin');
  };

  const roles = [
    { value: 'Admin', label: 'Admin' },
    { value: 'Approver', label: 'Approver' },
    { value: 'Initiator', label: 'Initiator' },
    { value: 'Viewer', label: 'Viewer' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Invite Team Member' size='md'>
      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Subtitle */}
        <p className='text-sm text-gray-500'>
          Send an invitation to join your team. Select the specific permissions they should have.
        </p>

        {/* Email Input */}
        <div>
          <label className='mb-2 block text-sm text-gray-700'>Email Address</label>
          <div className='relative'>
            <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
              <Mail className='h-4 w-4 text-gray-400' />
            </div>
            <input
              type='email'
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder='Enter email address'
              required
              className='w-full cursor-text rounded-lg border border-gray-200 py-2.5 pr-4 pl-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none'
            />
          </div>
        </div>

        {/* Role Selection - Radio Buttons */}
        <div>
          <label className='mb-3 block text-sm text-gray-700'>Permissions</label>
          <div className='grid grid-cols-4 gap-3'>
            {roles.map(roleOption => {
              const isSelected = role === roleOption.value;
              return (
                <label
                  key={roleOption.value}
                  className='flex cursor-pointer items-center justify-center'
                >
                  <input
                    type='radio'
                    name='role'
                    value={roleOption.value}
                    checked={isSelected}
                    onChange={e => setRole(e.target.value)}
                    className='sr-only'
                  />
                  <div
                    className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 transition-all hover:border-gray-300 ${
                      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                        isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300 bg-white'
                      }`}
                    >
                      {isSelected && <div className='h-2 w-2 rounded-full bg-white' />}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        isSelected ? 'text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      {roleOption.label}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className='grid grid-cols-2 gap-3 border-t border-gray-200 pt-6'>
          <button
            type='button'
            onClick={onClose}
            className='cursor-pointer rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50'
          >
            Cancel
          </button>
          <button
            type='submit'
            className='bg-gradient-blue cursor-pointer rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90'
          >
            Send Invite
          </button>
        </div>
      </form>
    </Modal>
  );
}
