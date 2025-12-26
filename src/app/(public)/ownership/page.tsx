'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { IdCard, Upload, User } from 'lucide-react';
import { useState } from 'react';

export default function OwnershipPage() {
  const [formData, setFormData] = useState<any>({
    firstName: 'John',
    lastName: 'Smith',
    email: '',
    phone: '',
    dob: '',
    citizenship: 'United States',
    secondaryCitizenship: 'None',
    taxId: '',
    role: '',
    percentage: '',
    // Address
    country: 'United States',
    address: '',
    apt: '',
    city: '',
    state: '',
    postalCode: '',
    // ID
    idType: '',
    idNumber: '',
    idIssuingCountry: 'United States',
    idIssueDate: '',
    // Employment
    employmentStatus: '',
    industry: '',
    occupation: '',
    employerName: '',
    sourceOfIncome: '',
    sourceOfWealth: '',
    annualIncome: '',
  });

  const countryOptions = [
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'in', label: 'India' },
    { value: 'ca', label: 'Canada' },
  ];

  const roleOptions = [
    { value: 'ceo', label: 'CEO' },
    { value: 'cfo', label: 'CFO' },
    { value: 'director', label: 'Director' },
    { value: 'owner', label: 'Owner' },
  ];

  const idTypeOptions = [
    { value: 'passport', label: 'Passport' },
    { value: 'drivers_license', label: "Driver's License" },
    { value: 'national_id', label: 'National ID' },
  ];

  const employmentStatusOptions = [
    { value: 'employed', label: 'Employed' },
    { value: 'self_employed', label: 'Self Employed' },
    { value: 'unemployed', label: 'Unemployed' },
    { value: 'retired', label: 'Retired' },
  ];

  const industryOptions = [
    { value: 'technology', label: 'Technology' },
    { value: 'finance', label: 'Finance' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'retail', label: 'Retail' },
    { value: 'other', label: 'Other' },
  ];

  const sourceOfIncomeOptions = [
    { value: 'salary', label: 'Salary' },
    { value: 'business', label: 'Business Income' },
    { value: 'investments', label: 'Investments' },
    { value: 'other', label: 'Other' },
  ];

  const sourceOfWealthOptions = [
    { value: 'inheritance', label: 'Inheritance' },
    { value: 'savings', label: 'Savings' },
    { value: 'investments', label: 'Investments' },
    { value: 'other', label: 'Other' },
  ];

  const annualIncomeOptions = [
    { value: 'under_50k', label: 'Under $50,000' },
    { value: '50k_100k', label: '$50,000 - $100,000' },
    { value: '100k_200k', label: '$100,000 - $200,000' },
    { value: 'over_200k', label: 'Over $200,000' },
  ];

  return (
    <div className='mx-auto w-full max-w-[800px] rounded-2xl bg-white p-6 shadow-sm md:p-8'>
      {/* Header */}
      <div className='mb-6'>
        <div className='mb-6 flex items-center gap-2'>
          <img src='/logo_dark.svg' alt='iTransfr Icon' className='h-8 w-auto' />
          <img src='/vector.svg' alt='iTransfr' className='h-6 w-auto' />
        </div>
        <h1 className='text-xl font-semibold text-gray-900'>Owners & Representatives</h1>
        <p className='mt-2 text-base text-gray-500'>Fill in the information below</p>
      </div>

      <hr className='mb-6 border-gray-100' />

      {/* Main Form Section */}
      <div className='max-h-[60vh] space-y-4 overflow-y-auto pr-2'>
        {/* Owner Title */}
        <div className='flex items-center gap-2'>
          <User className='h-5 w-5 text-blue-600' />
          <h3 className='text-lg font-medium text-gray-900'>Individual Owner</h3>
        </div>

        {/* Basic Info */}
        <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-900'>
              First Name <span className='text-red-500'>*</span>
            </label>
            <Input
              value={formData.firstName}
              onChange={e => setFormData({ ...formData, firstName: e.target.value })}
              placeholder='John'
            />
          </div>
          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-900'>Middle Name</label>
            <Input placeholder='Enter middle name (if any)' />
          </div>
          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-900'>
              Last Name <span className='text-red-500'>*</span>
            </label>
            <Input
              value={formData.lastName}
              onChange={e => setFormData({ ...formData, lastName: e.target.value })}
              placeholder='Smith'
            />
          </div>
        </div>

        {/* Contact info */}
        <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-900'>
              Email <span className='text-red-500'>*</span>
            </label>
            <Input placeholder='Enter email' />
          </div>
          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-900'>
              Phone Number <span className='text-red-500'>*</span>
            </label>
            <div className='flex gap-1'>
              <div className='w-24'>
                <Select value='us' onChange={() => {}} options={[{ value: 'us', label: 'US' }]} />
              </div>
              <Input placeholder='Phone Number' />
            </div>
          </div>
        </div>

        {/* DOB & Citizenship */}
        <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-900'>
              Date of Birth <span className='text-red-500'>*</span>
            </label>
            <Input type='date' placeholder='dd/mm/yyyy' />
          </div>
          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-900'>
              Citizenship <span className='text-red-500'>*</span>
            </label>
            <Select
              value='us'
              onChange={() => {}}
              options={[{ value: 'us', label: 'United States' }]}
              placeholder='United States'
            />
          </div>
        </div>

        {/* Secondary Citizenship & Tax ID */}
        <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-900'>Secondary Citizenship</label>
            <Select
              value='none'
              onChange={() => {}}
              options={[{ value: 'none', label: 'None' }]}
              placeholder='None'
            />
          </div>
          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-900'>
              Tax ID / SSN <span className='text-red-500'>*</span>
            </label>
            <Input placeholder='Enter tax id / ssn' />
          </div>
        </div>

        {/* Role & Percentage */}
        <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-900'>Role {formData.role}</label>
            <Select
              value={formData.role}
              onChange={val => setFormData({ ...formData, role: val })}
              options={roleOptions}
              placeholder='Select Role'
            />
          </div>
          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-900'>
              Ownership Percentage <span className='text-red-500'>*</span>
            </label>
            <div className='relative'>
              <Input placeholder='0%' />
              <div className='absolute top-1/2 right-4 -translate-y-1/2 text-lg text-gray-400'>
                %
              </div>
            </div>
          </div>
        </div>

        <hr className='border-gray-200' />

        {/* Residential Address */}
        <div className='space-y-3'>
          <h3 className='text-lg font-medium text-gray-900'>Residential Address</h3>
          <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-900'>
                Country <span className='text-red-500'>*</span>
              </label>
              <Select
                value='us'
                onChange={() => {}}
                options={countryOptions}
                placeholder='United States'
              />
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-900'>
                Street Address <span className='text-red-500'>*</span>
              </label>
              <Input placeholder='Enter street name and number' />
            </div>
          </div>
          <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-900'>
                Apt. / Suite / Unit <span className='text-gray-400'>(Optional)</span>
              </label>
              <Input placeholder='Enter apt., suite or unit number' />
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-900'>
                City <span className='text-red-500'>*</span>
              </label>
              <Input placeholder='Enter city' />
            </div>
          </div>
          <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-900'>
                State / Province <span className='text-red-500'>*</span>
              </label>
              <Select
                value=''
                onChange={() => {}}
                options={[
                  { value: 'ny', label: 'New York' },
                  { value: 'ca', label: 'California' },
                  { value: 'tx', label: 'Texas' },
                ]}
                placeholder='Select state'
              />
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-900'>
                Postal Code <span className='text-red-500'>*</span>
              </label>
              <Input placeholder='Postal / ZIP Code' />
            </div>
          </div>
        </div>

        <hr className='border-gray-100' />

        {/* ID Document Information */}
        <div className='space-y-3'>
          <h3 className='text-lg font-medium text-gray-900'>ID Document Information</h3>
          <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-900'>
                ID Type <span className='text-red-500'>*</span>
              </label>
              <Select
                value=''
                onChange={() => {}}
                options={idTypeOptions}
                placeholder='Select type'
              />
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-900'>
                ID Number <span className='text-red-500'>*</span>
              </label>
              <Input placeholder='Enter ID number' />
            </div>
          </div>
          <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
            <div>
              <label className='text-sm font-medium text-gray-900'>Issuing Country</label>
              <Select
                value='us'
                onChange={() => {}}
                options={countryOptions}
                placeholder='United States'
              />
            </div>
            <div>
              <label className='text-sm font-medium text-gray-900'>Issue Date</label>
              <Input type='date' placeholder='dd/mm/yyyy' />
            </div>
          </div>
          <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
            <div>
              <label className='text-sm font-medium text-gray-900'>Expiry Date</label>
              <Input type='date' placeholder='dd/mm/yyyy' />
            </div>
          </div>
        </div>

        <hr className='border-gray-100' />

        {/* Employment & Income */}
        <div className='space-y-3'>
          <h3 className='text-lg font-medium text-gray-900'>Employment & Income</h3>
          <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-900'>Employment Status</label>
              <Select
                value=''
                onChange={() => {}}
                options={employmentStatusOptions}
                placeholder='Select status'
              />
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-900'>Industry</label>
              <Select
                value=''
                onChange={() => {}}
                options={industryOptions}
                placeholder='Select industry'
              />
            </div>
          </div>
          <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-900'>Occupation / Title</label>
              <Input placeholder='Enter occupation or title' />
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-900'>Employer Name</label>
              <Input placeholder='Enter employer name' />
            </div>
          </div>
          <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-900'>Source of Income</label>
              <Select
                value=''
                onChange={() => {}}
                options={sourceOfIncomeOptions}
                placeholder='Select source'
              />
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-900'>Source of Wealth</label>
              <Select
                value=''
                onChange={() => {}}
                options={sourceOfWealthOptions}
                placeholder='Select source'
              />
            </div>
          </div>
          <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-900'>Annual Income</label>
              <Select
                value=''
                onChange={() => {}}
                options={annualIncomeOptions}
                placeholder='Select range'
              />
            </div>
          </div>
        </div>

        <hr className='border-gray-100' />

        {/* Document Upload Section */}
        <div className='space-y-4'>
          <h3 className='text-lg font-medium text-gray-900'>Document Upload</h3>
          <div className='rounded-xl border border-gray-100 bg-white p-3 shadow-sm'>
            <div className='flex items-start justify-between gap-4'>
              <div className='flex gap-6'>
                <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100/50 text-blue-600'>
                  <IdCard className='h-6 w-6' />
                </div>
                <div className='space-y-1'>
                  <h3 className='text-lg font-semibold text-gray-900'>
                    Personal Identification Document <span className='text-red-500'>*</span>
                  </h3>
                  <p className='text-sm text-gray-500'>
                    Government-issued photo ID of the person completing this form
                  </p>
                  <p className='pt-2 text-xs text-gray-400'>
                    Accepted formats: PDF, JPG, PNG (max 10MB)
                  </p>
                </div>
              </div>
              <button className='flex h-8 shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50'>
                <Upload className='h-4 w-4' />
                Upload ID
              </button>
            </div>
          </div>
        </div>

        <hr className='border-gray-200' />

        {/* Footer Buttons */}
        <div className='flex items-center justify-end pt-4'>
          <Button className='bg-gradient-blue cursor-pointer rounded-lg px-14 text-sm text-white shadow-md transition-all hover:opacity-90'>
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}
