import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/providers/UserProvider';
import { AlertCircle, CheckCircle, Clock, Upload, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface KYCRecord {
  status: string;
  createdAt: string;
  notes: string[];
}

export default function KYCStatus() {
  const { user, loading: userLoading } = useUser();
  const [kycStatus, setKycStatus] = useState<KYCRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchKYCStatus() {
      if (userLoading) return;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('kyc_records')
          .select('*')
          .eq('userId', user.id)
          .single();

        if (data) {
          setKycStatus(data);
        } else {
          setKycStatus(null);
        }
      } catch (error) {
        console.error('Error fetching KYC status:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchKYCStatus();
  }, [user, userLoading]);

  if (loading) return null;

  // If no KYC record exists, show prompt to upload
  if (!kycStatus) {
    return (
      <div className='mb-6 rounded-lg border border-blue-200 bg-blue-50 p-6'>
        <div className='flex items-start gap-4'>
          <div className='rounded-full bg-blue-100 p-2'>
            <Upload className='h-6 w-6 text-blue-600' />
          </div>
          <div className='flex-1'>
            <h3 className='text-lg font-semibold text-blue-900'>Complete Your Verification</h3>
            <p className='mt-1 mb-3 text-sm text-blue-700'>
              To start making transactions, you need to complete your KYC verification.
            </p>
            <Link
              href='/signup'
              className='bg-gradient-blue inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700'
            >
              Upload Documents
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          label: 'KYC Approved',
          message: 'Your account is fully verified. You can now access all features.',
        };
      case 'pending':
        return {
          icon: Clock,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          label: 'Verification Pending',
          message: 'Your documents have been submitted and are waiting for review.',
        };
      case 'under_review':
        return {
          icon: AlertCircle,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          label: 'Under Review',
          message: 'Our compliance team is currently reviewing your documents.',
        };
      case 'rejected':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          label: 'Verification Failed',
          message: 'Your KYC verification was rejected. Please check the notes below.',
        };
      default:
        return {
          icon: Clock,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          label: 'Unknown Status',
          message: '',
        };
    }
  };

  const config = getStatusConfig(kycStatus.status);
  const Icon = config.icon;

  // Don't show anything if approved
  if (kycStatus.status === 'approved') {
    return null;
  }

  return (
    <div className={`rounded-lg border ${config.borderColor} ${config.bgColor} mb-6 p-4`}>
      <div className='flex items-start gap-4'>
        <Icon className={`h-6 w-6 ${config.color} mt-1 shrink-0`} />
        <div className='flex-1'>
          <h3 className={`text-base font-semibold ${config.color}`}>{config.label}</h3>
          <p className='mt-1 text-sm text-gray-700'>{config.message}</p>

          {kycStatus.notes && kycStatus.notes.length > 0 && (
            <div className='bg-opacity-60 mt-3 rounded border border-gray-200 bg-white p-3'>
              <p className='mb-1 text-xs font-bold text-gray-700 uppercase'>Admin Notes:</p>
              <ul className='list-inside list-disc'>
                {kycStatus.notes.map((note, index) => (
                  <li key={index} className='text-sm text-gray-800'>
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {kycStatus.status === 'rejected' && (
            <div className='mt-3'>
              <Link
                href='/signup'
                className='text-sm font-medium text-red-700 underline hover:text-red-900'
              >
                Resubmit Documents
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
