'use client';

import DesktopIcon from '@/components/icons/DesktopIcon';
import LocationIcon from '@/components/icons/LocationIcon';
import LockIcon from '@/components/icons/LockIcon';
import MobileIcon from '@/components/icons/MobileIcon';
import NotificationIcon from '@/components/icons/NotificationIcon';
import PenEdit from '@/components/icons/PenEdit';
import PersonSqIcon from '@/components/icons/PersonSqIcon';
import SheildIcon from '@/components/icons/SheildIcon';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { UserProfile } from '@/lib/api/types';

interface LoginSession {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  deviceIcon: React.ReactNode;
  isCurrent: boolean;
}

interface UserRole {
  role: string;
  memberSince: string;
  invitedBy: string;
  organizationName: string;
  permissions: string[];
}

interface NotificationPreferences {
  transactionAlerts: {
    incomingDeposits: boolean;
    outgoingTransfers: boolean;
    failedTransactions: boolean;
    pendingApprovals: boolean;
    highValueWithdrawals: boolean;
  };
  emailPreferences: {
    dailyBalanceSummary: boolean;
    weeklyActivityDigest: boolean;
    teamActivityUpdates: boolean;
  };
}

// Mock Data (Fallback)
const mockProfile: UserProfile = {
  id: 'mock-id',
  fullName: 'Alex Chan',
  email: 'alex.c@libertytrade.com',
  mobileNumber: '+1(555) 123-4567',
  address: '123 Main Street, New York, NY 10001, USA',
  timezone: 'UTC-05:00 (New York)',
  language: 'English (US)',
  status: 'active',
  kycStatus: 'approved',
  createdAt: new Date().toISOString(),
};

const mockSessions: LoginSession[] = [
  {
    id: '1',
    device: 'Chrome on Mac',
    location: 'New York, USA',
    lastActive: 'Current Session',
    deviceIcon: <DesktopIcon />,
    isCurrent: true,
  },
  {
    id: '2',
    device: 'iPhone 13',
    location: 'Brooklyn, USA',
    lastActive: '5 days ago',
    deviceIcon: <MobileIcon />,
    isCurrent: false,
  },
];

const mockRole: UserRole = {
  role: 'Approver',
  memberSince: 'Jan 15, 2024',
  invitedBy: 'John Doe',
  organizationName: 'Liberty Trading Inc.',
  permissions: ['Initiate', 'Approve', 'View Balances', 'View History'],
};

