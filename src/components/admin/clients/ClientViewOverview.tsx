'use client';

import ChartIcon from '@/components/icons/ChartIcon';
import CreditCardIcon from '@/components/icons/CreditCardIcon';
import DollarBgIcon from '@/components/icons/DollarBgIcon';
import FeeRateIcon from '@/components/icons/FeeRateIcon';
import LifeStyleIcon from '@/components/icons/LifeStyleIcon';
import TransacionIcon from '@/components/icons/TransacionIcon';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { adminClientApi, ClientDetail } from '@/lib/api/admin-client';
import { AlertTriangle, Building2, DollarSignIcon, Loader2, MapPin } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface ClientViewOverviewProps {
  clientId: string;
}

export function ClientViewOverview({ clientId }: ClientViewOverviewProps) {
  const [needsBanking, setNeedsBanking] = useState(true);
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Guard against duplicate fetch calls (React StrictMode)
  const hasFetched = useRef(false);

  const fetchClient = useCallback(async () => {
    if (!clientId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await adminClientApi.getClient(clientId);

      if (response.success && response.client) {
        setClient(response.client);
      } else {
        setError(response.error || 'Failed to load client data');
      }
    } catch (err) {
      console.error('Error fetching client:', err);
      setError('Failed to load client data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchClient();
    }
  }, [fetchClient]);

  // Loading state
  if (loading) {
    return (
      <div className='flex items-center justify-center py-20'>
        <div className='flex flex-col items-center gap-3'>
          <Loader2 className='h-8 w-8 animate-spin text-blue-500' />
          <p className='text-sm text-gray-500'>Loading client details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !client) {
    return (
      <div className='flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 py-20'>
        <AlertTriangle className='mb-3 h-8 w-8 text-red-500' />
        <p className='font-medium text-red-700'>{error || 'Client not found'}</p>
        <Button variant='outline' size='sm' className='mt-4' onClick={fetchClient}>
          Try Again
        </Button>
      </div>
    );
  }

  // Helper functions
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getAccountTypeLabel = (type: string | null) => {
    switch (type) {
      case 'personal':
        return 'Personal';
      case 'business':
        return 'Regular';
      case 'fintech':
        return 'FinTech/EDD';
      default:
        return 'Not Set';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_kyc':
        return 'Pending Review';
      case 'active':
        return 'Active';
      case 'suspended':
        return 'Suspended';
      case 'onboarding':
        return 'Onboarding';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'border-green-100 bg-green-50 text-green-500';
      case 'pending_kyc':
      case 'onboarding':
        return 'border-orange-100 bg-orange-50 text-orange-500';
      case 'suspended':
        return 'border-red-100 bg-red-50 text-red-500';
      default:
        return 'border-gray-200 bg-gray-50 text-gray-600';
    }
  };

  const getLifecycleStatus = () => {
    if (!client.onboarding_completed) return 'Prospect';
    if (client.status === 'active') return 'Active Client';
    return 'Pending Activation';
  };

  // Build address string
  const buildAddressString = () => {
    if (!client.business_address) {
      return 'Not provided';
    }
    const addr = client.business_address;
    const parts = [addr.streetAddress, addr.addressLine2].filter(Boolean);
    return parts.join(', ') || 'Not provided';
  };

  // Stats data
  const stats = [
    {
      label: 'Total Volume',
      value: formatCurrency(client.stats.total_volume),
      icon: DollarBgIcon,
      color: 'text-blue-500',
      bg: 'bg-blue-100',
    },
    {
      label: 'Total Profit',
      value: formatCurrency(client.stats.total_profit),
      icon: ChartIcon,
      color: 'text-green-500',
      bg: 'bg-green-100',
    },
    {
      label: 'Fee Rate',
      value: `${client.stats.fee_rate}%`,
      icon: FeeRateIcon,
      color: 'text-purple-500',
      bg: 'bg-purple-100',
    },
    {
      label: 'Transactions',
      value: client.stats.transaction_count.toString(),
      icon: TransacionIcon,
      color: 'text-orange-500',
      bg: 'bg-orange-100',
    },
  ];

  return (
    <div className='space-y-4'>
      {/* Stats Grid */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {stats.map((stat, i) => (
          <Card key={i} className='overflow-hidden border-gray-200 bg-white shadow-none'>
            <CardContent className='px-4 py-5'>
              <div className='flex items-start justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-500'>{stat.label}</p>
                  <h3 className='mt-1 text-2xl font-bold text-gray-900'>{stat.value}</h3>
                </div>
                <div className={`${stat.bg} rounded-lg p-2`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        {/* Business Information */}
        <Card className='border-gray-200 bg-white shadow-none'>
          <CardContent className='p-6'>
            <div className='mb-6 flex items-center gap-2'>
              <Building2 className='h-5 w-5 text-blue-500' />
              <h3 className='font-semibold text-gray-900'>Business Information</h3>
            </div>

            <div className='grid grid-cols-2 gap-x-4 gap-y-6'>
              <InfoField label='Business Name' value={client.company_name || 'Not provided'} />
              <InfoField label='Entity Type' value={client.entity_type || 'Not provided'} />
              <InfoField label='Tax ID' value={client.tax_id || 'Not provided'} />
              <InfoField label='Website' value={client.website || 'Not provided'} />
              <InfoField label='Industry' value={client.industry || 'Not provided'} />
              <div>
                <p className='mb-1 text-xs tracking-wider text-gray-400 uppercase'>Business Type</p>
                <span className='inline-flex items-center rounded-lg border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-500'>
                  {getAccountTypeLabel(client.account_type)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card className='border-gray-200 bg-white shadow-none'>
          <CardContent className='p-6'>
            <div className='mb-6 flex items-center gap-2'>
              <MapPin className='h-5 w-5 text-blue-500' />
              <h3 className='font-semibold text-gray-900'>Address</h3>
            </div>

            <div className='grid grid-cols-2 gap-x-4 gap-y-6'>
              <InfoField label='Address' value={buildAddressString()} />
              <InfoField label='City' value={client.business_address?.city || client.city || 'Not provided'} />
              <InfoField label='State / Province' value={client.business_address?.state || client.state || 'Not provided'} />
              <InfoField label='Postal Code' value={client.business_address?.postalCode || 'Not provided'} />
              <InfoField label='Country' value={client.business_address?.country || client.country || 'Not provided'} />
            </div>
          </CardContent>
        </Card>

        {/* Commercial Terms */}
        <Card className='border-gray-200 bg-white shadow-none'>
          <CardContent className='p-6'>
            <div className='mb-6 flex items-center gap-2'>
              <DollarSignIcon className='h-5 w-5 text-blue-500' />
              <h3 className='font-semibold text-gray-900'>Commercial Terms</h3>
            </div>

            <div className='grid grid-cols-2 gap-x-4 gap-y-6'>
              <InfoField label='Fee Rate' value={`${client.stats.fee_rate}%`} />
              <InfoField label='Volume Limit' value={client.expected_monthly_volume || 'No limit'} />
            </div>
          </CardContent>
        </Card>

        {/* Lifecycle */}
        <Card className='border-gray-200 bg-white shadow-none'>
          <CardContent className='p-6'>
            <div className='mb-6 flex items-center gap-2'>
              <LifeStyleIcon className='h-5 w-5 text-blue-500' />
              <h3 className='font-semibold text-gray-900'>Lifecycle</h3>
            </div>

            <div className='grid grid-cols-2 gap-x-4 gap-y-6'>
              <div>
                <p className='mb-1 text-xs tracking-wider text-gray-600'>Lifecycle Status</p>
                <span className='inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600'>
                  {getLifecycleStatus()}
                </span>
              </div>
              <div>
                <p className='mb-1 text-xs tracking-wider text-gray-600'>Client Status</p>
                <span className={`inline-flex items-center rounded-lg border px-3 py-1 text-xs font-medium ${getStatusColor(client.status)}`}>
                  {getStatusLabel(client.status)}
                </span>
              </div>
              <InfoField label='Created' value={formatDate(client.createdAt)} />
              <InfoField label='Contract Renewal' value='N/A' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* USD Banking Services Section */}
      <Card className='border-gray-200 bg-white shadow-none'>
        <CardContent className='p-6'>
          <div className='mb-2 flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <CreditCardIcon className='h-5 w-5 text-blue-500' />
              <h3 className='font-semibold text-gray-900'>USD Banking Services</h3>
            </div>
          </div>
          <p className='mb-6 text-sm text-gray-500'>
            Enable virtual USD bank accounts with FedWire, SWIFT, and ACH transfers via InfinitusPay
          </p>

          <div className='mb-6 rounded-xl border border-gray-200 bg-gray-100 p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <h4 className='text-sm font-semibold text-gray-900'>Needs USD Banking?</h4>
                <p className='mt-1 text-xs text-gray-500'>
                  Enable this if the client requires USD virtual bank accounts for international
                  transfers
                </p>
              </div>
              <button
                onClick={() => setNeedsBanking(!needsBanking)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  needsBanking ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    needsBanking ? 'translate-x-5' : 'translate-x-0'
                  }`}
                ></span>
              </button>
            </div>
          </div>

          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            <BankingInfoCard label='InfinitusPay Status' value='Not Started' />
            <BankingInfoCard label='InfinitusPay ID' value='Not Assigned' />
            <BankingInfoCard
              label='Monthly SWIFT Volume'
              value={client.business_operations?.volume_swift_monthly
                ? formatCurrency(client.business_operations.volume_swift_monthly)
                : 'Not Specified'
              }
            />
            <BankingInfoCard
              label='Monthly Local Payments'
              value={client.business_operations?.volume_local_monthly
                ? formatCurrency(client.business_operations.volume_local_monthly)
                : 'Not Specified'
              }
            />
            <BankingInfoCard
              label='Regions of Operation'
              value={client.business_operations?.primary_operating_regions?.length
                ? client.business_operations.primary_operating_regions.join(', ')
                : 'Not Specified'
              }
            />
            <BankingInfoCard
              label='Operating Currencies'
              value={client.business_operations?.operating_currencies?.length
                ? client.business_operations.operating_currencies.join(', ')
                : 'Not Specified'
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Missing Requirements Section */}
      {client.missing_requirements.length > 0 && (
        <div className='rounded-xl border border-orange-200 bg-orange-50/50 p-4'>
          <div className='mb-4 flex items-center gap-2 text-yellow-700'>
            <AlertTriangle className='h-5 w-5' />
            <h3 className='font-semibold'>Missing Requirements:</h3>
          </div>
          <ul className='space-y-2 text-sm font-normal text-yellow-600'>
            {client.missing_requirements.map((req, index) => (
              <li key={index}>• {req}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer Action Bar */}
      <div className='flex flex-col items-center justify-between gap-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4 md:flex-row'>
        <p className='text-sm font-medium text-blue-500'>
          {client.onboarding_completed
            ? 'Client onboarding is complete. Review documents and submit to InfinitusPay.'
            : `Next Steps: Complete the Representatives tab with ownership details and upload required documents. (Step ${client.onboarding_step}/8)`
          }
        </p>
        <div className='flex items-center gap-3'>
          <Button
            variant='outline'
            size='sm'
            className='cursor-pointer bg-white text-gray-700 hover:bg-gray-50'
          >
            Representatives
          </Button>
          <Button
            variant='outline'
            size='sm'
            className='cursor-pointer bg-white text-gray-700 hover:bg-gray-50'
          >
            Documents
          </Button>
          <Button
            size='sm'
            className='bg-gradient-blue cursor-pointer border-none px-6 text-white hover:bg-blue-700'
          >
            Submit to InfinitusPay
          </Button>
        </div>
      </div>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className='mb-1 text-xs tracking-wider text-gray-600'>{label}</p>
      <p className='text-sm font-medium text-gray-800'>{value}</p>
    </div>
  );
}

function BankingInfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-xl border border-gray-200 bg-white p-4'>
      <p className='mb-1 text-xs tracking-wider text-gray-600'>{label}</p>
      <p className='text-sm font-medium text-gray-800'>{value}</p>
    </div>
  );
}
