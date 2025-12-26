'use client';

import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Tabs } from '@/components/ui/Tabs';
import { Globe, Home, Wallet } from 'lucide-react';
import { useState } from 'react';

interface AddRecipientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export function AddRecipientModal({ isOpen, onClose, onSubmit }: AddRecipientModalProps) {
  const [activeTab, setActiveTab] = useState('domestic');

  const bankOptions = [
    { value: 'Bank of America', label: 'Bank of America' },
    { value: 'Chase', label: 'Chase' },
    { value: 'Wells Fargo', label: 'Wells Fargo' },
    { value: 'Citibank', label: 'Citibank' },
  ];

  const coinTypeOptions = [
    { value: 'USDT', label: 'USDT' },
    { value: 'USDC', label: 'USDC' },
    { value: 'BTC', label: 'BTC' },
    { value: 'ETH', label: 'ETH' },
  ];

  const currencyOptions = [
    { value: 'USD', label: 'USD' },
    { value: 'EUR', label: 'EUR' },
    { value: 'GBP', label: 'GBP' },
    { value: 'CAD', label: 'CAD' },
  ];

  const blockchainNetworkOptions = [
    { value: 'TRC-20', label: 'TRC-20' },
    { value: 'ERC-20', label: 'ERC-20' },
    { value: 'BEP-20', label: 'BEP-20' },
    { value: 'SOL', label: 'SOL' },
  ];

  const [formData, setFormData] = useState({
    // Domestic fields
    fullName: '',
    currency: 'USD',
    purpose: 'internal',
    bankName: '',
    wireRoutingNumber: '',
    accountNumber: '',
    bankAddress: '',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    // International fields
    swiftCode: '',
    iban: '',
    // Crypto fields
    coinType: 'USDT',
    blockchainNetwork: 'TRC-20',
    walletAddress: '',
  });

