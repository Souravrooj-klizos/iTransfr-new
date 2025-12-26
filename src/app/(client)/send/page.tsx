'use client';

import CryptoTransfer from '@/components/icons/CryptoTransfer';
import DomesticIcon from '@/components/icons/DomesticIcon';
import InternationShift from '@/components/icons/InternationShift';
import { FeeBreakdown } from '@/components/transfer/FeeBreakdown';
import { FormInput } from '@/components/transfer/FormInput';
import { FormSelect } from '@/components/transfer/FormSelect';
import { SummaryItem } from '@/components/transfer/SummaryItem';
import { TransferMethodCard } from '@/components/transfer/TransferMethodCard';
import { useToast } from '@/components/ui/Toast';
import clientApi from '@/lib/api/client';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface WalletBalance {
  currency: string;
  balance: number;
  formattedBalance: string;
}

type TransferMethod = 'domestic' | 'international' | 'crypto';

const TRANSFER_METHODS = [
  {
    id: 'domestic' as TransferMethod,
    iconBgColor: 'bg-blue-100',
    icon: <DomesticIcon />,
    title: 'Domestic Transfer',
    subtitle: 'Send to U.S. Bank Accounts',
    timing: 'Same Day',
    description: 'Same day processing within 2 hours before 4pm EST',
  },
  {
    id: 'international' as TransferMethod,
    iconBgColor: 'bg-green-100',
    icon: <InternationShift />,
    title: 'International Wire',
    subtitle: 'Global SWIFT Transfers',
    timing: '1 Day',
    description: 'Same day (before 4pm EST) / Overnight (after 10am EST)',
  },
  {
    id: 'crypto' as TransferMethod,
    iconBgColor: 'bg-purple-100',
    icon: <CryptoTransfer />,
    title: 'Crypto Transfers',
    subtitle: 'Send to Crypto Wallets',
    timing: 'Instant',
    description: 'Direct USDT/USDC/BTC transfer - processed instantly on blockchain',
  },
];

