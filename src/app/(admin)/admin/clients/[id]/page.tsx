'use client';

import { ClientActivity } from '@/components/admin/clients/ClientActivity';
import { ClientDocuments } from '@/components/admin/clients/ClientDocuments';
import { ClientNotes } from '@/components/admin/clients/ClientNotes';
import { ClientRepresentatives } from '@/components/admin/clients/ClientRepresentatives';
import { ClientTransactions } from '@/components/admin/clients/ClientTransactions';
import { ClientViewOverview } from '@/components/admin/clients/ClientViewOverview';
import { ClientWallets } from '@/components/admin/clients/ClientWallets';
import ActivityTab from '@/components/icons/ActivityTab';
import NotesIcon from '@/components/icons/NotesIcon';
import TransacionIcon from '@/components/icons/TransacionIcon';
import WalletIcon from '@/components/icons/WalletIcon';

import { Tabs } from '@/components/ui/Tabs';
import { adminClientApi } from '@/lib/api/admin-client';
import {
  ArrowLeft,
  FileText,
  LayoutDashboard,
  Users
} from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = params.id as string;

  // Initialize activeTab from URL params or default to 'overview'
  const [activeTab, setActiveTab] = useState(() => {
    return searchParams.get('tab') || 'overview';
  });
  const [clientName, setClientName] = useState('Loading...');

  // Fetch client name from API
  const fetchClientName = useCallback(async () => {
    if (!clientId) return;

    try {
      const response = await adminClientApi.getClient(clientId);
      if (response.success && response.client) {
        const name =
          response.client.company_name ||
          `${response.client.first_name} ${response.client.last_name}`;
        setClientName(name);
      } else {
        setClientName('Client Not Found');
      }
    } catch (error) {
      console.error('Error fetching client name:', error);
      setClientName('Client');
    }
  }, [clientId]);

  useEffect(() => {
    fetchClientName();
  }, [fetchClientName]);

  // Sync activeTab with URL params on mount and when searchParams change
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // Handle tab change and update URL
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    // Update URL without page reload
    const newUrl = `${window.location.pathname}?tab=${newTab}`;
    router.push(newUrl, { scroll: false });
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className='h-4 w-4' /> },
    { id: 'representative', label: 'Representative', icon: <Users className='h-4 w-4' /> },
    { id: 'documents', label: 'Documents', icon: <FileText className='h-4 w-4' /> },
    { id: 'wallets', label: 'Wallets', icon: <WalletIcon className='h-4 w-4' /> },
    { id: 'transactions', label: 'Transactions', icon: <TransacionIcon className='h-4 w-4' /> },
    { id: 'notes', label: 'Notes', icon: <NotesIcon className='h-4 w-4' /> },
    { id: 'activity', label: 'Activity', icon: <ActivityTab className='h-4 w-4' /> },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <ClientViewOverview clientId={clientId} />;
      case 'representative':
        return <ClientRepresentatives clientId={clientId} />;
      case 'documents':
        return <ClientDocuments clientId={clientId} />;
      case 'wallets':
        return <ClientWallets clientId={clientId} />;
      case 'transactions':
        return <ClientTransactions clientId={clientId} />;
      case 'notes':
        return <ClientNotes clientId={clientId} />;
      case 'activity':
        return <ClientActivity clientId={clientId} />;
      default:
        return (
          <div className='flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-20'>
            <p className='font-medium text-gray-500'>Coming Soon</p>
            <p className='text-sm text-gray-400'>The {activeTab} section is under development.</p>
          </div>
        );
    }
  };

  return (
    <div className='space-y-6 pb-10'>
      {/* Page Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <button
            onClick={() => router.back()}
            className='cursor-pointer rounded-lg border border-transparent p-2 text-gray-600 transition-all hover:border-gray-200 hover:bg-white hover:shadow-sm'
          >
            <ArrowLeft className='h-5 w-5' />
          </button>
          <h1 className='text-2xl font-semibold text-gray-900'>{clientName}</h1>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className='bg-gray-50/80 px-2 py-1 backdrop-blur-sm'>
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} variant='pills' />
      </div>

      {/* Main Content */}
      <div className='mt-6'>{renderTabContent()}</div>
    </div>
  );
}
