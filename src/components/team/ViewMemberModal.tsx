import PenEdit from '@/components/icons/PenEdit';
import { Modal } from '@/components/ui/Modal';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Approver' | 'Initiator' | 'Viewer';
  status?: 'Active' | 'Inactive';
  memberSince?: string;
  lastActive: string;
  invitedBy?: string;
  mobileNumber?: string;
  address?: string;
  twoFactorEnabled?: boolean;
  permissions?: string[];
}

interface ViewMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: TeamMember | null;
  onEdit?: () => void;
}

export function ViewMemberModal({ isOpen, onClose, member, onEdit }: ViewMemberModalProps) {
  if (!member) return null;

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Member Details' size='lg'>
      <div className='space-y-6'>
        {/* Two Column Grid */}
        <div className='grid grid-cols-[1.4fr_1fr] gap-x-0 gap-y-6'>
          {/* Left Column */}
          <div className='space-y-6 border-r border-gray-200 pr-4'>
            {/* Full Name */}
            <div>
              <label className='mb-1 block text-sm text-gray-500'>Full Name</label>
              <div className='flex items-center gap-2'>
                <p className='text-base font-medium text-gray-900'>{member.name}</p>
                {member.status === 'Active' && (
                  <span className='flex items-center gap-1.5 text-sm text-green-600'>
                    <span className='h-2 w-2 rounded-full bg-green-600' />
                    Active
                  </span>
                )}
              </div>
            </div>

            {/* Role */}
            <div>
              <label className='mb-1 block text-sm text-gray-500'>Role</label>
              <span
                className={`inline-block rounded-md px-3 py-1 text-sm font-medium ${getRoleColor(member.role)}`}
              >
                {member.role}
              </span>
            </div>

            {/* Email */}
            <div>
              <label className='mb-1 block text-sm text-gray-500'>Email</label>
              <p className='text-base text-gray-900'>{member.email}</p>
            </div>

            {/* Mobile Number */}
            <div>
              <label className='mb-1 block text-sm text-gray-500'>Mobile Number</label>
              <p className='text-base text-gray-900'>
                {member.mobileNumber || '+1 (555) 123-4567'}
              </p>
            </div>

            {/* Address */}
            <div>
              <label className='mb-1 block text-sm text-gray-500'>Address</label>
              <p className='text-base text-gray-900'>
                {member.address || '123 Main Street, New York, NY 10001, United States'}
              </p>
            </div>
          </div>

          {/* Right Column */}
          <div className='space-y-6 pl-4'>
            {/* Member Since */}
            <div>
              <label className='mb-1 block text-sm text-gray-500'>Member Since</label>
              <p className='text-base text-gray-900'>{member.memberSince || 'Jan 15, 2024'}</p>
            </div>

            {/* Last Active */}
            <div>
              <label className='mb-1 block text-sm text-gray-500'>Last Active</label>
              <p className='text-base text-gray-900'>{member.lastActive}</p>
            </div>

            {/* Invited By */}
            <div>
              <label className='mb-1 block text-sm text-gray-500'>Invited By</label>
              <p className='text-base text-gray-900'>{member.invitedBy || 'John Smith'}</p>
            </div>

            {/* 2FA Status */}
            <div>
              <label className='mb-1 block text-sm text-gray-500'>2FA Status</label>
              <p className='text-base text-gray-900'>
                {member.twoFactorEnabled !== false ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>
        </div>

        {/* Edit Member Button */}
        <div className='border-t border-gray-200 pt-6'>
          <button
            onClick={onEdit || onClose}
            className='bg-gradient-blue flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3 font-medium text-white transition-opacity hover:opacity-90'
          >
            <PenEdit />
            Edit Member
          </button>
        </div>
      </div>
    </Modal>
  );
}