import clientApi from '@/lib/api/client';
import { useEffect } from 'react';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    transactionAlerts: {
      incomingDeposits: true,
      outgoingTransfers: true,
      failedTransactions: true,
      pendingApprovals: false,
      highValueWithdrawals: true,
    },
    emailPreferences: {
      dailyBalanceSummary: true,
      weeklyActivityDigest: false,
      teamActivityUpdates: true,
    },
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await clientApi.profile.get();
      if (data) {
        setProfile({
          id: data.id || '',
          fullName: data.fullName || 'User',
          email: data.email || '',
          mobileNumber: data.mobileNumber || data.phone || '',
          address: data.address || '',
          timezone: data.timezone || 'UTC',
          language: data.language || 'English',
          status: data.status || 'active',
          kycStatus: data.kycStatus || 'pending',
          createdAt: data.createdAt || new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleNotification = (
    category: 'transactionAlerts' | 'emailPreferences',
    key: string
  ) => {
    setNotifications(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: !prev[category][key as keyof (typeof prev)[typeof category]],
      },
    }));
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-50 text-purple-600 border border-purple-200';
      case 'Approver':
        return 'bg-blue-50 text-blue-600 border border-blue-200';
      case 'Initiator':
        return 'bg-green-50 text-green-600 border border-green-200';
      case 'Viewer':
        return 'bg-gray-50 text-gray-600 border border-gray-200';
      default:
        return 'bg-gray-50 text-gray-600 border border-gray-200';
    }
  };

  if (loading) return <div className='p-12 text-center text-gray-500'>Loading profile...</div>;

  // Fallback if no profile enabled yet
  const displayProfile = profile || mockProfile;

  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='flex items-center px-1'>
        <button
          onClick={() => router.back()}
          className='flex cursor-pointer items-center gap-2 text-sm text-gray-600 transition-colors hover:text-gray-900'
        >
          <ArrowLeft className='h-4 w-4' />
          Go Back
        </button>
      </div>

      {/* Personal Information Section */}
      <div className='rounded-xl border border-gray-200 bg-white p-6'>
        <div className='mb-6'>
          <h2 className='flex items-center gap-2 text-base font-medium text-gray-600'>
            <PersonSqIcon />
            Personal Information
          </h2>
        </div>

        <div className='space-y-4'>
          {/* Full Name and Email */}
          <div className='grid grid-cols-2 lg:grid-cols-3'>
            <div>
              <label className='mb-1 block text-xs text-gray-500'>Full Name</label>
              <p className='text-base text-gray-900'>{displayProfile.fullName}</p>
            </div>
            <div>
              <label className='mb-1 block text-xs text-gray-500'>Email</label>
              <p className='text-sm text-gray-900'>{displayProfile.email}</p>
            </div>
          </div>

          {/* Mobile Number and Address */}
          <div className='grid grid-cols-2 lg:grid-cols-3'>
            <div>
              <label className='mb-1 block text-xs text-gray-500'>Mobile Number</label>
              <p className='text-sm text-gray-900'>{mockProfile.mobileNumber}</p>
            </div>
            <div>
              <label className='mb-1 block text-xs text-gray-500'>Address</label>
              <p className='text-sm text-gray-900'>{mockProfile.address}</p>
            </div>
          </div>

          {/* Timezone and Language */}
          <div className='grid grid-cols-2 lg:grid-cols-3'>
            <div>
              <label className='mb-1 block text-xs text-gray-500'>Timezone</label>
              <p className='text-sm text-gray-900'>{mockProfile.timezone}</p>
            </div>
            <div>
              <label className='mb-1 block text-xs text-gray-500'>Language</label>
              <p className='text-sm text-gray-900'>{mockProfile.language}</p>
            </div>
          </div>
        </div>

        {/* Edit Profile Button - Bottom Right */}
        <div className='mt-2 flex justify-end'>
          <button className='bg-gradient-blue flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90'>
            <PenEdit /> Edit Profile
          </button>
        </div>
      </div>

      {/* Security Section */}
      <div className='rounded-xl border border-gray-200 bg-white p-6'>
        <div className='mb-6'>
          <h2 className='flex items-center gap-2 text-base font-semibold text-gray-600'>
            <LockIcon />
            Security
          </h2>
        </div>

        <div className='space-y-4'>
          {/* Password */}
          <div className='flex flex-col items-end justify-between border-b border-gray-100 pb-4 lg:flex-row'>
            <div className='w-full max-w-md'>
              <label className='mb-1 block text-xs text-gray-500'>Password</label>
              <div className='flex items-center rounded-lg bg-gray-50 px-3 py-2.5 text-gray-600'>
                <LockIcon />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value='password123'
                  readOnly
                  className='ml-2 flex-1 bg-transparent text-sm text-gray-600 focus:outline-none'
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className='flex cursor-pointer items-center text-gray-400 hover:text-gray-600'
                >
                  {showPassword ? <Eye className='h-4 w-4' /> : <EyeOff className='h-4 w-4' />}
                </button>
              </div>
            </div>
            <button className='mt-2 flex cursor-pointer items-center rounded-lg border border-gray-200 bg-white px-4 py-3 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 lg:mt-0'>
              Change Password
            </button>
          </div>

          {/* Two-Factor Authentication */}
          <div className='flex items-center justify-between border-b border-gray-100 pb-4'>
            <div>
              <label className='mb-1 block text-xs text-gray-500'>Two-Factor Authentication</label>
              <span
                className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${
                  twoFactorEnabled ? 'bg-green-100 text-green-500' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <button className='cursor-pointer text-sm text-blue-600 transition-colors hover:text-blue-700'>
              Manage 2FA
            </button>
          </div>

          {/* Login Sessions */}
          <div>
            <label className='mb-3 block text-xs font-medium text-gray-700'>Login Sessions</label>
            <div className='overflow-x-auto rounded-lg border border-gray-200'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b border-gray-200 bg-gray-50'>
                    <th className='px-4 py-3 text-left text-xs font-medium text-gray-500'>
                      Device
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-medium text-gray-500'>
                      Location
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-medium text-gray-500'>
                      Last Active
                    </th>
                    <th className='px-4 py-3 text-right text-xs font-medium text-gray-500'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-200 bg-white'>
                  {mockSessions.map(session => (
                    <tr key={session.id} className='transition-colors hover:bg-gray-50'>
                      <td className='px-4 py-3 whitespace-nowrap'>
                        <div className='flex items-center gap-2'>
                          {session.deviceIcon}
                          <span className='text-sm text-gray-900'>{session.device}</span>
                        </div>
                      </td>
                      <td className='px-4 py-3 whitespace-nowrap'>
                        <div className='flex items-center gap-1'>
                          <LocationIcon />
                          <span className='text-sm text-gray-700'>{session.location}</span>
                        </div>
                      </td>
                      <td className='px-4 py-3 whitespace-nowrap'>
                        <span className='text-sm text-gray-700'>{session.lastActive}</span>
                      </td>
                      <td className='px-4 py-3 text-right whitespace-nowrap'>
                        <button className='cursor-pointer text-sm text-blue-600 transition-colors hover:text-blue-700'>
                          Logout
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className='mt-3 text-right'>
              <button className='cursor-pointer text-sm text-red-500 underline transition-colors hover:text-red-600'>
                Log Out of All Sessions
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Role & Permissions Section */}
      <div className='rounded-xl border border-gray-200 bg-white p-6'>
        <div className='mb-6'>
          <h2 className='flex items-center gap-2 text-base font-semibold text-gray-600'>
            <SheildIcon />
            Your Role & Permissions
          </h2>
        </div>

        <div className='space-y-4'>
          {/* Role and Permissions */}
          <div className='grid grid-cols-2 gap-6 lg:grid-cols-3'>
            <div>
              <label className='mb-2 block text-xs text-gray-500'>Role</label>
              <span
                className={`inline-block rounded-lg px-2 py-0.5 text-sm font-medium ${getRoleColor(mockRole.role)}`}
              >
                {mockRole.role}
              </span>
            </div>
            <div>
              <label className='mb-2 block text-xs text-gray-500'>Permissions</label>
              <div className='flex flex-wrap gap-1.5'>
                {mockRole.permissions.map(permission => (
                  <span
                    key={permission}
                    className='inline-block rounded-md border border-gray-200 bg-white px-2 py-0.5 text-xs font-medium text-gray-500'
                  >
                    {permission}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Member Since and Invited By */}
          <div className='grid grid-cols-2 gap-6 lg:grid-cols-3'>
            <div>
              <label className='mb-1 block text-xs text-gray-500'>Member Since</label>
              <p className='text-sm text-gray-900'>{mockRole.memberSince}</p>
            </div>
            <div>
              <label className='mb-1 block text-xs text-gray-500'>Invited By</label>
              <p className='text-sm text-gray-900'>{mockRole.invitedBy}</p>
            </div>
          </div>

          {/* Organization Name */}
          <div>
            <label className='mb-1 block text-xs text-gray-500'>Organization Name</label>
            <p className='text-sm text-gray-900'>{mockRole.organizationName}</p>
          </div>
        </div>

        <div className='mt-6 border-t border-gray-100 pt-4'>
          <button className='cursor-pointer text-sm text-red-500 transition-colors hover:text-red-600'>
            Leave Organization
          </button>
        </div>
      </div>

      {/* Notifications & Preferences Section */}
      <div className='rounded-xl border border-gray-200 bg-white p-6'>
        <div className='mb-6 flex items-center gap-2'>
          <NotificationIcon />
          <h2 className='text-base font-semibold text-gray-600'>Notifications & Preferences</h2>
        </div>

        {/* Transaction Alerts */}
        <div className='mb-6'>
          <h3 className='mb-4 text-sm font-medium text-gray-900'>Transaction Alerts</h3>
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-900'>Incoming crypto deposits</p>
                <p className='text-xs text-gray-500'>
                  Get notified when you receive cryptocurrency
                </p>
              </div>
              <label className='relative inline-flex cursor-pointer items-center'>
                <input
                  type='checkbox'
                  checked={notifications.transactionAlerts.incomingDeposits}
                  onChange={() => handleToggleNotification('transactionAlerts', 'incomingDeposits')}
                  className='peer sr-only'
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-blue-600 peer-focus:ring-2 peer-focus:ring-blue-300 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
              </label>
            </div>

            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-900'>Outgoing transfers</p>
                <p className='text-xs text-gray-500'>Alert when transfers are initiated</p>
              </div>
              <label className='relative inline-flex cursor-pointer items-center'>
                <input
                  type='checkbox'
                  checked={notifications.transactionAlerts.outgoingTransfers}
                  onChange={() =>
                    handleToggleNotification('transactionAlerts', 'outgoingTransfers')
                  }
                  className='peer sr-only'
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-blue-600 peer-focus:ring-2 peer-focus:ring-blue-300 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
              </label>
            </div>

            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-900'>Failed transactions</p>
                <p className='text-xs text-gray-500'>Notification for unsuccessful transactions</p>
              </div>
              <label className='relative inline-flex cursor-pointer items-center'>
                <input
                  type='checkbox'
                  checked={notifications.transactionAlerts.failedTransactions}
                  onChange={() =>
                    handleToggleNotification('transactionAlerts', 'failedTransactions')
                  }
                  className='peer sr-only'
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-blue-600 peer-focus:ring-2 peer-focus:ring-blue-300 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
              </label>
            </div>

            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-900'>Pending approvals</p>
                <p className='text-xs text-gray-500'>Alert when transactions need your approval</p>
              </div>
              <label className='relative inline-flex cursor-pointer items-center'>
                <input
                  type='checkbox'
                  checked={notifications.transactionAlerts.pendingApprovals}
                  onChange={() => handleToggleNotification('transactionAlerts', 'pendingApprovals')}
                  className='peer sr-only'
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-blue-600 peer-focus:ring-2 peer-focus:ring-blue-300 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
              </label>
            </div>

            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-900'>High-value withdrawals</p>
                <p className='text-xs text-gray-500'>Notify for withdrawals above threshold</p>
              </div>
              <label className='relative inline-flex cursor-pointer items-center'>
                <input
                  type='checkbox'
                  checked={notifications.transactionAlerts.highValueWithdrawals}
                  onChange={() =>
                    handleToggleNotification('transactionAlerts', 'highValueWithdrawals')
                  }
                  className='peer sr-only'
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-blue-600 peer-focus:ring-2 peer-focus:ring-blue-300 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Email Preferences */}
        <div className='border-t border-gray-100 pt-6'>
          <h3 className='mb-4 text-sm font-medium text-gray-900'>Email Preferences</h3>
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-900'>Daily balance summary</p>
                <p className='text-xs text-gray-500'>Receive daily email of your account balance</p>
              </div>
              <label className='relative inline-flex cursor-pointer items-center'>
                <input
                  type='checkbox'
                  checked={notifications.emailPreferences.dailyBalanceSummary}
                  onChange={() =>
                    handleToggleNotification('emailPreferences', 'dailyBalanceSummary')
                  }
                  className='peer sr-only'
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-blue-600 peer-focus:ring-2 peer-focus:ring-blue-300 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
              </label>
            </div>

            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-900'>Weekly activity digest</p>
                <p className='text-xs text-gray-500'>Get a weekly summary of all activities</p>
              </div>
              <label className='relative inline-flex cursor-pointer items-center'>
                <input
                  type='checkbox'
                  checked={notifications.emailPreferences.weeklyActivityDigest}
                  onChange={() =>
                    handleToggleNotification('emailPreferences', 'weeklyActivityDigest')
                  }
                  className='peer sr-only'
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-blue-600 peer-focus:ring-2 peer-focus:ring-blue-300 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
              </label>
            </div>

            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-900'>Team activity updates</p>
                <p className='text-xs text-gray-500'>Updates when team members make changes</p>
              </div>
              <label className='relative inline-flex cursor-pointer items-center'>
                <input
                  type='checkbox'
                  checked={notifications.emailPreferences.teamActivityUpdates}
                  onChange={() =>
                    handleToggleNotification('emailPreferences', 'teamActivityUpdates')
                  }
                  className='peer sr-only'
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-blue-600 peer-focus:ring-2 peer-focus:ring-blue-300 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
