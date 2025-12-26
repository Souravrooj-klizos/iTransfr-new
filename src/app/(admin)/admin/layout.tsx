'use client';

import { SidebarProvider, useSidebar } from '@/providers/SidebarProvider';
import { Sidebar } from '@/components/admin/Sidebar';
import { Header } from '@/components/admin/Header';

function AdminLayout({ children }: { children: React.ReactNode }) {
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

export default function AdminSideLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AdminLayout>{children}</AdminLayout>
    </SidebarProvider>
  );
}