  const tabs = [
    {
      id: 'domestic',
      label: 'Domestic',
      icon: <Home className='h-4 w-4' />,
      activeColor: 'bg-gradient-blue',
    },
    {
      id: 'international',
      label: 'International',
      icon: <Globe className='h-4 w-4' />,
      activeColor: 'bg-gradient-green',
    },
    {
      id: 'crypto',
      label: 'Crypto',
      icon: <Wallet className='h-4 w-4' />,
      activeColor: 'bg-gradient-purple',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, type: activeTab });
    onClose();
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Add New Recipient' size='2xl'>
      <form onSubmit={handleSubmit}>
        {/* Tabs */}
        <div className='mb-6'>
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} fullWidth />
        </div>

        {/* Domestic Tab */}
        {activeTab === 'domestic' && (
          <div className='space-y-4'>
            {/* Two Column Layout - Personal Info & Bank Details */}
            <div className='grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 lg:grid-cols-2'>
              {/* Left Column - Personal Information */}
              <div className='space-y-4 border-r border-gray-200 pr-4'>
                <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
                  {/* Full Name */}
                  <div>
                    <label className='mb-2 block text-sm font-medium text-gray-700'>
                      Full Name
                    </label>
                    <input
                      type='text'
                      value={formData.fullName}
                      onChange={e => handleChange('fullName', e.target.value)}
                      placeholder='John Smith'
                      className='w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none'
                    />
                  </div>

                  {/* Currency */}
                  <div>
                    <label className='mb-2 block text-sm font-medium text-gray-700'>Currency</label>
                    <div className='relative'>
                      <Select
                        options={currencyOptions}
                        value={formData.currency}
                        onChange={value => handleChange('currency', value)}
                      />
                    </div>
                  </div>
                </div>
                {/* Purpose of Transaction */}
                <div>
                  <label className='mb-3 block text-sm font-medium text-gray-700'>
                    Purpose of Transaction
                  </label>
                  <div className='flex flex-wrap gap-3'>
                    <label className='flex cursor-pointer items-center rounded-lg border border-gray-300 px-4 py-2.5 transition-colors hover:border-gray-400'>
                      <input
                        type='radio'
                        name='purpose'
                        value='internal'
                        checked={formData.purpose === 'internal'}
                        onChange={e => handleChange('purpose', e.target.value)}
                        className='h-4 w-4 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:outline-none'
                      />
                      <span className='ml-2.5 text-sm text-gray-700'>Internal Transfer</span>
                    </label>
                    <label className='flex cursor-pointer items-center rounded-lg border border-gray-300 px-4 py-2.5 transition-colors hover:border-gray-400'>
                      <input
                        type='radio'
                        name='purpose'
                        value='client'
                        checked={formData.purpose === 'client'}
                        onChange={e => handleChange('purpose', e.target.value)}
                        className='h-4 w-4 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:outline-none'
                      />
                      <span className='ml-2.5 text-sm text-gray-700'>Client</span>
                    </label>
                    <label className='flex cursor-pointer items-center rounded-lg border border-gray-300 px-4 py-2.5 transition-colors hover:border-gray-400'>
                      <input
                        type='radio'
                        name='purpose'
                        value='supplier'
                        checked={formData.purpose === 'supplier'}
                        onChange={e => handleChange('purpose', e.target.value)}
                        className='h-4 w-4 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:outline-none'
                      />
                      <span className='ml-2.5 text-sm text-gray-700'>Supplier</span>
                    </label>
                    <label className='flex cursor-pointer items-center rounded-lg border border-gray-300 px-4 py-2.5 transition-colors hover:border-gray-400'>
                      <input
                        type='radio'
                        name='purpose'
                        value='serviceProvider'
                        checked={formData.purpose === 'serviceProvider'}
                        onChange={e => handleChange('purpose', e.target.value)}
                        className='h-4 w-4 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:outline-none'
                      />
                      <span className='ml-2.5 text-sm text-gray-700'>Service Provider</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Column - Bank Details */}
              <div className='space-y-4'>
                <h3 className='text-sm font-semibold text-gray-900'>Bank Details</h3>

                <div className='grid grid-cols-2 gap-4'>
                  {/* Bank Name */}
                  <div>
                    <label className='mb-2 block text-sm font-medium text-gray-700'>
                      Bank Name
                    </label>
                    <Select
                      options={bankOptions}
                      value={formData.bankName}
                      onChange={value => handleChange('bankName', value)}
                      placeholder='Choose Bank'
                    />
                  </div>

                  {/* Wire Routing Number */}
                  <div>
                    <label className='mb-2 block text-sm font-medium text-gray-700'>
                      Wire Routing Number
                    </label>
                    <input
                      type='text'
                      value={formData.wireRoutingNumber}
                      onChange={e => handleChange('wireRoutingNumber', e.target.value)}
                      placeholder='021000021'
                      className='w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none'
                    />
                  </div>

                  {/* Account Number */}
                  <div>
                    <label className='mb-2 block text-sm font-medium text-gray-700'>
                      Account Number
                    </label>
                    <input
                      type='text'
                      value={formData.accountNumber}
                      onChange={e => handleChange('accountNumber', e.target.value)}
                      placeholder='1234567890'
                      className='w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none'
                    />
                  </div>

                  {/* Bank Address */}
                  <div>
                    <label className='mb-2 block text-sm font-medium text-gray-700'>
                      Bank Address
                    </label>
                    <input
                      type='text'
                      value={formData.bankAddress}
                      onChange={e => handleChange('bankAddress', e.target.value)}
                      placeholder='123 Bank Street City, State 12345'
                      className='w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none'
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Recipient Address Section */}
            <div className='space-y-4 border-t border-gray-200 pt-4'>
              <h3 className='text-sm font-semibold text-gray-900'>Recipient Address</h3>

              {/* Street Address */}
              <div>
                <label className='mb-2 block text-sm font-medium text-gray-700'>
                  Street Address
                </label>
                <input
                  type='text'
                  value={formData.streetAddress}
                  onChange={e => handleChange('streetAddress', e.target.value)}
                  placeholder='123 Main Street'
                  className='w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none'
                />
              </div>

              {/* City and State */}
              <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
                <div>
                  <label className='mb-2 block text-sm font-medium text-gray-700'>City</label>
                  <input
                    type='text'
                    value={formData.city}
                    onChange={e => handleChange('city', e.target.value)}
                    placeholder='New York'
                    className='w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none'
                  />
                </div>
                <div>
                  <label className='mb-2 block text-sm font-medium text-gray-700'>State</label>
                  <input
                    type='text'
                    value={formData.state}
                    onChange={e => handleChange('state', e.target.value)}
                    placeholder='NY'
                    className='w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none'
                  />
                </div>
              </div>

              {/* Zip Code and Country */}
              <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
                <div>
                  <label className='mb-2 block text-sm font-medium text-gray-700'>Zip Code</label>
                  <input
                    type='text'
                    value={formData.zipCode}
                    onChange={e => handleChange('zipCode', e.target.value)}
                    placeholder='10001'
                    className='w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none'
                  />
                </div>
                <div>
                  <label className='mb-2 block text-sm font-medium text-gray-700'>Country</label>
                  <input
                    type='text'
                    value={formData.country}
                    onChange={e => handleChange('country', e.target.value)}
                    placeholder='United States'
                    className='w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none'
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* International Tab */}
        {activeTab === 'international' && (
          <div className='space-y-4'>
            {/* Two Column Layout - Personal Info & Bank Details */}
            <div className='grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 lg:grid-cols-2'>
              {/* Left Column - Personal Information */}
              <div className='space-y-4 border-r border-gray-200 pr-4'>
                <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
                  {/* Full Name */}
                  <div>
                    <label className='mb-2 block text-sm font-medium text-gray-700'>
                      Full Name
                    </label>
                    <input
                      type='text'
                      value={formData.fullName}
                      onChange={e => handleChange('fullName', e.target.value)}
                      placeholder='John Smith'
                      className='w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none'
                    />
                  </div>

                  {/* Currency */}
                  <div>
                    <label className='mb-2 block text-sm font-medium text-gray-700'>Currency</label>
                    <div className='relative'>
                      <Select
                        options={currencyOptions}
                        value={formData.currency}
                        onChange={value => handleChange('currency', value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Purpose of Transaction */}
                <div>
                  <label className='mb-3 block text-sm font-medium text-gray-700'>
                    Purpose of Transaction
                  </label>
                  <div className='flex flex-wrap gap-3'>
                    <label className='flex cursor-pointer items-center rounded-lg border border-gray-300 px-4 py-2.5 transition-colors hover:border-gray-400'>
                      <input
                        type='radio'
                        name='purpose'
                        value='internal'
                        checked={formData.purpose === 'internal'}
                        onChange={e => handleChange('purpose', e.target.value)}
                        className='h-4 w-4 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:outline-none'
                      />
                      <span className='ml-2.5 text-sm text-gray-700'>Internal Transfer</span>
                    </label>
                    <label className='flex cursor-pointer items-center rounded-lg border border-gray-300 px-4 py-2.5 transition-colors hover:border-gray-400'>
                      <input
                        type='radio'
                        name='purpose'
                        value='client'
                        checked={formData.purpose === 'client'}
                        onChange={e => handleChange('purpose', e.target.value)}
                        className='h-4 w-4 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:outline-none'
                      />
                      <span className='ml-2.5 text-sm text-gray-700'>Client</span>
                    </label>
                    <label className='flex cursor-pointer items-center rounded-lg border border-gray-300 px-4 py-2.5 transition-colors hover:border-gray-400'>
                      <input
                        type='radio'
                        name='purpose'
                        value='supplier'
                        checked={formData.purpose === 'supplier'}
                        onChange={e => handleChange('purpose', e.target.value)}
                        className='h-4 w-4 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:outline-none'
                      />
                      <span className='ml-2.5 text-sm text-gray-700'>Supplier</span>
                    </label>
                    <label className='flex cursor-pointer items-center rounded-lg border border-gray-300 px-4 py-2.5 transition-colors hover:border-gray-400'>
                      <input
                        type='radio'
                        name='purpose'
                        value='serviceProvider'
                        checked={formData.purpose === 'serviceProvider'}
                        onChange={e => handleChange('purpose', e.target.value)}
                        className='h-4 w-4 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:outline-none'
                      />
                      <span className='ml-2.5 text-sm text-gray-700'>Service Provider</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Column - Bank Details */}
              <div className='space-y-4'>
                <h3 className='text-sm font-semibold text-gray-900'>Bank Details</h3>

                <div className='grid grid-cols-2 gap-4'>
                  {/* Bank Name */}
                  <div>
                    <label className='mb-2 block text-sm font-medium text-gray-700'>
                      Bank Name
                    </label>
                    <Select
                      options={bankOptions}
                      value={formData.bankName}
                      onChange={value => handleChange('bankName', value)}
                      placeholder='Choose Bank'
                    />
                  </div>

                  {/* SWIFT Code */}
                  <div>
                    <label className='mb-2 block text-sm font-medium text-gray-700'>
                      SWIFT Code
                    </label>
                    <input
                      type='text'
                      value={formData.swiftCode}
                      onChange={e => handleChange('swiftCode', e.target.value)}
                      placeholder='HBUKGB4B'
                      className='w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none'
                    />
                  </div>

                  {/* IBAN */}
                  <div>
                    <label className='mb-2 block text-sm font-medium text-gray-700'>IBAN</label>
                    <input
                      type='text'
                      value={formData.iban}
                      onChange={e => handleChange('iban', e.target.value)}
                      placeholder='GB29 NWBK 6016 1331 9268 19'
                      className='w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none'
                    />
                  </div>

                  {/* Account Number */}
                  <div>
                    <label className='mb-2 block text-sm font-medium text-gray-700'>
                      Account Number
                    </label>
                    <input
                      type='text'
                      value={formData.accountNumber}
                      onChange={e => handleChange('accountNumber', e.target.value)}
                      placeholder='1234567890'
                      className='w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none'
                    />
                  </div>

                  {/* Bank Address - Full Width */}
                  <div className='col-span-2'>
                    <label className='mb-2 block text-sm font-medium text-gray-700'>
                      Bank Address
                    </label>
                    <input
                      type='text'
                      value={formData.bankAddress}
                      onChange={e => handleChange('bankAddress', e.target.value)}
                      placeholder='123 Bank Street City, State 12345'
                      className='w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none'
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Recipient Address Section */}
            <div className='space-y-4 border-t border-gray-200 pt-4'>
              <h3 className='text-sm font-semibold text-gray-900'>Recipient Address</h3>

              {/* Street Address */}
              <div>
                <label className='mb-2 block text-sm font-medium text-gray-700'>
                  Street Address
                </label>
                <input
                  type='text'
                  value={formData.streetAddress}
                  onChange={e => handleChange('streetAddress', e.target.value)}
                  placeholder='123 Main Street'
                  className='w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none'
                />
              </div>

              {/* City and State */}
              <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
                <div>
                  <label className='mb-2 block text-sm font-medium text-gray-700'>City</label>
                  <input
                    type='text'
                    value={formData.city}
                    onChange={e => handleChange('city', e.target.value)}
                    placeholder='New York'
                    className='w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none'
                  />
                </div>
                <div>
                  <label className='mb-2 block text-sm font-medium text-gray-700'>State</label>
                  <input
                    type='text'
                    value={formData.state}
                    onChange={e => handleChange('state', e.target.value)}
                    placeholder='NY'
                    className='w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none'
                  />
                </div>
              </div>

              {/* Zip Code and Country */}
              <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
                <div>
                  <label className='mb-2 block text-sm font-medium text-gray-700'>Zip Code</label>
                  <input
                    type='text'
                    value={formData.zipCode}
                    onChange={e => handleChange('zipCode', e.target.value)}
                    placeholder='10001'
                    className='w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none'
                  />
                </div>
                <div>
                  <label className='mb-2 block text-sm font-medium text-gray-700'>Country</label>
                  <input
                    type='text'
                    value={formData.country}
                    onChange={e => handleChange('country', e.target.value)}
                    placeholder='United States'
                    className='w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none'
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Crypto Tab */}
        {activeTab === 'crypto' && (
          <div className='space-y-4'>
            {/* Two Column Layout - Personal Info & Crypto Details */}
            <div className='grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 lg:grid-cols-2'>
              {/* Left Column - Personal Information */}
              <div className='space-y-4 border-r border-gray-200 pr-4'>
                {/* Full Name */}
                <div>
                  <label className='mb-2 block text-sm font-medium text-gray-700'>Full Name</label>
                  <input
                    type='text'
                    value={formData.fullName}
                    onChange={e => handleChange('fullName', e.target.value)}
                    placeholder='John Smith'
                    className='w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none'
                  />
                </div>

                {/* Purpose of Transaction */}
                <div>
                  <label className='mb-3 block text-sm font-medium text-gray-700'>
                    Purpose of Transaction
                  </label>
                  <div className='flex flex-wrap gap-3'>
                    <label className='flex cursor-pointer items-center rounded-lg border border-gray-300 px-4 py-2.5 transition-colors hover:border-gray-400'>
                      <input
                        type='radio'
                        name='purpose'
                        value='internal'
                        checked={formData.purpose === 'internal'}
                        onChange={e => handleChange('purpose', e.target.value)}
                        className='h-4 w-4 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:outline-none'
                      />
                      <span className='ml-2.5 text-sm text-gray-700'>Internal Transfer</span>
                    </label>
                    <label className='flex cursor-pointer items-center rounded-lg border border-gray-300 px-4 py-2.5 transition-colors hover:border-gray-400'>
                      <input
                        type='radio'
                        name='purpose'
                        value='client'
                        checked={formData.purpose === 'client'}
                        onChange={e => handleChange('purpose', e.target.value)}
                        className='h-4 w-4 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:outline-none'
                      />
                      <span className='ml-2.5 text-sm text-gray-700'>Client</span>
                    </label>
                    <label className='flex cursor-pointer items-center rounded-lg border border-gray-300 px-4 py-2.5 transition-colors hover:border-gray-400'>
                      <input
                        type='radio'
                        name='purpose'
                        value='supplier'
                        checked={formData.purpose === 'supplier'}
                        onChange={e => handleChange('purpose', e.target.value)}
                        className='h-4 w-4 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:outline-none'
                      />
                      <span className='ml-2.5 text-sm text-gray-700'>Supplier</span>
                    </label>
                    <label className='flex cursor-pointer items-center rounded-lg border border-gray-300 px-4 py-2.5 transition-colors hover:border-gray-400'>
                      <input
                        type='radio'
                        name='purpose'
                        value='serviceProvider'
                        checked={formData.purpose === 'serviceProvider'}
                        onChange={e => handleChange('purpose', e.target.value)}
                        className='h-4 w-4 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:outline-none'
                      />
                      <span className='ml-2.5 text-sm text-gray-700'>Service Provider</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Column - Crypto Details */}
              <div className='space-y-4'>
                <h3 className='text-sm font-semibold text-gray-900'>Crypto Details</h3>

                {/* Coin Type */}
                <div>
                  <label className='mb-2 block text-sm font-medium text-gray-700'>Coin Type</label>
                  <div className='relative'>
                    <Select
                      options={coinTypeOptions}
                      value={formData.coinType}
                      onChange={value => handleChange('coinType', value)}
                      placeholder='Choose Coin Type'
                    />
                  </div>
                </div>

                {/* Blockchain Network */}
                <div>
                  <label className='mb-2 block text-sm font-medium text-gray-700'>
                    Blockchain Network
                  </label>
                  <div className='relative'>
                    <Select
                      options={blockchainNetworkOptions}
                      value={formData.blockchainNetwork}
                      onChange={value => handleChange('blockchainNetwork', value)}
                      placeholder='Choose Blockchain Network'
                    />
                  </div>
                </div>

                {/* Wallet Address */}
                <div>
                  <label className='mb-2 block text-sm font-medium text-gray-700'>
                    Wallet Address
                  </label>
                  <input
                    type='text'
                    value={formData.walletAddress}
                    onChange={e => handleChange('walletAddress', e.target.value)}
                    placeholder='TLFmgA1vevqB5X9DoccmsLYEsWR28ooLe'
                    className='w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none'
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className='mt-6'>
          <button
            type='submit'
            className='bg-gradient-blue w-full cursor-pointer rounded-lg px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'
          >
            Add Recipient
          </button>
        </div>
      </form>
    </Modal>
  );
}
