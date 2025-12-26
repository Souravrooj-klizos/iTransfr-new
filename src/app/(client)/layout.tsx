'use client';

import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { SidebarProvider, useSidebar } from '@/providers/SidebarProvider';
import { UserProvider } from '@/providers/UserProvider';

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed, isMobileOpen } = useSidebar();

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='flex'>
        <Sidebar />

        <div
          className={`w-full flex-1 transition-all duration-300 ${isMobileOpen ? 'pl-0' : isCollapsed ? 'md:pl-25' : 'md:pl-64'} `}
        >
          <Header />

          <main className='mb-3 max-w-full overflow-x-hidden pt-20 pr-5 pl-2'>{children}</main>
        </div>
      </div>
    </div>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <SidebarProvider>
        <LayoutContent>{children}</LayoutContent>
      </SidebarProvider>
    </UserProvider>
  );
}
