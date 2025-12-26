'use client';

import { CryptocurrencyDeposit } from '@/components/deposit/CryptocurrencyDeposit';
import { DepositMethodCard, type DepositMethod } from '@/components/deposit/DepositMethodCard';
import { DomesticWireDeposit } from '@/components/deposit/DomesticWireDeposit';
import { EurSepaDeposit } from '@/components/deposit/EurSepaDeposit';
import { InternationalSwiftDeposit } from '@/components/deposit/InternationalSwiftDeposit';
import DollerIcon from '@/components/icons/DollarIcon';
import DomesticIcon from '@/components/icons/DomesticIcon';
import EuroIcon from '@/components/icons/EuroIcon';
import InternationShift from '@/components/icons/InternationShift';
import { ImportantNotes } from '@/components/ui/ImportantNotes';
import { useState } from 'react';

const depositMethods: DepositMethod[] = [
  {
    id: 'cryptocurrency',
    name: 'Cryptocurrency',
    subtitle: 'Instant Processing',
    icon: <DollerIcon />,
    iconBgColor: 'bg-purple-100',
    minAmount: '$1',
    noLimits: false,
    maxAmount: '$1',
    processingTime: '2 - 5 minutes',
  },
  {
    id: 'domestic-wire',
    name: 'Domestic U.S. Wire Deposit',
    subtitle: 'U.S.A. Banking',
    icon: <DomesticIcon />,
    iconBgColor: 'bg-blue-100',
    minAmount: '$50',
    noLimits: true,
    processingTime: 'Same Day',
  },
  {
    id: 'international-swift',
    name: 'International SWIFT',
    subtitle: 'Global Transfers',
    icon: <InternationShift />,
    iconBgColor: 'bg-green-100',
    minAmount: '$100',
    noLimits: false,
    maxAmount: '$100',
    processingTime: '1 Day',
  },
  {
    id: 'eur-sepa',
    name: 'EUR SEPA',
    subtitle: 'European Transfers',
    icon: <EuroIcon />,
    iconBgColor: 'bg-orange-100',
    minAmount: '$1',
    noLimits: false,
    maxAmount: '$1',
    processingTime: '2 - 5 minutes',
  },
];

export default function DepositPage() {
  const [selectedMethod, setSelectedMethod] = useState<string | null>('cryptocurrency');

  const renderDepositDetails = () => {
    switch (selectedMethod) {
      case 'cryptocurrency':
        return <CryptocurrencyDeposit />;
      case 'domestic-wire':
        return <DomesticWireDeposit />;
      case 'international-swift':
        return <InternationalSwiftDeposit />;
      case 'eur-sepa':
        return <EurSepaDeposit />;
      default:
        return null;
    }
  };

  // Define notes based on selected method
  const getImportantNotes = () => {
    switch (selectedMethod) {
      case 'cryptocurrency':
        return [
          'Only send USDT-TRC20 to this address',
          'Minimum deposit: $1',
          'Processing time: 2-5 minutes after network confirmation',
          'Network fees apply as per blockchain standards',
        ];
      case 'domestic-wire':
        return [
          'Minimum deposit: $50',
          'Processing time: Same Day',
          'Wire transfer fees may apply',
          'Ensure all bank details are correct before initiating transfer',
        ];
      case 'international-swift':
        return [
          'Minimum deposit: $100',
          'Maximum deposit: $100',
          'Processing time: 1 Day',
          'SWIFT fees may apply',
          'Ensure SWIFT/BIC code is correct',
        ];
      case 'eur-sepa':
        return [
          'Minimum deposit: $1',
          'Maximum deposit: $1',
          'Processing time: 2-5 minutes',
          'SEPA transfers are for EUR only',
        ];
      default:
        return [];
    }
  };

  return (
    <div className='space-y-6'>
      {/* Deposit Method Cards */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {depositMethods.map(method => (
          <DepositMethodCard
            key={method.id}
            method={method}
            isSelected={selectedMethod === method.id}
            onSelect={() => setSelectedMethod(method.id)}
          />
        ))}
      </div>

      {/* Deposit Details Section */}
      {selectedMethod && (
        <div className='rounded-xl border border-gray-200 bg-white p-4 sm:p-6'>
          <div className='space-y-6'>{renderDepositDetails()}</div>
        </div>
      )}

      {/* Important Notes at the bottom */}
      <ImportantNotes notes={getImportantNotes()} />
    </div>
  );
}
