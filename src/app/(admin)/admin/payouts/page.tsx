'use client';

import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import adminApi from '@/lib/api/admin';
import { AlertTriangle, Building, CreditCard, MapPin, Send } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PayoutRequest {
  id: string;
  transactionId: string;
  recipientName: string;
  recipientAccount: string;
  recipientBank: string;
  recipientBankCode: string;
  recipientCountry: string;
  amount: number;
  currency: string;
  status: string;
  sentAt: string | null;
  completedAt: string | null;
  createdAt: string;
  infinitusRequestId: string | null;
  infinitusTrackingNumber: string | null;
  transactions?: {
    userId: string;
    referenceNumber: string;
    client_profiles?: {
      first_name: string;
      last_name: string;
      company_name: string;
    };
  };
}

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null);
  const [payoutToSend, setPayoutToSend] = useState<PayoutRequest | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchPayouts();
  }, []);

  async function fetchPayouts() {
    try {
      setLoading(true);
      const { data: payouts } = await adminApi.payouts.list();
      setPayouts(payouts || []);
    } catch (error) {
      console.error('Error fetching payouts:', error);
      toast.error('Failed to load payouts', 'Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  }

  async function confirmSendPayout() {
    if (!payoutToSend) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/payouts/${payoutToSend.id}/send`, { method: 'POST' });
      const data = await response.json();

      if (response.ok) {
        await fetchPayouts();
        setPayoutToSend(null);
        setSelectedPayout(null);

        if (data.simulated) {
          toast.warning('Payout Completed (Simulated)', data.message || 'Payout processed in simulation mode.');
        } else {
          toast.success('Payout Sent Successfully!', `Tracking: ${data.trackingNumber || 'N/A'}`);
        }
      } else {
        toast.error('Payout Failed', data.error || 'Failed to send payout. Please try again.');
      }
    } catch (error: any) {
      console.error('Error sending payout:', error);
      toast.error('Network Error', 'Failed to communicate with the server.');
    } finally {
      setActionLoading(false);
    }
  }

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { bg: string; text: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      processing: { bg: 'bg-blue-100', text: 'text-blue-800' },
      sent: { bg: 'bg-purple-100', text: 'text-purple-800' },
      completed: { bg: 'bg-green-100', text: 'text-green-800' },
      failed: { bg: 'bg-red-100', text: 'text-red-800' },
    };
    const config = configs[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
    return (
      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${config.bg} ${config.text}`}>
        {status}
      </span>
    );
  };

  return (
    <div>
      <div className='mb-6 flex items-center justify-between'>
        <h1 className='text-2xl font-bold text-gray-900'>Payout Requests</h1>
        <button
          onClick={fetchPayouts}
          disabled={loading}
          className='rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50'
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {loading ? (
        <div className='py-12 text-center'>
          <div className='mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'></div>
          <p className='mt-4 text-gray-500'>Loading payouts...</p>
        </div>
      ) : payouts.length === 0 ? (
        <div className='rounded-lg border border-gray-200 bg-white p-12 text-center'>
          <Send className='mx-auto mb-4 h-12 w-12 text-gray-300' />
          <h3 className='text-lg font-medium text-gray-900'>No Payout Requests</h3>
          <p className='mt-1 text-gray-500'>
            Payout requests will appear here when clients initiate them.
          </p>
        </div>
      ) : (
        <div className='grid gap-4'>
          {payouts.map(payout => (
            <div
              key={payout.id}
              className='rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md'
            >
              <div className='flex items-start justify-between'>
                <div className='flex-1'>
                  <div className='mb-2 flex items-center gap-3'>
                    <h3 className='text-lg font-semibold text-gray-900'>
                      {payout.amount.toLocaleString()} {payout.currency}
                    </h3>
                    {getStatusBadge(payout.status)}
                  </div>

                  <div className='grid grid-cols-1 gap-4 text-sm md:grid-cols-3'>
                    <div className='flex items-start gap-2'>
                      <CreditCard className='mt-0.5 h-4 w-4 text-gray-400' />
                      <div>
                        <p className='font-medium text-gray-700'>Recipient</p>
                        <p className='text-gray-600'>{payout.recipientName || 'N/A'}</p>
                        <p className='font-mono text-xs text-gray-500'>{payout.recipientAccount || 'N/A'}</p>
                      </div>
                    </div>
                    <div className='flex items-start gap-2'>
                      <Building className='mt-0.5 h-4 w-4 text-gray-400' />
                      <div>
                        <p className='font-medium text-gray-700'>Bank</p>
                        <p className='text-gray-600'>{payout.recipientBank || 'N/A'}</p>
                        <p className='font-mono text-xs text-gray-500'>
                          {payout.recipientBankCode || '-'}
                        </p>
                      </div>
                    </div>
                    <div className='flex items-start gap-2'>
                      <MapPin className='mt-0.5 h-4 w-4 text-gray-400' />
                      <div>
                        <p className='font-medium text-gray-700'>Country</p>
                        <p className='text-gray-600'>{payout.recipientCountry || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {payout.infinitusTrackingNumber && (
                    <div className='mt-3 rounded bg-green-50 p-2 text-sm'>
                      <span className='font-medium text-green-700'>Tracking: </span>
                      <span className='font-mono text-green-600'>
                        {payout.infinitusTrackingNumber}
                      </span>
                    </div>
                  )}
                </div>

                <div className='ml-4 flex flex-col gap-2'>
                  {payout.status === 'pending' && (
                    <button
                      onClick={() => setPayoutToSend(payout)}
                      disabled={actionLoading}
                      className='cursor-pointer rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50'
                    >
                      <Send className='mr-1 inline h-4 w-4' />
                      Send Payout
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedPayout(payout)}
                    className='cursor-pointer rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200'
                  >
                    View Details
                  </button>
                </div>
              </div>

              <div className='mt-4 flex items-center justify-between border-t border-gray-100 pt-4 text-xs text-gray-500'>
                <span>Created: {new Date(payout.createdAt).toLocaleString()}</span>
                {payout.sentAt && <span>Sent: {new Date(payout.sentAt).toLocaleString()}</span>}
                {payout.completedAt && (
                  <span>Completed: {new Date(payout.completedAt).toLocaleString()}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal for Sending Payout */}
      <Modal
        isOpen={!!payoutToSend}
        onClose={() => !actionLoading && setPayoutToSend(null)}
        title='Confirm Payout'
        size='md'
      >
        <div className='space-y-4'>
          <div className='flex items-center gap-3 rounded-lg bg-orange-50 p-4'>
            <AlertTriangle className='h-6 w-6 text-orange-600' />
            <div>
              <p className='font-medium text-orange-800'>Are you sure you want to send this payout?</p>
              <p className='text-sm text-orange-600'>This action cannot be undone.</p>
            </div>
          </div>

          {payoutToSend && (
            <div className='rounded-lg border border-gray-200 p-4 space-y-2'>
              <div className='flex justify-between'>
                <span className='text-gray-700'>Amount</span>
                <span className='font-semibold text-gray-700'>{payoutToSend.amount.toLocaleString()} {payoutToSend.currency}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-700'>Recipient</span>
                <span className='font-medium text-gray-700'>{payoutToSend.recipientName || 'N/A'}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-700'>Bank</span>
                <span className='font-medium text-gray-700'>{payoutToSend.recipientBank || 'N/A'}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-700'>Country</span>
                <span className='font-medium text-gray-700'>{payoutToSend.recipientCountry || 'N/A'}</span>
              </div>
            </div>
          )}

          <div className='flex justify-end gap-3 pt-4'>
            <button
              onClick={() => setPayoutToSend(null)}
              disabled={actionLoading}
              className='cursor-pointer rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50'
            >
              Cancel
            </button>
            <button
              onClick={confirmSendPayout}
              disabled={actionLoading}
              className='cursor-pointer rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50'
            >
              {actionLoading ? (
                <>
                  <span className='mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent'></span>
                  Sending...
                </>
              ) : (
                <>
                  <Send className='mr-1 inline h-4 w-4' />
                  Confirm & Send
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedPayout}
        onClose={() => setSelectedPayout(null)}
        title='Payout Details'
        size='lg'
      >
        {selectedPayout && (
          <div className='space-y-4'>
            <div className='flex justify-between'>
              <span className='text-gray-700'>Amount</span>
              <span className='font-semibold text-gray-700'>
                {selectedPayout.amount.toLocaleString()} {selectedPayout.currency}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-700'>Status</span>
              {getStatusBadge(selectedPayout.status)}
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-700'>Recipient</span>
              <span className='font-medium text-gray-700'>{selectedPayout.recipientName || 'N/A'}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-700'>Account</span>
              <span className='font-mono text-sm text-gray-700'>{selectedPayout.recipientAccount || 'N/A'}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-700'>Bank</span>
              <span className='text-gray-700'>{selectedPayout.recipientBank || 'N/A'}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-700'>Bank Code</span>
              <span className='font-mono text-sm text-gray-700'>{selectedPayout.recipientBankCode || '-'}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-700'>Country</span>
              <span className='text-gray-700'>{selectedPayout.recipientCountry || 'N/A'}</span>
            </div>
            {selectedPayout.infinitusRequestId && (
              <div className='flex justify-between'>
                <span className='text-gray-700'>Infinitus ID</span>
                <span className='font-mono text-sm text-gray-700'>{selectedPayout.infinitusRequestId}</span>
              </div>
            )}
            {selectedPayout.infinitusTrackingNumber && (
              <div className='flex justify-between'>
                <span className='text-gray-700'>Tracking Number</span>
                <span className='font-mono text-sm text-green-600'>{selectedPayout.infinitusTrackingNumber}</span>
              </div>
            )}

            <div className='border-t border-gray-100 pt-4 text-xs text-gray-500 space-y-1'>
              <p>Created: {new Date(selectedPayout.createdAt).toLocaleString()}</p>
              {selectedPayout.sentAt && <p>Sent: {new Date(selectedPayout.sentAt).toLocaleString()}</p>}
              {selectedPayout.completedAt && <p>Completed: {new Date(selectedPayout.completedAt).toLocaleString()}</p>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
