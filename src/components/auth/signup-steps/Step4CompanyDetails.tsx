'use client';

import { FormInput } from '@/components/auth/FormInput';
import { useToast } from '@/components/ui/Toast';
import { companyDetailsSchema, getFirstError } from '@/lib/validations/auth';
import Link from 'next/link';
import React, { useState } from 'react';

interface Step4Props {
  formData: any;
  updateFormData: (data: any) => void;
  onNext: () => void;
}

export function Step4CompanyDetails({ formData, updateFormData, onNext }: Step4Props) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const toast = useToast();

  const businessTypes = ['Company', 'Fintech', 'Manufacturer', 'Importer/Exporter', 'Other'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    // Validate with Zod
    const result = companyDetailsSchema.safeParse({
      city: formData.city,
      country: formData.country,
      pincode: formData.pincode,
      businessType: formData.businessType,
    });

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        const field = err.path[0] as string;
        if (!errors[field]) {
          errors[field] = err.message;
        }
      });
      setFieldErrors(errors);
      toast.error('Validation Error', getFirstError(result.error));
      return;
    }

    onNext();
  };

  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-6' noValidate>
      <div className='space-y-4'>
        <div>
          <FormInput
            icon='building'
            placeholder='City'
            value={formData.city}
            onChange={e => {
              updateFormData({ city: e.target.value });
              clearFieldError('city');
            }}
          />
          {fieldErrors.city && <p className='mt-1 text-xs text-red-500'>{fieldErrors.city}</p>}
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <div>
            <FormInput
              icon='globe'
              placeholder='Country'
              value={formData.country}
              onChange={e => {
                updateFormData({ country: e.target.value });
                clearFieldError('country');
              }}
            />
            {fieldErrors.country && (
              <p className='mt-1 text-xs text-red-500'>{fieldErrors.country}</p>
            )}
          </div>
          <div>
            <FormInput
              icon='map'
              placeholder='Pincode'
              value={formData.pincode}
              onChange={e => {
                updateFormData({ pincode: e.target.value });
                clearFieldError('pincode');
              }}
            />
            {fieldErrors.pincode && (
              <p className='mt-1 text-xs text-red-500'>{fieldErrors.pincode}</p>
            )}
          </div>
        </div>
      </div>

      <div className='space-y-3'>
        <label className='block text-sm font-medium text-gray-700'>What best describes you?</label>
        <div className='space-y-2'>
          {businessTypes.map(type => (
            <label
              key={type}
              className={`flex cursor-pointer items-center rounded-lg border p-3 transition-colors ${
                formData.businessType === type
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type='radio'
                name='businessType'
                value={type}
                checked={formData.businessType === type}
                onChange={e => {
                  updateFormData({ businessType: e.target.value });
                  clearFieldError('businessType');
                }}
                className='h-4 w-4 border-gray-300 text-blue-600 accent-blue-600 focus:ring-blue-500 focus:ring-offset-0'
              />
              <span className='ml-3 text-sm text-gray-700'>{type}</span>
            </label>
          ))}
        </div>
        {fieldErrors.businessType && (
          <p className='mt-1 text-xs text-red-500'>{fieldErrors.businessType}</p>
        )}
      </div>

      <button
        type='submit'
        className='h-11 w-full cursor-pointer rounded-[10px] bg-gradient-to-b from-[#588CFF] to-[#2462EB] font-medium text-white transition-all hover:opacity-90'
      >
        Continue
      </button>

      <div className='mt-4 text-center'>
        <p className='text-sm text-gray-600'>
          Already have an account?{' '}
          <Link href='/login' className='font-medium text-blue-600 hover:text-blue-700'>
            Login
          </Link>
        </p>
      </div>
    </form>
  );
}
