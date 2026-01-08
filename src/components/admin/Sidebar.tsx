import DashboardIcon from '@/components/icons/DashboardIcon';
import HelpIcon from '@/components/icons/HelpIcon';
import ItransfrLogo from '@/components/icons/ItransfrLogo';
import ItransfrText from '@/components/icons/ItransfrText';
import kycReviewIcon from '@/components/icons/kycReviewIcon';
import RecipientsIcon from '@/components/icons/RecipientsIcon';
import ShieldAlertIcon from '@/components/icons/ShieldAlertIcon';
import TransacionIcon from '@/components/icons/TransacionIcon';
import WalletIcon from '@/components/icons/WalletIcon';
import { createClient } from '@/lib/supabase/client';
import { useSidebar } from '@/providers/SidebarProvider';
import { ChevronDown, CreditCard, LogOut, Settings, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function Sidebar() {
  const [user, setUser] = useState<any>(null);
  const { isCollapsed, isMobileOpen, closeMobileSidebar } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // For admin pages, don't check Supabase auth - use admin auth instead
    if (pathname.startsWith('/admin/')) {
      // Load admin user from localStorage
      const adminUser = localStorage.getItem('admin_user');
      if (adminUser) {
        setUser(JSON.parse(adminUser));
      }
      return;
    }

    // For client pages, check Supabase auth
    const supabase = createClient();
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        router.push('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [router, pathname]);

  const handleLogout = async () => {
    if (pathname.startsWith('/admin/')) {
      // Admin logout
      const sessionToken = localStorage.getItem('admin_session_token');
      if (sessionToken) {
        await fetch('/api/admin/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_token: sessionToken }),
        });
      }
      localStorage.removeItem('admin_session_token');
      localStorage.removeItem('admin_user');
      document.cookie = 'admin_session_token=; path=/; max-age=0';
      router.push('/admin-login');
    } else {
      // Client logout
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: DashboardIcon },
    { name: 'Clients', href: '/admin/clients', icon: RecipientsIcon },
    { name: 'Wallets', href: '/admin/wallets', icon: WalletIcon },
    { name: 'KYT Alerts', href: '/admin/kyt/alerts', icon: ShieldAlertIcon },
    { name: 'KYC Review', href: '/admin/kyc-review', icon: kycReviewIcon },
    { name: 'Transactions', href: '/admin/transactions', icon: TransacionIcon },
    { name: 'Payouts', href: '/admin/payouts', icon: CreditCard },
  ];

  const bottomNavigation = [
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'Help Center', href: '/help', icon: HelpIcon },
  ];

  const isEffectiveCollapsed = isCollapsed && !isMobileOpen;

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300
    ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
    ${isEffectiveCollapsed ? 'md:w-25' : 'md:w-65'}
  `;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className='fixed inset-0 z-40 bg-black/50 md:hidden'
          onClick={closeMobileSidebar}
        ></div>
      )}

      <div className={sidebarClasses}>
        <div
          className={`my-3 mr-1 ml-2 flex grow flex-col rounded-lg border-2 border-r border-gray-200 bg-white lg:ml-5 ${isEffectiveCollapsed ? 'items-center px-1' : ''
            }`}
        >
          {/* Logo */}
          <div
            className={`flex h-16 items-center border-b border-gray-200 ${isEffectiveCollapsed ? 'justify-center px-0' : 'justify-between px-4'
              }`}
          >
            <div className='flex items-center gap-2'>
              <ItransfrLogo />
              {!isEffectiveCollapsed && <ItransfrText />}
            </div>
            {/* Mobile Close Button */}
            <button className='cursor-pointer md:hidden' onClick={closeMobileSidebar}>
              <X className='h-6 w-6 text-gray-500' />
            </button>
          </div>

          {/* User Info */}
          <div
            className={`border-b border-gray-200 py-4 ${isEffectiveCollapsed ? 'px-1' : 'px-2'}`}
          >
            <Link href='#' onClick={closeMobileSidebar}>
              <div
                className={`flex cursor-pointer items-center rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100 ${isEffectiveCollapsed ? 'justify-center' : 'justify-between'
                  }`}
              >
                <div className='flex items-center gap-3'>
                  <div className='bg-gradient-dark flex h-8 w-8 shrink-0 items-center justify-center rounded-full'>
                    <span className='text-sm font-medium text-white'>
                      {pathname.startsWith('/admin/')
                        ? user?.first_name?.charAt(0).toUpperCase() || 'A'
                        : user?.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  {!isEffectiveCollapsed && (
                    <div className='min-w-0 flex-1'>
                      <p className='truncate text-sm font-medium text-gray-900'>
                        {pathname.startsWith('/admin/')
                          ? `${user?.first_name || 'Admin'} ${user?.last_name || ''}`.trim() ||
                          'Administrator'
                          : 'Liberty Trading Inc.'}
                      </p>
                      <p className='truncate text-xs text-gray-500'>
                        {pathname.startsWith('/admin/')
                          ? user?.role || 'Administrator'
                          : 'Sheridan, USA'}
                      </p>
                    </div>
                  )}
                </div>
                {!isEffectiveCollapsed && <ChevronDown className='h-4 w-4 text-gray-400' />}
              </div>
            </Link>
          </div>

          {/* Main Navigation */}
          <nav className='flex-1 space-y-1 overflow-y-auto px-3 py-4'>
            {navigation.map(item => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={closeMobileSidebar}
                  title={isEffectiveCollapsed ? item.name : ''}
                  className={`group flex items-center rounded-lg py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-gradient-dark text-white' : 'text-gray-700 hover:bg-gray-100'
                    } ${isEffectiveCollapsed ? 'justify-center px-[10px]' : 'px-3'}`}
                >
                  <item.icon
                    className={`h-5 w-5 shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'
                      } ${!isEffectiveCollapsed ? 'mr-3' : ''}`}
                  />
                  {!isEffectiveCollapsed && item.name}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Navigation */}
          <div className='space-y-1 border-t border-gray-200 px-3 py-4'>
            {bottomNavigation.map(item => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={closeMobileSidebar}
                  title={isEffectiveCollapsed ? item.name : ''}
                  className={`group flex items-center rounded-lg py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-gradient-dark text-white' : 'text-gray-700 hover:bg-gray-100'
                    } ${isEffectiveCollapsed ? 'justify-center px-[10px]' : 'px-3'}`}
                >
                  <item.icon
                    className={`h-5 w-5 shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'
                      } ${!isEffectiveCollapsed ? 'mr-3' : ''}`}
                  />
                  {!isEffectiveCollapsed && item.name}
                </Link>
              );
            })}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              title={isEffectiveCollapsed ? 'Logout' : ''}
              className={`group flex w-full cursor-pointer items-center rounded-lg py-2.5 text-sm font-medium text-red-500 transition-colors group-hover:text-red-600 hover:bg-red-50 ${isEffectiveCollapsed ? 'justify-center px-[10px]' : 'px-3'
                }`}
            >
              <LogOut
                className={`h-5 w-5 shrink-0 text-red-500 ${!isEffectiveCollapsed ? 'mr-3' : ''}`}
              />
              {!isEffectiveCollapsed && 'Logout'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