export default function SendMoneyPage() {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<TransferMethod>('domestic');
  const [amount, setAmount] = useState('55.00');
  const [recipientName, setRecipientName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankCode, setBankCode] = useState(''); // Routing or SWIFT
  const [country, setCountry] = useState('US');
  const [agreed, setAgreed] = useState(false);
  const [showBalance, setShowBalance] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [walletBalances, setWalletBalances] = useState<WalletBalance[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState('USDC');
  const [balancesLoading, setBalancesLoading] = useState(true);
  const toast = useToast();

  // Fetch wallet balances on mount
  useEffect(() => {
    async function fetchBalances() {
      try {
        setBalancesLoading(true);
        const wallets = await clientApi.wallets.list();
        setWalletBalances(wallets);

        // Auto-select currency with highest balance
        if (wallets.length > 0) {
          const sortedWallets = [...wallets].sort((a, b) => b.balance - a.balance);
          setSelectedCurrency(sortedWallets[0].currency);
        }
      } catch (err) {
        console.error('Failed to fetch wallet balances:', err);
      } finally {
        setBalancesLoading(false);
      }
    }
    fetchBalances();
  }, []);

  const showOutputCurrency = selectedMethod === 'international';

  // Get available balance for selected currency
  const getSelectedBalance = () => {
    const wallet = walletBalances.find(w => w.currency === selectedCurrency);
    return wallet ? wallet.balance : 0;
  };

  const getFormattedBalance = () => {
    const wallet = walletBalances.find(w => w.currency === selectedCurrency);
    return wallet ? `${wallet.formattedBalance}` : '0.00';
  };

  // Build currency options from wallet balances
  const currencyOptions = walletBalances.length > 0
    ? walletBalances.map(w => ({
        value: w.currency,
        label: `💵 ${w.currency} ($${w.balance.toFixed(2)})`
      }))
    : [
        { value: 'USDC', label: '💵 USDC' },
        { value: 'USDT', label: '💵 USDT' },
      ];

  const handleSubmit = async () => {
    // Guard against multiple submissions
    if (loading || success) {
      console.log('[Send] Ignoring duplicate submission');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Basic validation
      if (!amount || parseFloat(amount) <= 0) throw new Error('Invalid amount');
      if (!recipientName) throw new Error('Recipient Name is required');
      if (!accountNumber) throw new Error('Account Number/Wallet Address is required');

      // Check balance before proceeding
      if (parseFloat(amount) > getSelectedBalance()) {
        throw new Error(`Insufficient ${selectedCurrency} balance. Available: $${getSelectedBalance().toFixed(2)}`);
      }

      // Determine bank details based on method
      let bankName = 'Unknown Bank';
      if (selectedMethod === 'domestic') bankName = 'US Domestic Bank';
      if (selectedMethod === 'international') bankName = 'International Bank';
      if (selectedMethod === 'crypto') bankName = 'Crypto Wallet';

      console.log('[Send] Submitting payout request:', { amount, selectedCurrency, recipientName });

      const response = await clientApi.payouts.create({
        amount: parseFloat(amount),
        sourceCurrency: selectedCurrency,
        destinationCurrency: showOutputCurrency ? 'EUR' : selectedCurrency, // Default to EUR for international demo
        recipientName,
        accountNumber,
        bankName,
        bankCode: bankCode || (selectedMethod === 'domestic' ? '021000021' : 'CHASUS33'),
        country: selectedMethod === 'domestic' ? 'US' : country,
        accountType: 'checking',
      });

      console.log('[Send] Payout response:', response);

      setSuccess(true);
      toast.success('Transfer Submitted!', `Your transfer of ${amount} ${selectedCurrency} to ${recipientName} has been submitted for processing.`);
      // Optional: Redirect after delay
      setTimeout(() => {
        router.push('/transactions');
      }, 2000);
    } catch (err: any) {
      console.error('Payout error:', err);
      setError(err.message || 'Failed to process transfer');
      toast.error('Transfer Failed', err.message || 'Failed to process transfer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getFeesData = () => {
    // Simplified fee logic for demo
    if (selectedMethod === 'crypto') {
      return {
        recipientGets: `${amount} ${selectedCurrency}`,
        rate: '1:1',
        showFees: false,
      };
    } else if (selectedMethod === 'domestic') {
      const fees = 25.0;
      const total = parseFloat(amount || '0') + fees;
      return {
        recipientGets: `${amount} USD`,
        rate: `0.9900 ${selectedCurrency}/USD`,
        quoteRate: '0.9900',
        fxFee: '$0.43 USD',
        wireFeeLabel: 'Fed/Wire Fee',
        wireFee: '$25.00 USD',
        totalFees: `$${fees + 0.43} USD`,
        showFees: true,
      };
    } else {
      // International
      const fees = 30.0;
      return {
        recipientGets: `€${(parseFloat(amount || '0') * 0.85).toFixed(2)} EUR`,
        rate: `0.8572 EUR/${selectedCurrency}`,
        quoteRate: '0.8572',
        fxFee: '$0.83 USD',
        wireFeeLabel: 'SWIFT Fee',
        wireFee: '$30.00 USD',
        totalFees: `$${fees + 0.83} USD`,
        showFees: true,
      };
    }
  };

  const feesData = getFeesData();

  return (
    <>
      {success && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
          <div className='rounded-xl bg-white p-8 text-center shadow-xl'>
            <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100'>
              <svg
                className='h-8 w-8 text-green-600'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M5 13l4 4L19 7'
                />
              </svg>
            </div>
            <h3 className='text-xl font-bold text-gray-900'>Transfer Successful!</h3>
            <p className='mt-2 text-gray-600'>Your transfer has been initiated.</p>
            <p className='mt-1 text-sm text-gray-500'>Redirecting to transactions...</p>
          </div>
        </div>
      )}

      {error && (
        <div className='mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700'>
          {error}
        </div>
      )}

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
        {/* LEFT SIDE - Transfer Method Cards + Form */}
        <div className='space-y-6 lg:col-span-2'>
          {/* Method Selection */}
          <div className='grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3'>
            {TRANSFER_METHODS.map(method => (
              <TransferMethodCard
                key={method.id}
                id={method.id}
                icon={method.icon}
                title={method.title}
                subtitle={method.subtitle}
                timing={method.timing}
                iconBgColor={method.iconBgColor}
                description={method.description}
                isSelected={selectedMethod === method.id}
                onClick={() => setSelectedMethod(method.id)}
              />
            ))}
          </div>

          {/* Form */}
          <div className='rounded-lg border border-gray-200 bg-white p-6'>
            <h2 className='mb-6 text-lg font-semibold text-gray-900'>Transfer Details</h2>

            <div className='space-y-4'>
              {/* Recipient Details */}
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <FormInput
                  label='Recipient Name'
                  value={recipientName}
                  onChange={setRecipientName}
                  placeholder='Enter full name'
                  required
                />
                <FormInput
                  label={selectedMethod === 'crypto' ? 'Wallet Address' : 'Account Number'}
                  value={accountNumber}
                  onChange={setAccountNumber}
                  placeholder={selectedMethod === 'crypto' ? '0x...' : '1234567890'}
                  required
                />
              </div>

              {selectedMethod !== 'crypto' && (
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <FormInput
                    label={selectedMethod === 'domestic' ? 'Routing Number' : 'SWIFT/BIC Code'}
                    value={bankCode}
                    onChange={setBankCode}
                    placeholder={selectedMethod === 'domestic' ? '021...' : 'CHAS...'}
                  />
                  {selectedMethod === 'international' && (
                    <div className='flex flex-col gap-1.5'>
                      <label className='text-sm font-medium text-gray-700'>Country</label>
                      <select
                        className='h-[42px] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none'
                        value={country}
                        onChange={e => setCountry(e.target.value)}
                      >
                        <option value='US'>United States</option>
                        <option value='GB'>United Kingdom</option>
                        <option value='IN'>India</option>
                        <option value='MX'>Mexico</option>
                        <option value='CA'>Canada</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Amount & Currency */}
              <div
                className={`grid grid-cols-1 ${showOutputCurrency ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}
              >
                <FormInput
                  label='Amount'
                  type='number'
                  value={amount}
                  onChange={setAmount}
                  placeholder='0.00'
                  required
                />

                <FormSelect
                  label='Source Currency'
                  value={selectedCurrency}
                  onChange={setSelectedCurrency}
                  options={currencyOptions}
                  required
                  disabled={balancesLoading || walletBalances.length === 0}
                />

                {showOutputCurrency && (
                  <FormSelect
                    label='Output Currency'
                    value='EUR'
                    options={[
                      { value: 'EUR', label: 'EUR' },
                      { value: 'GBP', label: 'GBP' },
                      { value: 'USD', label: 'USD' },
                    ]}
                    required
                  />
                )}
              </div>

              {/* Balance */}
              <div className='flex items-center gap-2 text-sm'>
                <span className='text-gray-600'>Available Balance:</span>
                <span className='font-semibold text-gray-900'>
                  {balancesLoading
                    ? 'Loading...'
                    : showBalance
                      ? `${getFormattedBalance()} ${selectedCurrency}`
                      : `••••••••• ${selectedCurrency}`}
                </span>
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className='cursor-pointer text-blue-600 hover:text-blue-700'
                >
                  {showBalance ? <Eye className='h-4 w-4' /> : <EyeOff className='h-4 w-4' />}
                </button>
              </div>

              {/* Note */}
              <div>
                <label className='mb-2 block text-sm font-medium text-gray-700'>
                  Note (Optional)
                </label>
                <textarea
                  rows={3}
                  className='w-full resize-none rounded-lg border border-gray-300 px-4 py-3 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-700'
                  placeholder='Payment reference or note'
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - Transfer Summary */}
        <div className='lg:col-span-2 xl:col-span-1'>
          <div className='sticky rounded-lg border border-gray-200 bg-white p-6'>
            <h2 className='mb-5 text-lg font-semibold text-gray-900'>Transfer Summary</h2>

            <SummaryItem
              label='Transfer Method'
              value={TRANSFER_METHODS.find(m => m.id === selectedMethod)?.title || ''}
              icon={TRANSFER_METHODS.find(m => m.id === selectedMethod)?.icon}
            />
            <hr className='my-4' />

            <SummaryItem
              label='Recipient'
              value={recipientName || 'Not entered'}
              subtext={[
                selectedMethod === 'crypto' ? 'Crypto Wallet' : bankCode || 'Bank Transfer',
                accountNumber || '...',
              ]}
            />
            <hr className='my-4' />
            <SummaryItem
              label='Source Currency'
              value={`${selectedCurrency} ${amount}`}
              valueStyle={{ fontWeight: 600 }}
            />
            <hr className='my-4' />
            <SummaryItem
              label='Recipient Gets'
              value={feesData.recipientGets}
              subtext={feesData.rate !== '1:1' ? `Rate: ${feesData.rate}` : undefined}
              valueStyle={{
                fontSize: '1.125rem',
                fontWeight: 700,
                color: 'var(--color-success-green)',
              }}
            />

            {feesData.showFees && (
              <FeeBreakdown
                quotedRate={feesData.quoteRate || ''}
                fxFee={feesData.fxFee || ''}
                wireFeeLabel={feesData.wireFeeLabel || ''}
                wireFee={feesData.wireFee || ''}
                totalFees={feesData.totalFees || ''}
              />
            )}

            {!feesData.showFees && (
              <div className='mb-6 border-t border-gray-200 pt-4'>
                <p className='text-sm text-gray-600 italic'>No fees for crypto transfers</p>
              </div>
            )}

            <label className='mb-4 flex cursor-pointer items-center gap-2'>
              <input
                type='checkbox'
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className='h-4 w-4 cursor-pointer'
              />
              <span className='text-xs text-gray-600'>
                I agree to the terms and conditions and update details
              </span>
            </label>

            <button
              disabled={!agreed || loading || !recipientName || !accountNumber}
              onClick={handleSubmit}
              className={`flex w-full items-center justify-center gap-2 rounded-lg py-3 font-medium transition-colors ${
                agreed && !loading && recipientName && accountNumber
                  ? 'bg-gradient-blue cursor-pointer text-white hover:bg-blue-700'
                  : 'cursor-not-allowed bg-gray-200 text-gray-400'
              }`}
            >
              {loading && <Loader2 className='h-4 w-4 animate-spin' />}
              {loading ? 'Processing...' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
