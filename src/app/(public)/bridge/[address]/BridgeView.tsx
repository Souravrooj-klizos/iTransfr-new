'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

export default function BridgeView({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-8'>
      <div className='w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-lg'>
        {/* Header */}
        <div className='text-center'>
          <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100'>
            <span className='text-xl font-bold text-blue-600'>iT</span>
          </div>
          <h2 className='mt-4 text-2xl font-bold text-gray-900'>Payment Request</h2>
          <p className='mt-2 text-sm text-gray-600'>
            Scan the code or copy the address to send payment
          </p>
        </div>

        {/* QR Code */}
        <div className='flex justify-center'>
          <div className='relative h-48 w-48 overflow-hidden rounded-lg border-2 border-gray-100 p-2'>
            {/* Using QR Server API for Hackathon speed */}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${address}`}
              alt='Wallet QR Code'
              className='h-full w-full object-contain'
            />
          </div>
        </div>

        {/* Details */}
        <div className='space-y-4 rounded-xl bg-gray-50 p-4'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium text-gray-500'>Asset</span>
            <div className='flex items-center gap-2'>
              <span className='text-sm font-semibold text-gray-900'>USDT (TRC-20)</span>
            </div>
          </div>
          <div className='space-y-2'>
            <span className='text-sm font-medium text-gray-500'>Deposit Address</span>
            <div className='flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-xs break-all text-gray-800'>
              {address}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleCopy}
          className='flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700'
        >
          {copied ? (
            <>
              <Check className='h-4 w-4' />
              Address Copied
            </>
          ) : (
            <>
              <Copy className='h-4 w-4' />
              Copy Wallet Address
            </>
          )}
        </button>

        <div className='text-center text-xs text-gray-400'>Powered by iTransfr</div>
      </div>
    </div>
  );
}
