'use client';

import BankCard from '@/components/icons/BankCard';
import ChartIcon from '@/components/icons/ChartIcon';
import ClientsIcons from '@/components/icons/ClientsIcons';
import DepositMoney from '@/components/icons/DepositMoney';
import KycApplication from '@/components/icons/KycApplication';
import KycReviewIcon from '@/components/icons/kycReviewIcon';
import SendMoney from '@/components/icons/SendMoney';
import SwapLineIcon from '@/components/icons/SwapLineIcon';
import TransacionIcon from '@/components/icons/TransacionIcon';
import { ArrowDownLeft, ArrowUpRight, FileCheck, TrendingUp } from 'lucide-react';

import { useEffect, useState } from 'react';

interface DashboardStats {
  totalClients: number;
  pendingKYC: number;
  approvedKYC: number;
  rejectedKYC: number;
  pendingTransactions: number;
  completedTransactions: number;
}

interface RecentKYC {
  id: string;
  userId: string;
  status: string;
  createdAt: string;
  client_profiles: {
    first_name: string;
    last_name: string;
    company_name: string;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    pendingKYC: 0,
    approvedKYC: 0,
    rejectedKYC: 0,
    pendingTransactions: 0,
    completedTransactions: 0,
  });
  const [recentKYC, setRecentKYC] = useState<RecentKYC[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]); // New state for dynamic alerts
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      // Fetch stats
      const response = await fetch('/api/admin/dashboard/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setRecentKYC(data.recentKYC || []);
        setActivities(data.activities || []);
        setAlerts(data.alerts || []); // Set alerts
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    {
      label: 'Total Clients',
      value: stats.totalClients,
      icon: BankCard,
      bgColor: 'bg-blue-100',
      subLabel: 'Last 30 Days',
    },
    {
      label: 'Pending KYC',
      value: stats.pendingKYC,
      icon: KycApplication,
      bgColor: 'bg-purple-100',
      subLabel: 'Last 30 Days',
    },
    {
      label: 'Approved KYC',
      value: stats.approvedKYC,
      icon: ChartIcon,
      bgColor: 'bg-green-100',
      subLabel: 'Last 30 Days',
    },
    {
      label: 'Rejected KYC',
      value: stats.rejectedKYC,
      icon: ClientsIcons,
      bgColor: 'bg-orange-100',
      subLabel: 'Last 30 Days',
    },
  ];

  if (loading) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <div className='h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <div>
      {/* Stats Grid */}
      <div className='mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {statCards.map(stat => (
          <div key={stat.label} className='rounded-xl border border-gray-200 bg-white p-4'>
            <div className='flex items-center justify-between'>
              <h3 className='text-base font-medium text-gray-800'>{stat.label}</h3>
              <div className={`${stat.bgColor} rounded-md p-2.5`}>
                <stat.icon className={`h-6 w-6`} />
              </div>
            </div>
            <div className='mt-1'>
              <p className='text-3xl font-bold text-gray-900'>{stat.value}</p>
              <p className='mt-2 text-sm text-gray-500'>{stat.subLabel}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent KYC Requests */}
      <div className='mb-4 rounded-lg border border-gray-200 bg-white'>
        <div className='flex items-center justify-between border-b border-gray-200 px-6 py-4'>
          <h2 className='text-lg font-semibold text-gray-900'>Recent KYC Requests</h2>
          <a href='/admin/kyc-review' className='text-sm text-blue-600 hover:text-blue-800'>
            View All →
          </a>
        </div>
        <div className='divide-y divide-gray-200'>
          {recentKYC.length === 0 ? (
            <div className='px-6 py-8 text-center text-gray-500'>
              <FileCheck className='mx-auto mb-2 h-12 w-12 text-gray-300' />
              <p>No pending KYC requests</p>
            </div>
          ) : (
            recentKYC.map(kyc => (
              <div
                key={kyc.id}
                className='flex items-center justify-between px-6 py-4 hover:bg-gray-50'
              >
                <div className='flex items-center'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 font-bold text-gray-500'>
                    {kyc.client_profiles?.first_name?.charAt(0) || '?'}
                  </div>
                  <div className='ml-4'>
                    <p className='text-sm font-medium text-gray-900'>
                      {kyc.client_profiles?.first_name} {kyc.client_profiles?.last_name}
                    </p>
                    <p className='text-sm text-gray-500'>
                      {kyc.client_profiles?.company_name || 'No company'}
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-4'>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      kyc.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : kyc.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : kyc.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {kyc.status}
                  </span>
                  <a
                    href='/admin/kyc-review'
                    className='text-sm font-medium text-blue-600 hover:text-blue-800'
                  >
                    Review
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3-Column Layout: Recent Activity, Alerts, Quick Actions */}
      <div className='grid grid-cols-1 gap-4 xl:grid-cols-3'>
        {/* Recent Activity */}
        <div className='rounded-lg border border-gray-200 bg-white px-6 py-4'>
          <h2 className='mb-5 text-lg font-normal text-gray-700'>Recent Activity</h2>
          <div className='space-y-6'>
            {activities.length === 0 ? (
              <p className='text-sm text-gray-500'>No recent activity.</p>
            ) : (
              activities.map((activity, index) => (
                <div key={index} className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className={`rounded-lg p-2 ${activity.bg}`}>
                      {/* Dynamic Icon based on type - simplified for now */}
                      {activity.iconType === 'kyc' ? (
                        <ArrowUpRight className={`h-5 w-5 ${activity.color}`} />
                      ) : activity.iconType === 'deposit' ? (
                        <ArrowDownLeft className={`h-5 w-5 ${activity.color}`} />
                      ) : (
                        <TrendingUp className={`h-5 w-5 ${activity.color}`} />
                      )}
                    </div>
                    <div>
                      <p className='text-sm font-medium text-gray-700'>{activity.title}</p>
                      <p className='text-xs text-gray-500'>{activity.subtitle}</p>
                    </div>
                  </div>
                  <span className='text-xs text-gray-600'>
                    {new Date(activity.time).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Alert & Notification */}
        <div className='rounded-lg border border-gray-200 bg-white px-6 py-4'>
          <h2 className='mb-5 text-lg font-normal text-gray-700'>Alert & Notification</h2>
          <div className='space-y-6'>
            {alerts.length === 0 ? (
              <p className='text-sm text-gray-500'>No new alerts.</p>
            ) : (
              alerts.map((alert, index) => (
                <div key={index} className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div
                      className={`rounded-lg p-2 ${
                        alert.type === 'kyc_pending'
                          ? 'bg-orange-100'
                          : alert.type === 'tx_pending'
                            ? 'bg-blue-100'
                            : 'bg-gray-100'
                      }`}
                    >
                      {alert.type === 'kyc_pending' ? (
                        <KycReviewIcon className={`h-5 w-5 text-orange-600`} />
                      ) : alert.type === 'tx_pending' ? (
                        <DepositMoney className={`h-5 w-5 text-blue-600`} />
                      ) : (
                        <FileCheck className={`h-5 w-5 text-gray-600`} />
                      )}
                    </div>
                    <span className='text-sm text-gray-700'>{alert.text}</span>
                  </div>
                  <a
                    href={alert.link || '#'}
                    className='flex w-[120px] items-center justify-center rounded border border-gray-200 px-3 py-1 text-xs font-normal text-gray-700 hover:bg-gray-50'
                  >
                    {alert.action}
                  </a>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className='grid grid-rows-[auto_1fr] rounded-lg border border-gray-200 bg-white px-6 py-4'>
          <h2 className='mb-5 text-lg font-normal text-gray-700'>Quick Actions</h2>
          <div className='grid grid-cols-2 gap-4'>
            <a
              href='/admin/kyc-review'
              className='flex flex-col items-center justify-center rounded-lg border border-gray-100 px-4 py-2 text-center hover:bg-gray-50'
            >
              <KycReviewIcon className='mb-2 h-8 w-8 text-gray-400' />
              <span className='text-xs font-medium text-gray-600'>Review KYC Applications</span>
            </a>
            <a
              href='/admin/transactions'
              className='flex flex-col items-center justify-center rounded-lg border border-gray-100 px-4 py-2 text-center hover:bg-gray-50'
            >
              <TransacionIcon className='mb-2 h-8 w-8 text-gray-400' />
              <span className='text-xs font-medium text-gray-600'>View Pending Transactions</span>
            </a>
            <a
              href='/admin/swaps'
              className='flex flex-col items-center justify-center rounded-lg border border-gray-100 px-4 py-2 text-center hover:bg-gray-50'
            >
              <SwapLineIcon className='mb-2 h-8 w-8 text-gray-400' />
              <span className='text-xs font-medium text-gray-600'>Execute Swaps Queue</span>
            </a>
            <a
              href='/admin/payouts'
              className='flex flex-col items-center justify-center rounded-lg border border-gray-100 px-4 py-2 text-center hover:bg-gray-50'
            >
              <SendMoney className='mb-2 h-8 w-8 text-gray-400' />
              <span className='text-xs font-medium text-gray-600'>Send Payouts Queue</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
