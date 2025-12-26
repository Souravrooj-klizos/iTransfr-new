'use client';

import { FormInput } from '@/components/auth/FormInput';
import { useToast } from '@/components/ui/Toast';
import { getFirstError, signupStep1Schema } from '@/lib/validations/auth';
import Link from 'next/link';
import React, { useState } from 'react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

interface Step1Props {
  formData: any;
  updateFormData: (data: any) => void;
  onNext: () => void;
}

export function Step1PersonalDetails({ formData, updateFormData, onNext }: Step1Props) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const toast = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    // Validate with Zod
    const result = signupStep1Schema.safeParse({
      firstName: formData.firstName,
      lastName: formData.lastName,
      companyName: formData.companyName,
      email: formData.email,
      mobile: formData.mobile,
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
    <form onSubmit={handleSubmit} className='space-y-4' noValidate>
      <div className='grid grid-cols-2 gap-4'>
        <div>
          <FormInput
            icon='user'
            placeholder='First Name'
            value={formData.firstName}
            onChange={e => {
              updateFormData({ firstName: e.target.value });
              clearFieldError('firstName');
            }}
          />
          {fieldErrors.firstName && (
            <p className='mt-1 text-xs text-red-500'>{fieldErrors.firstName}</p>
          )}
        </div>
        <div>
          <FormInput
            icon='user'
            placeholder='Last Name'
            value={formData.lastName}
            onChange={e => {
              updateFormData({ lastName: e.target.value });
              clearFieldError('lastName');
            }}
          />
          {fieldErrors.lastName && (
            <p className='mt-1 text-xs text-red-500'>{fieldErrors.lastName}</p>
          )}
        </div>
      </div>

      <div>
        <FormInput
          icon='building'
          placeholder='Company Name'
          value={formData.companyName}
          onChange={e => {
            updateFormData({ companyName: e.target.value });
            clearFieldError('companyName');
          }}
        />
        {fieldErrors.companyName && (
          <p className='mt-1 text-xs text-red-500'>{fieldErrors.companyName}</p>
        )}
      </div>

      <div>
        <FormInput
          icon='email'
          type='email'
          placeholder='Work Email'
          value={formData.email}
          onChange={e => {
            updateFormData({ email: e.target.value });
            clearFieldError('email');
          }}
        />
        {fieldErrors.email && <p className='mt-1 text-xs text-red-500'>{fieldErrors.email}</p>}
      </div>

      <div className='space-y-2'>
        <label className='block text-sm font-medium text-gray-700'>Mobile Number *</label>
        <PhoneInput
          international
          countryCallingCodeEditable={false}
          defaultCountry='US'
          value={formData.mobile}
          onChange={value => {
            updateFormData({ mobile: value || '' });
            clearFieldError('mobile');
          }}
          className='custom-phone-input'
          style={{
            '--PhoneInputCountryFlag-aspectRatio': '1.5',
            '--PhoneInputCountryFlag-height': '1rem',
          }}
        />
        {fieldErrors.mobile && <p className='mt-1 text-xs text-red-500'>{fieldErrors.mobile}</p>}
      </div>

      <button
        type='submit'
        className='mt-6 h-11 w-full cursor-pointer rounded-[10px] bg-gradient-to-b from-[#588CFF] to-[#2462EB] font-medium text-white transition-all hover:opacity-90'
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
