'use client';

import { useSidebar } from '@/providers/SidebarProvider';
import { Menu, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AdminUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

export function Header() {
  const { isCollapsed, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<AdminUser | null>(null);

  useEffect(() => {
    const storedAdmin = localStorage.getItem('admin_user');
    if (storedAdmin) {
      setAdmin(JSON.parse(storedAdmin));
    }
  }, []);

  const getPageTitle = (path: string) => {
    if (path === '/admin/dashboard') return 'Admin Dashboard';
    if (path === '/admin/clients') return 'Clients';
    if (path.startsWith('/admin/clients/')) return 'Client Details';
    if (path === '/admin/kyc-review') return 'KYC Review';
    if (path === '/admin/transactions') return 'Transactions';
    if (path === '/admin/payouts') return 'Payouts';
    return 'Dashboard';
  };

  const title = getPageTitle(pathname);

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-40 my-3 mr-5 ml-2 rounded-lg border border-gray-200 bg-white transition-all duration-300 ${isCollapsed ? 'md:left-25' : 'md:left-64'} `}
    >
      <div className='px-5 py-2'>
        <div className='flex items-center justify-between'>
          {/* Left: burger + title */}
          <div className='flex items-center gap-3'>
            <button
              className='cursor-pointer rounded-lg p-1 text-gray-600 hover:bg-gray-100'
              onClick={() => {
                if (window.innerWidth < 768) toggleMobileSidebar();
                else toggleSidebar();
              }}
            >
              <Menu className='h-6 w-6' />
            </button>

            <h1 className='text-xl font-semibold text-gray-900'>{title}</h1>
          </div>

          {/* Right */}
          <div className='flex items-center gap-4'>
            <button className='relative rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600'>
              <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
                ></path>
              </svg>
              <span className='absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500'></span>
            </button>

            {/* Admin User Info */}
            <div className='flex items-center gap-3'>
              <div className='flex items-center gap-2'>
                <div className='flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white'>
                  <User className='h-4 w-4' />
                </div>
                <div className='hidden md:block'>
                  <p className='text-sm font-medium text-gray-900'>
                    {admin ? `${admin.first_name} ${admin.last_name}` : 'Admin'}
                  </p>
                  <p className='text-xs text-gray-500 capitalize'>
                    {admin?.role || 'Administrator'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
