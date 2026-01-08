'use client';

import ShareIcon from '@/components/icons/ShareIcon';
import { BankDetailsField } from '@/components/ui/BankDetailsField';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import clientApi from '@/lib/api/client';
import { AlertCircle, Check, ChevronDown, Copy, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

const cryptocurrencies = [
  {
    id: 'usdt-trc20',
    name: 'USDT (TRC-20) Tron Network',
    currency: 'USDT',
    chain: 'tron',
    icon: '/Ellipse 3 (1).svg',
  },
  {
    id: 'usdc-erc20',
    name: 'USDC (ERC-20) Ethereum Network',
    currency: 'USDC',
    chain: 'ethereum',
    icon: '/Ellipse 3.svg',
  },
  {
    id: 'usdc-sol',
    name: 'USDC (SPL) Solana Network',
    currency: 'USDC',
    chain: 'solana',
    icon: '/Ellipse 3.svg',
  },
];

export function CryptocurrencyDeposit() {
  const [selectedCrypto, setSelectedCrypto] = useState(cryptocurrencies[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const [depositAddress, setDepositAddress] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  // Fetch address when selected crypto changes
  useEffect(() => {
    async function fetchAddress() {
      try {
        setLoading(true);
        setError(null);
        setDepositAddress('');

        const result = await clientApi.deposits.getAddress(
          selectedCrypto.currency,
          selectedCrypto.chain
        );

        if (result && result.address) {
          setDepositAddress(result.address);
        } else {
          setError('Failed to load address');
        }
      } catch (err) {
        console.error('Error fetching address:', err);
        setError('Failed to load address');
      } finally {
        setLoading(false);
      }
    }

    fetchAddress();
  }, [selectedCrypto]);

  const [origin, setOrigin] = useState('');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.host);
    }
  }, []);

  const bridgeUrl = depositAddress && origin ? `${origin}/bridge/${depositAddress}` : '';

  const handleOpenPaymentPage = () => {
    if (bridgeUrl) window.open(`${window.location.protocol}//${bridgeUrl}`, '_blank');
  };

  const handleCopyUrl = async () => {
    if (!bridgeUrl) return;
    try {
      await navigator.clipboard.writeText(`${window.location.protocol}//${bridgeUrl}`);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className='space-y-6'>
      <h2 className='text-xl font-semibold text-gray-900'>Cryptocurrency Deposit</h2>

      {/* Cryptocurrency Selector and Deposit Address */}
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3'>
        {/* Cryptocurrency Selector */}
        <div className='space-y-2'>
          <label className='text-sm font-medium text-gray-700'>Select Cryptocurrency</label>
          <div className='relative mt-1'>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className='flex w-full cursor-pointer items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 transition-colors hover:bg-gray-50'
              type='button'
            >
              <div className='flex items-center gap-2'>
                <Image
                  src={selectedCrypto.icon}
                  alt={selectedCrypto.currency}
                  width={20}
                  height={20}
                />
                <span className='font-medium'>{selectedCrypto.name}</span>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isDropdownOpen && (
              <div className='absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg'>
                {cryptocurrencies.map(crypto => (
                  <button
                    key={crypto.id}
                    onClick={() => {
                      setSelectedCrypto(crypto);
                      setIsDropdownOpen(false);
                    }}
                    className='flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-900 transition-colors hover:bg-gray-50'
                    type='button'
                  >
                    <Image src={crypto.icon} alt={crypto.currency} width={20} height={20} />
                    <span className='font-medium'>{crypto.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Deposit Address */}
        <div className='md:col-span-2'>
          {loading ? (
            <div className='flex h-[72px] items-center justify-center rounded-lg border border-gray-200 bg-gray-50'>
              <Loader2 className='h-6 w-6 animate-spin text-blue-600' />
            </div>
          ) : error ? (
            <div className='flex h-[72px] items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 text-red-600'>
              <AlertCircle className='h-5 w-5' />
              <span className='text-sm'>{error}</span>
            </div>
          ) : (
            <BankDetailsField label='Deposit Address' value={depositAddress} copyable={true} />
          )}
        </div>
      </div>

      {/* Share Wallet Address */}
      <div className='space-y-3 border-t border-gray-200 pt-4'>
        <div className='flex items-center gap-2'>
          <h3 className='text-lg font-semibold text-gray-900'>Share Wallet Address</h3>
          <div className='group relative'>
            <div className='flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-gray-400'>
              <span className='text-xs text-gray-400'>?</span>
            </div>
            <div className='absolute bottom-full left-0 mb-2 hidden w-64 rounded-lg bg-gray-900 p-2 text-xs text-white group-hover:block'>
              Share this URL with others to receive payments directly to your wallet
            </div>
          </div>
        </div>

        <div className='w-full space-y-2 xl:w-2/3'>
          <label className='text-sm font-medium text-gray-700'>Bridge URL</label>
          <div className='flex flex-col items-center gap-3 lg:flex-row'>
            <div className='flex flex-1 items-center justify-between rounded-lg border border-gray-200 bg-gray-50 py-0.5 pr-0.5 pl-4'>
              <span className='font-mono text-sm break-all text-blue-600'>
                {depositAddress ? bridgeUrl : 'Loading...'}
              </span>
              <button
                onClick={handleCopyUrl}
                disabled={!depositAddress}
                className='z-10 ml-2 flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs text-gray-500 transition-all hover:text-gray-700 disabled:opacity-50 active:scale-95'
                type='button'
              >
                {copiedUrl ? (
                  <>
                    <Check className='h-4 w-4 text-green-600' />
                    <span className='text-green-600'>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className='h-4 w-4' />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <Button
              onClick={handleOpenPaymentPage}
              disabled={!depositAddress}
              className='flex w-full shrink-0 cursor-pointer items-center justify-center gap-2 bg-[#B762FF] px-6 py-2.5 text-white hover:bg-[#B762FF]/90 disabled:opacity-50 sm:w-auto'
            >
              <ShareIcon />
              Open Payment Page
            </Button>
          </div>
        </div>
      </div>

      {/* Create Deposit Request Button (Optional enhancement) */}
      <div className='flex justify-end pt-4'>
        <Button
          onClick={async () => {
            // Create a deposit request record for tracking
            try {
              await clientApi.deposits.create({
                amount: 100, // Minimum amount to pass validation
                currency: selectedCrypto.currency,
                chain: selectedCrypto.chain,
                source: 'crypto',
              });
              toast.success('Deposit Notification Sent', 'Admin will review your deposit request.');
            } catch (e: any) {
              console.error(e);
              toast.error('Failed to Notify', e.response?.data?.error || e.message || 'Please try again.');
            }
          }}
          variant='outline'
          className='text-sm'
        >
          Notify Incoming Deposit
        </Button>
      </div>
    </div>
  );
}
