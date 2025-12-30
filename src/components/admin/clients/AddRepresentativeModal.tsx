'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { adminClientApi } from '@/lib/api/admin-client';
import { Plus, Loader2 } from 'lucide-react';
import React, { useState } from 'react';

interface AddRepresentativeModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  onSuccess?: () => void;
}

export function AddRepresentativeModal({ isOpen, onClose, clientId, onSuccess }: AddRepresentativeModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    dob: '',
    phoneCountry: 'US',
    phoneNumber: '',
    title: '',
    ownershipPercentage: '',
    employmentStatus: '',
    occupation: '',
    employer: '',
    annualIncome: '',
    taxId: '',
    sourceOfFunds: '',
    sourceOfWealth: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    return
  }

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setIsSubmitting(true);
  //   setError(null);

  //   try {
  //     // Prepare the data for API submission
  //     const submissionData = {
  //       firstName: formData.firstName,
  //       lastName: formData.lastName,
  //       email: formData.email,
  //       dob: formData.dob,
  //       phoneCountry: formData.phoneCountry,
  //       phoneNumber: formData.phoneNumber,
  //       title: formData.title,
  //       ownershipPercentage: parseFloat(formData.ownershipPercentage) || 0,
  //       employmentStatus: formData.employmentStatus,
  //       occupation: formData.occupation,
  //       employer: formData.employer,
  //       annualIncome: formData.annualIncome,
  //       taxId: formData.taxId,
  //       sourceOfFunds: formData.sourceOfFunds,
  //       sourceOfWealth: formData.sourceOfWealth,
  //     };

  //     // const response = await adminClientApi.addRepresentative(clientId, submissionData);

  //     if (response.success) {
  //       // Reset form
  //       setFormData({
  //         firstName: '',
  //         lastName: '',
  //         email: '',
  //         dob: '',
  //         phoneCountry: 'US',
  //         phoneNumber: '',
  //         title: '',
  //         ownershipPercentage: '',
  //         employmentStatus: '',
  //         occupation: '',
  //         employer: '',
  //         annualIncome: '',
  //         taxId: '',
  //         sourceOfFunds: '',
  //         sourceOfWealth: '',
  //       });

  //       // Call onSuccess callback if provided
  //       if (onSuccess) {
  //         onSuccess();
  //       }

  //       onClose();
  //     } else {
  //       setError(response.error || 'Failed to add representative');
  //     }
  //   } catch (error: any) {
  //     console.error('Error adding representative:', error);
  //     setError(error.message || 'An unexpected error occurred');
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

  const employmentStatusOptions = [
    { value: 'employed', label: 'Employed' },
    { value: 'self_employed', label: 'Self Employed' },
    { value: 'unemployed', label: 'Unemployed' },
    { value: 'retired', label: 'Retired' },
  ];

  const annualIncomeOptions = [
    { value: 'under_50k', label: 'Under $50,000' },
    { value: '50k_100k', label: '$50,000 - $100,000' },
    { value: '100k_200k', label: '$100,000 - $200,000' },
    { value: 'over_200k', label: 'Over $200,000' },
  ];

  const sourceOfFundsOptions = [
    { value: 'salary', label: 'Salary' },
    { value: 'savings', label: 'Savings' },
    { value: 'inheritance', label: 'Inheritance' },
    { value: 'investment', label: 'Investment' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Add Representative' size='lg' className='p-0'>
      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Basic Information Section */}
        <div className='space-y-2 mb-4'>
          <h3 className='text-base font-semibold text-gray-900'>Basic Information</h3>
          <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
            <div className='space-y-1.5'>
              <label className='text-sm font-medium text-gray-700'>
                First Name <span className='text-red-500'>*</span>
              </label>
              <Input
                placeholder='Enter first name'
                value={formData.firstName}
                onChange={e => handleChange('firstName', e.target.value)}
                required
              />
            </div>
            <div className='space-y-1.5'>
              <label className='text-sm font-medium text-gray-700'>
                Last Name <span className='text-red-500'>*</span>
              </label>
              <Input
                placeholder='Enter last name'
                value={formData.lastName}
                onChange={e => handleChange('lastName', e.target.value)}
                required
              />
            </div>
          </div>

          <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
            <div className='space-y-1.5'>
              <label className='text-sm font-medium text-gray-700'>
                Email <span className='text-red-500'>*</span>
              </label>
              <Input
                type='email'
                placeholder='Enter email'
                value={formData.email}
                onChange={e => handleChange('email', e.target.value)}
                required
              />
            </div>
            <div className='space-y-1.5'>
              <label className='text-sm font-medium text-gray-700'>
                Date of Birth <span className='text-red-500'>*</span>
              </label>
              <Input
                type='date'
                placeholder='dd-mm-yyyy'
                value={formData.dob}
                onChange={e => handleChange('dob', e.target.value)}
                required
              />
            </div>
          </div>

          <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
            <div className='space-y-1.5'>
              <label className='text-sm font-medium text-gray-700'>Phone</label>
              <div className='flex gap-2'>
                <Select
                  value={formData.phoneCountry}
                  onChange={val => handleChange('phoneCountry', val)}
                  options={[
                    { value: 'US', label: 'US' },
                    { value: 'GB', label: 'UK' },
                    { value: 'CA', label: 'CA' },
                  ]}
                  className='w-24 shrink-0'
                />
                <Input
                  placeholder='Enter phone number'
                  value={formData.phoneNumber}
                  onChange={e => handleChange('phoneNumber', e.target.value)}
                />
              </div>
            </div>
            <div className='space-y-1.5'>
              <label className='text-sm font-medium text-gray-700'>Title</label>
              <Input
                placeholder='Enter title'
                value={formData.title}
                onChange={e => handleChange('title', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Ownership & Employment Section */}
        <div className='space-y-2 pb-3 mb-1'>
          <h3 className='border-t border-gray-100 pt-2 text-base font-semibold text-gray-900 pb-2'>
            Ownership & Employment (for USD Banking)
          </h3>
          <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
            <div className='space-y-1.5'>
              <label className='text-sm font-medium text-gray-700'>
                Ownership Percentage <span className='text-red-500'>*</span>
              </label>
              <Input
                placeholder='e.g. 25'
                value={formData.ownershipPercentage}
                onChange={e => handleChange('ownershipPercentage', e.target.value)}
                required
              />
            </div>
            <div className='space-y-1.5'>
              <label className='text-sm font-medium text-gray-700'>Employment Status</label>
              <Select
                value={formData.employmentStatus}
                onChange={val => handleChange('employmentStatus', val)}
                options={employmentStatusOptions}
                placeholder='Select Status'
              />
            </div>
          </div>

          <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
            <div className='space-y-1.5'>
              <label className='text-sm font-medium text-gray-700'>
                Occupation <span className='text-red-500'>*</span>
              </label>
              <Input
                placeholder='e.g. CEO, CFO, Director'
                value={formData.occupation}
                onChange={e => handleChange('occupation', e.target.value)}
                required
              />
            </div>
            <div className='space-y-1.5'>
              <label className='text-sm font-medium text-gray-700'>Employer</label>
              <Input
                placeholder='Enter company name'
                value={formData.employer}
                onChange={e => handleChange('employer', e.target.value)}
              />
            </div>
          </div>

          <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
            <div className='space-y-1.5'>
              <label className='text-sm font-medium text-gray-700'>Annual Income</label>
              <Select
                value={formData.annualIncome}
                onChange={val => handleChange('annualIncome', val)}
                options={annualIncomeOptions}
                placeholder='Select Range'
              />
            </div>
            <div className='space-y-1.5'>
              <label className='text-sm font-medium text-gray-700'>Tax ID / SSN</label>
              <Input
                placeholder='XXX-XX-XXXX'
                value={formData.taxId}
                onChange={e => handleChange('taxId', e.target.value)}
              />
            </div>
          </div>

          <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
            <div className='space-y-1.5'>
              <label className='text-sm font-medium text-gray-700'>Source of Funds</label>
              <Select
                value={formData.sourceOfFunds}
                onChange={val => handleChange('sourceOfFunds', val)}
                options={sourceOfFundsOptions}
                placeholder='Select Source'
              />
            </div>
            <div className='space-y-1.5'>
              <label className='text-sm font-medium text-gray-700'>Source of Wealth</label>
              <Select
                value={formData.sourceOfWealth}
                onChange={val => handleChange('sourceOfWealth', val)}
                options={sourceOfFundsOptions}
                placeholder='Select Source'
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className='pt-4'>
          {error && (
            <div className='mb-4 rounded-lg border border-red-200 bg-red-50 p-4'>
              <p className='text-sm text-red-600'>{error}</p>
            </div>
          )}
          <Button
            type='submit'
            disabled={isSubmitting}
            className='bg-gradient-blue flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl font-normal text-white transition-all hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isSubmitting ? (
              <Loader2 className='h-5 w-5 animate-spin' />
            ) : (
              <Plus className='h-5 w-5' />
            )}
            {isSubmitting ? 'Adding Representative...' : 'Add Representative'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
