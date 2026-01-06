'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import {
  COUNTRY_OPTIONS,
  getStatesForCountry,
  hasStateDropdown,
  PHONE_CODE_OPTIONS,
  OWNER_ROLES,
} from '@/lib/constants/countries';
import {
  EMPLOYMENT_STATUS_OPTIONS,
  ANNUAL_INCOME_OPTIONS,
  SOURCE_OF_FUNDS_OPTIONS,
  SOURCE_OF_WEALTH_OPTIONS,
  ID_TYPE_OPTIONS,
  EMPLOYMENT_INDUSTRY_OPTIONS,
  ENTITY_TYPE_OPTIONS,
} from '@/lib/constants/business';
import { OwnershipValidationService, Owner as ServiceOwner } from '@/lib/validations/ownership-validation';
import {
  AlertTriangle,
  Building2,
  Check,
  CheckCircle,
  Copy,
  Mail,
  Plus,
  Share,
  Trash2,
  User,
} from 'lucide-react';
import { useEffect, useState } from 'react';

// Local Owner interface for the component (extends service Owner with UI-specific fields)
interface Owner extends ServiceOwner {
  // UI-specific fields for the form component
  percentage: string; // String for input field binding
  // Additional person-specific fields
  middleName?: string;
  phoneCountryCode?: string;
  dob?: string;
  citizenship?: string;
  secondaryCitizenship?: string;
  residentialCountry?: string;
  residentialAddress?: string;
  residentialApt?: string;
  residentialCity?: string;
  residentialState?: string;
  residentialPostalCode?: string;
  idType?: string;
  idNumber?: string;
  idIssuingCountry?: string;
  idIssueDate?: string;
  idExpirationDate?: string;
  employmentStatus?: string;
  employmentIndustry?: string;
  occupation?: string;
  employerName?: string;
  sourceOfIncome?: string;
  annualIncome?: string;
  sourceOfWealth?: string;
  authorizedSigner?: boolean;
  taxId?: string;
  // Entity-specific field mapping
  entityCountry?: string; // Maps to countryOfIncorporation
}

interface Step5Props {
  formData?: any;
  onChange?: (field: string, value: any) => void;
  errors?: Record<string, string>;
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
}

export function Step5OwnersRepresentatives({
  formData = {},
  onChange,
  errors = {},
  onValidationChange,
}: Step5Props) {
  // Use formData.owners as the source of truth, or default to empty array
  const owners: Owner[] = Array.isArray(formData.owners) ? formData.owners : [];

  const toast = useToast();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [selectedOwnerForShare, setSelectedOwnerForShare] = useState<{
    name: string;
    type: string;
  } | null>(null);

  // Add validation state
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [ownershipValidation, setOwnershipValidation] = useState(
    OwnershipValidationService.validateOwnership([])
  );

  // Helper to update parent data with validation
  const updateParent = (newOwners: Owner[]) => {
    if (onChange) {
      onChange('owners', newOwners);

      // Convert to validation service format
      const validationOwners: ServiceOwner[] = newOwners.map(owner => ({
        id: owner.id,
        type: owner.type,
        ownershipPercentage: parseFloat(owner.percentage) || 0,
        // Add other required fields for validation
        firstName: owner.firstName,
        lastName: owner.lastName,
        email: owner.email,
        phone: owner.phone,
        // Entity fields
        entityName: owner.entityName,
        countryOfIncorporation: owner.entityCountry,
        entityType: owner.entityType,
        registrationNumber: owner.registrationNumber,
      }));

      // Update validation state
      const newValidation = OwnershipValidationService.validateOwnership(validationOwners);
      setOwnershipValidation(newValidation);

      // Check for field-level errors
      const fieldErrors: string[] = [];
      validationOwners.forEach((owner, index) => {
        const ownerValidation = OwnershipValidationService.validateOwner(owner);
        if (!ownerValidation.isValid) {
          fieldErrors.push(...ownerValidation.errors.map(err => `Owner ${index + 1}: ${err}`));
        }
      });
      setValidationErrors(fieldErrors);

      // Update total for backward compatibility
      const total = newOwners.reduce((acc, owner) => acc + (parseFloat(owner.percentage) || 0), 0);
      onChange('ownershipPercentage', total);

      // Notify parent of validation status
      const allErrors = [...(newValidation.error ? [newValidation.error] : []), ...fieldErrors];
      onValidationChange?.(!newValidation.isValid || fieldErrors.length > 0, allErrors);
    }
  };

  // Helper to handle percentage change with validation
  const handlePercentageChange = (ownerId: string, newValue: string) => {
    // Allow empty string for clearing the field
    if (newValue === '') {
      const updatedOwners = owners.map(o =>
        o.id === ownerId ? { ...o, percentage: '', ownershipPercentage: 0 } : o
      );
      updateParent(updatedOwners);
      return;
    }

    const newPercentage = parseFloat(newValue);

    // Prevent negative values
    if (newPercentage < 0) {
      toast.error('Invalid Value', 'Ownership percentage cannot be negative');
      return;
    }

    // Prevent values greater than 100 for a single owner
    if (newPercentage > 100) {
      toast.error('Invalid Value', 'Individual ownership cannot exceed 100%');
      return;
    }

    // Calculate what the new total would be
    const otherOwnersTotal = owners
      .filter(o => o.id !== ownerId)
      .reduce((acc, owner) => acc + (parseFloat(owner.percentage) || 0), 0);

    const newTotal = otherOwnersTotal + newPercentage;

    // Allow any value for now - validation will happen at the ownership level
    // The validation service will handle the 100% requirement
    const updatedOwners = owners.map(o =>
      o.id === ownerId ? { ...o, percentage: newValue, ownershipPercentage: newPercentage } : o
    );
    updateParent(updatedOwners);
  };

  // Only check for empty initial state ONCE on mount
  useEffect(() => {
    // If no owners exist (and we're not just loading), add a default one
    // We check against formData.owners directly here to avoid dependency issues
    if (!formData.owners || (Array.isArray(formData.owners) && formData.owners.length === 0)) {
      handleAddPerson();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount

  // Citizenship options (same as countries)
  const citizenshipOptions = COUNTRY_OPTIONS;

  // Use imported constants for all dropdown options
  const idTypeOptions = ID_TYPE_OPTIONS;
  const employmentStatusOptions = EMPLOYMENT_STATUS_OPTIONS;
  const industryOptions = EMPLOYMENT_INDUSTRY_OPTIONS;
  const sourceOfWealthOptions = SOURCE_OF_WEALTH_OPTIONS;
  const sourceOfFundsOptions = SOURCE_OF_FUNDS_OPTIONS;
  const annualIncomeOptions = ANNUAL_INCOME_OPTIONS;
  const entityTypeOptions = ENTITY_TYPE_OPTIONS;
  const roleOptions = OWNER_ROLES;

  const handleAddPerson = () => {
    const newOwner: Owner = {
      id: Date.now().toString(),
      type: 'person',
      percentage: '',
      ownershipPercentage: 0,
      // Basic Info
      firstName: '',
      middleName: '',
      lastName: '',
      email: '',
      phone: '',
      phoneCountryCode: '+1',
      dob: '',
      citizenship: '',
      secondaryCitizenship: '',
      role: '',
      // Residential Address
      residentialCountry: '',
      residentialAddress: '',
      residentialApt: '',
      residentialCity: '',
      residentialState: '',
      residentialPostalCode: '',
      // ID Document Information
      idType: '',
      idNumber: '',
      idIssuingCountry: '',
      idIssueDate: '',
      idExpirationDate: '',
      // Employment & Income
      employmentStatus: '',
      employmentIndustry: '',
      occupation: '',
      employerName: '',
      sourceOfIncome: '',
      sourceOfWealth: '',
      annualIncome: '',
      authorizedSigner: false,
      taxId: '',
    };
    updateParent([...owners, newOwner]);
  };

  const handleAddEntity = () => {
    const newEntity: Owner = {
      id: Date.now().toString(),
      type: 'entity',
      percentage: '',
      ownershipPercentage: 0,
      entityName: '',
      entityCountry: '',
      entityType: '',
      registrationNumber: '',
    };
    updateParent([...owners, newEntity]);
  };

  const handleDeleteOwner = (id: string) => {
    if (owners.length > 0) {
      updateParent(owners.filter(owner => owner.id !== id));
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.protocol}//${window.location.host}`);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Calculate validation status
  const serviceOwners: ServiceOwner[] = owners.map(owner => ({
    id: owner.id,
    type: owner.type,
    ownershipPercentage: parseFloat(owner.percentage) || 0,
    firstName: owner.firstName,
    lastName: owner.lastName,
    email: owner.email,
    phone: owner.phone,
    entityName: owner.entityName,
    countryOfIncorporation: owner.entityCountry,
    entityType: owner.entityType,
    registrationNumber: owner.registrationNumber,
  }));

  const progressPercentage = OwnershipValidationService.getProgressPercentage(serviceOwners);
  const progressColor = OwnershipValidationService.getProgressColor(serviceOwners);
  const progressMessage = OwnershipValidationService.getProgressMessage(serviceOwners);
  const canProceed = OwnershipValidationService.canSubmitForm(serviceOwners);

  return (
    <div className='space-y-6 pr-2'>
      <section className='sticky top-[0px] z-60 -mt-4 bg-white py-4'>
        {/* Ownership Validation Status */}
        <div className='mb-4 rounded-xl border bg-white px-4 py-3 shadow-sm'>
          <div className='mb-3 flex items-center justify-between'>
            <h3 className='font-medium text-gray-900'>Ownership Allocation</h3>
            <div className='flex items-center gap-2'>
              {ownershipValidation.isValid ? (
                <CheckCircle className='h-5 w-5 text-green-600' />
              ) : (
                <AlertTriangle className='h-5 w-5 text-red-500' />
              )}
              <span
                className={`font-medium ${ownershipValidation.isValid ? 'text-green-600' : 'text-red-500'
                  }`}
              >
                {ownershipValidation.totalPercentage}%
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className='mb-2 h-2 w-full overflow-hidden rounded-full bg-gray-100'>
            <div
              className={`h-full transition-all duration-300 ease-out ${progressColor === 'green'
                ? 'bg-green-500'
                : progressColor === 'red'
                  ? 'bg-red-500'
                  : 'bg-yellow-500'
                }`}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>

          {/* Status Message */}
          <p
            className={`text-sm ${progressColor === 'green'
              ? 'text-green-600'
              : progressColor === 'red'
                ? 'text-red-600'
                : 'text-yellow-600'
              }`}
          >
            {progressMessage}
          </p>

          {/* Validation Errors */}

        </div>
        {/* Total Ownership Card */}

        {/* Add Actions */}
        <div className='grid grid-cols-2 gap-4'>
          <button
            onClick={handleAddPerson}
            className='flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50'
          >
            <Plus className='h-5 w-5 text-blue-500' />
            Add Person
          </button>
          <button
            onClick={handleAddEntity}
            className='flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50'
          >
            <Plus className='h-5 w-5 text-blue-500' />
            Add Entity
          </button>
        </div>
      </section>

      <div>
        {/* List of Owners (Person or Entity) */}
        {owners.map((owner, index) => (
          <section key={owner.id} className='border-b border-gray-200 pb-6'>
            {/* Header */}
            <div className='mb-4 flex items-center justify-between'>
              <div className='mt-2 flex items-center gap-2'>
                {owner.type === 'entity' ? (
                  <Building2 className='h-5 w-5 text-purple-600' />
                ) : (
                  <User className='h-5 w-5 text-blue-600' />
                )}
                <div>
                  <h3 className='text-base font-medium text-gray-900'>
                    {owner.type === 'entity' ? 'Entity Owner' : 'Individual Owner'}{' '}
                    <span className='text-gray-400'>{String(index + 1).padStart(2, '0')}</span>
                  </h3>
                </div>
              </div>
              <div className='mt-2 flex items-center gap-2'>
                <button
                  onClick={() => {
                    setSelectedOwnerForShare({
                      name:
                        owner.type === 'entity'
                          ? owner.entityName || `Entity Owner`
                          : `${owner.firstName || ''} ${owner.lastName || ''}`.trim() ||
                          `Individual Owner`,
                      type: owner.type === 'entity' ? 'Entity Owner' : 'Individual Owner',
                    });
                    setIsShareModalOpen(true);
                  }}
                  className='flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50'
                >
                  <Share className='h-4 w-4' />
                  Share Form
                </button>
                <button
                  onClick={() => handleDeleteOwner(owner.id || '')}
                  className='flex cursor-pointer items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50'
                >
                  <Trash2 className='h-4 w-4' />
                </button>
              </div>
            </div>

            {/* Type Logic */}
            {owner.type === 'entity' ? (
              /* ENTITY FORM FIELDS */
              <div className='space-y-6'>
                {/* Row 1: Entity Name */}
                <div className='space-y-2'>
                  <label className='text-sm font-medium text-gray-900'>
                    Entity Name <span className='text-red-500'>*</span>
                  </label>
                  <Input
                    value={owner.entityName || ''}
                    onChange={e => {
                      const updatedOwners = owners.map(o =>
                        o.id === owner.id ? { ...o, entityName: e.target.value } : o
                      );
                      updateParent(updatedOwners);
                    }}
                    placeholder='Enter entity name'
                    error={errors[`owners.${index}.entityName`]}
                  />
                </div>

                {/* Row 2: Country & Type */}
                <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium text-gray-900'>
                      Country of Incorporation <span className='text-red-500'>*</span>
                    </label>
                    <Select
                      value={owner.entityCountry || ''}
                      onChange={val => {
                        const updatedOwners = owners.map(o =>
                          o.id === owner.id ? { ...o, entityCountry: val } : o
                        );
                        updateParent(updatedOwners);
                      }}
                      options={COUNTRY_OPTIONS}
                      placeholder='Select country'
                      direction='up'
                      error={errors[`owners.${index}.entityCountry`]}
                    />
                  </div>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium text-gray-900'>
                      Entity Type <span className='text-red-500'>*</span>
                    </label>
                    <Select
                      value={owner.entityType || ''}
                      onChange={val => {
                        const updatedOwners = owners.map(o =>
                          o.id === owner.id ? { ...o, entityType: val } : o
                        );
                        updateParent(updatedOwners);
                      }}
                      options={entityTypeOptions}
                      placeholder='Select type'
                      direction='up'
                      error={errors[`owners.${index}.entityType`]}
                    />
                  </div>
                </div>

                {/* Row 3: Reg Num & Ownership */}
                <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium text-gray-900'>
                      Registration Number <span className='text-red-500'>*</span>
                    </label>
                    <Input
                      value={owner.registrationNumber || ''}
                      onChange={e => {
                        const updatedOwners = owners.map(o =>
                          o.id === owner.id ? { ...o, registrationNumber: e.target.value } : o
                        );
                        updateParent(updatedOwners);
                      }}
                      placeholder='Enter registration number'
                      error={errors[`owners.${index}.registrationNumber`]}
                    />
                  </div>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium text-gray-900'>
                      Ownership % <span className='text-red-500'>*</span>
                    </label>
                    <Input
                      type='number'
                      value={owner.percentage || ''}
                      onChange={e => handlePercentageChange(owner.id || '', e.target.value)}
                      placeholder='0'
                      min='0'
                      max='100'
                      step='0.01'
                      error={errors[`owners.${index}.ownershipPercentage`]}
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* PERSON FORM FIELDS (Previous Implementation) */
              <div className='space-y-6'>
                {/* Row 1: Names */}
                <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium text-gray-900'>
                      First Name <span className='text-red-500'>*</span>
                    </label>
                    <Input
                      value={owner.firstName || ''}
                      onChange={e => {
                        const updatedOwners = owners.map(o =>
                          o.id === owner.id ? { ...o, firstName: e.target.value } : o
                        );
                        updateParent(updatedOwners);
                      }}
                      placeholder='Enter first name'
                      error={errors[`owners.${index}.firstName`]}
                    />
                  </div>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium text-gray-900'>
                      Middle Name <span className='text-gray-400'>(if any)</span>
                    </label>
                    <Input
                      value={owner.middleName || ''}
                      onChange={e => {
                        const updatedOwners = owners.map(o =>
                          o.id === owner.id ? { ...o, middleName: e.target.value } : o
                        );
                        updateParent(updatedOwners);
                      }}
                      placeholder='Enter middle name'
                    />
                  </div>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium text-gray-900'>
                      Last Name <span className='text-red-500'>*</span>
                    </label>
                    <Input
                      value={owner.lastName || ''}
                      onChange={e => {
                        const updatedOwners = owners.map(o =>
                          o.id === owner.id ? { ...o, lastName: e.target.value } : o
                        );
                        updateParent(updatedOwners);
                      }}
                      placeholder='Enter last name'
                      error={errors[`owners.${index}.lastName`]}
                    />
                  </div>
                </div>

                {/* Row 2: Email & Phone */}
                <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium text-gray-900'>
                      Email <span className='text-red-500'>*</span>
                    </label>
                    <Input
                      type='email'
                      value={owner.email || ''}
                      onChange={e => {
                        const updatedOwners = owners.map(o =>
                          o.id === owner.id ? { ...o, email: e.target.value } : o
                        );
                        updateParent(updatedOwners);
                      }}
                      placeholder='Enter email'
                      error={errors[`owners.${index}.email`]}
                    />
                  </div>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium text-gray-900'>Phone Number</label>
                    <div className='flex gap-2'>
                      <div className='w-32'>
                        <Select
                          value={owner.phoneCountryCode || '+1'}
                          onChange={val => {
                            const updatedOwners = owners.map(o =>
                              o.id === owner.id ? { ...o, phoneCountryCode: val } : o
                            );
                            updateParent(updatedOwners);
                          }}
                          options={PHONE_CODE_OPTIONS}
                          placeholder='+1'
                          searchable
                          searchPlaceholder='Search...'
                        />
                      </div>
                      <div className='flex-1'>
                        <Input
                          type='tel'
                          value={owner.phone || ''}
                          onChange={e => {
                            const updatedOwners = owners.map(o =>
                              o.id === owner.id ? { ...o, phone: e.target.value } : o
                            );
                            updateParent(updatedOwners);
                          }}
                          placeholder='Phone Number'
                          error={errors[`owners.${index}.phone`]}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 3: Date of Birth & Citizenship */}
                <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium text-gray-900'>
                      Date of Birth <span className='text-red-500'>*</span>
                    </label>
                    <Input
                      type='date'
                      value={owner.dob || ''}
                      onChange={e => {
                        const updatedOwners = owners.map(o =>
                          o.id === owner.id ? { ...o, dob: e.target.value } : o
                        );
                        updateParent(updatedOwners);
                      }}
                      placeholder='dd/mm/yyyy'
                      error={errors[`owners.${index}.dateOfBirth`]}
                    />
                  </div>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium text-gray-900'>Citizenship</label>
                    <Select
                      value={owner.citizenship || ''}
                      onChange={val => {
                        const updatedOwners = owners.map(o =>
                          o.id === owner.id ? { ...o, citizenship: val } : o
                        );
                        updateParent(updatedOwners);
                      }}
                      options={citizenshipOptions}
                      placeholder='Select citizenship'
                      error={errors[`owners.${index}.citizenship`]}
                      searchable
                      searchPlaceholder='Search countries...'
                    />
                  </div>
                </div>

                {/* Row 4: Secondary Citizenship & Ownership % */}
                <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium text-gray-900'>
                      Secondary Citizenship
                    </label>
                    <Select
                      value={owner.secondaryCitizenship || ''}
                      onChange={val => {
                        const updatedOwners = owners.map(o =>
                          o.id === owner.id ? { ...o, secondaryCitizenship: val } : o
                        );
                        updateParent(updatedOwners);
                      }}
                      options={citizenshipOptions}
                      placeholder='None'
                    />
                  </div>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium text-gray-900'>Tax ID / SSN</label>
                    <Input
                      value={owner.taxId || ''}
                      onChange={e => {
                        const updatedOwners = owners.map(o =>
                          o.id === owner.id ? { ...o, taxId: e.target.value } : o
                        );
                        updateParent(updatedOwners);
                      }}
                      placeholder='Enter tax ID / ssn'
                      error={errors[`owners.${index}.taxId`]}
                    />
                  </div>
                </div>

                {/* Row 4: Role & Ownership % */}
                <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium text-gray-900'>Role</label>
                    <Select
                      value={owner.role || ''}
                      onChange={val => {
                        const updatedOwners = owners.map(o =>
                          o.id === owner.id ? { ...o, role: val } : o
                        );
                        updateParent(updatedOwners);
                      }}
                      options={roleOptions}
                      placeholder='Select Role'
                      error={errors[`owners.${index}.role`]}
                    />
                  </div>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium text-gray-900'>
                      Ownership Percentage
                    </label>
                    <div className='relative'>
                      <Input
                        type='number'
                        value={owner.percentage || ''}
                        onChange={e => handlePercentageChange(owner.id || '', e.target.value)}
                        placeholder='0'
                        className='pr-12'
                        min='0'
                        max='100'
                        step='0.01'
                        error={errors[`owners.${index}.ownershipPercentage`]}
                      />
                      <div className='absolute top-1/2 right-3 -translate-y-1/2 text-sm text-gray-500'>
                        %
                      </div>
                    </div>
                  </div>
                </div>

                {/* Residential Address */}
                <div className='mt-6 space-y-4'>
                  <h4 className='text-sm font-semibold text-gray-900'>Residential Address</h4>
                  <div className='space-y-6'>
                    {/* Row 1: Country & Street Address */}
                    <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                      <div className='space-y-2'>
                        <label className='text-sm font-medium text-gray-900'>
                          Country <span className='text-red-500'>*</span>
                        </label>
                        <Select
                          value={owner.residentialCountry || ''}
                          onChange={val => {
                            const updatedOwners = owners.map(o =>
                              o.id === owner.id ? { ...o, residentialCountry: val } : o
                            );
                            updateParent(updatedOwners);
                          }}
                          options={COUNTRY_OPTIONS}
                          placeholder='United States'
                          error={errors[`owners.${index}.residentialCountry`]}
                          searchable
                          searchPlaceholder='Search countries...'
                        />
                      </div>
                      <div className='space-y-2'>
                        <label className='text-sm font-medium text-gray-900'>
                          Street Address <span className='text-red-500'>*</span>
                        </label>
                        <Input
                          value={owner.residentialAddress || ''}
                          onChange={e => {
                            const updatedOwners = owners.map(o =>
                              o.id === owner.id ? { ...o, residentialAddress: e.target.value } : o
                            );
                            updateParent(updatedOwners);
                          }}
                          placeholder='Enter street address'
                          error={errors[`owners.${index}.residentialAddress`]}
                        />
                      </div>
                    </div>

                    {/* Row 2: Apt/Suite & City */}
                    <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                      <div className='space-y-2'>
                        <label className='text-sm font-medium text-gray-900'>
                          Apt / Suite / Unit <span className='text-gray-400'>(Optional)</span>
                        </label>
                        <Input
                          value={owner.residentialApt || ''}
                          onChange={e => {
                            const updatedOwners = owners.map(o =>
                              o.id === owner.id ? { ...o, residentialApt: e.target.value } : o
                            );
                            updateParent(updatedOwners);
                          }}
                          placeholder='Enter apt, suite or unit number'
                        />
                      </div>
                      <div className='space-y-2'>
                        <label className='text-sm font-medium text-gray-900'>
                          City <span className='text-red-500'>*</span>
                        </label>
                        <Input
                          value={owner.residentialCity || ''}
                          onChange={e => {
                            const updatedOwners = owners.map(o =>
                              o.id === owner.id ? { ...o, residentialCity: e.target.value } : o
                            );
                            updateParent(updatedOwners);
                          }}
                          placeholder='Enter city'
                          error={errors[`owners.${index}.residentialCity`]}
                        />
                      </div>
                    </div>

                    {/* Row 3: State & Postal Code */}
                    <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                      <div className='space-y-2'>
                        <label className='text-sm font-medium text-gray-900'>
                          State / Province
                        </label>
                        {hasStateDropdown(owner.residentialCountry || '') ? (
                          <Select
                            value={owner.residentialState || ''}
                            onChange={val => {
                              const updatedOwners = owners.map(o =>
                                o.id === owner.id ? { ...o, residentialState: val } : o
                              );
                              updateParent(updatedOwners);
                            }}
                            options={getStatesForCountry(owner.residentialCountry || '') || []}
                            placeholder='Select State'
                            direction='up'
                            error={errors[`owners.${index}.residentialState`]}
                            searchable
                            searchPlaceholder='Search states...'
                          />
                        ) : (
                          <Input
                            value={owner.residentialState || ''}
                            onChange={e => {
                              const updatedOwners = owners.map(o =>
                                o.id === owner.id ? { ...o, residentialState: e.target.value } : o
                              );
                              updateParent(updatedOwners);
                            }}
                            placeholder='Enter state, region, or province'
                            error={errors[`owners.${index}.residentialState`]}
                          />
                        )}
                      </div>
                      <div className='space-y-2'>
                        <label className='text-sm font-medium text-gray-900'>
                          Postal / ZIP Code <span className='text-red-500'>*</span>
                        </label>
                        <Input
                          value={owner.residentialPostalCode || ''}
                          onChange={e => {
                            const updatedOwners = owners.map(o =>
                              o.id === owner.id
                                ? { ...o, residentialPostalCode: e.target.value }
                                : o
                            );
                            updateParent(updatedOwners);
                          }}
                          placeholder='Postal / ZIP Code'
                          error={errors[`owners.${index}.residentialPostalCode`]}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ID Document Information */}
                <div className='mt-6 space-y-4'>
                  <h4 className='text-sm font-semibold text-gray-900'>ID Document Information</h4>
                  <div className='space-y-6'>
                    {/* Row 1: ID Type & ID Number */}
                    <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                      <div className='space-y-2'>
                        <label className='text-sm font-medium text-gray-900'>
                          ID Type <span className='text-red-500'>*</span>
                        </label>
                        <Select
                          value={owner.idType || ''}
                          onChange={val => {
                            const updatedOwners = owners.map(o =>
                              o.id === owner.id ? { ...o, idType: val } : o
                            );
                            updateParent(updatedOwners);
                          }}
                          options={idTypeOptions}
                          placeholder='Select type'
                          error={errors[`owners.${index}.idType`]}
                        />
                      </div>
                      <div className='space-y-2'>
                        <label className='text-sm font-medium text-gray-900'>
                          ID Number <span className='text-red-500'>*</span>
                        </label>
                        <Input
                          value={owner.idNumber || ''}
                          onChange={e => {
                            const updatedOwners = owners.map(o =>
                              o.id === owner.id ? { ...o, idNumber: e.target.value } : o
                            );
                            updateParent(updatedOwners);
                          }}
                          placeholder='Enter ID number'
                          error={errors[`owners.${index}.idNumber`]}
                        />
                      </div>
                    </div>

                    {/* Row 2: Issuing Country & Issue Date */}
                    <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                      <div className='space-y-2'>
                        <label className='text-sm font-medium text-gray-900'>
                          Issuing Country <span className='text-red-500'>*</span>
                        </label>
                        <Select
                          value={owner.idIssuingCountry || ''}
                          onChange={val => {
                            const updatedOwners = owners.map(o =>
                              o.id === owner.id ? { ...o, idIssuingCountry: val } : o
                            );
                            updateParent(updatedOwners);
                          }}
                          options={COUNTRY_OPTIONS}
                          placeholder='United States'
                          error={errors[`owners.${index}.idIssuingCountry`]}
                          searchable
                          searchPlaceholder='Search countries...'
                        />
                      </div>
                      <div className='space-y-2'>
                        <label className='text-sm font-medium text-gray-900'>Issue Date</label>{' '}
                        <span className='text-red-500'>*</span>
                        <Input
                          type='date'
                          value={owner.idIssueDate || ''}
                          onChange={e => {
                            const updatedOwners = owners.map(o =>
                              o.id === owner.id ? { ...o, idIssueDate: e.target.value } : o
                            );
                            updateParent(updatedOwners);
                          }}
                          placeholder='dd/mm/yyyy'
                          error={errors[`owners.${index}.idIssueDate`]}
                        />
                      </div>
                    </div>

                    {/* Row 3: Expiration Date */}
                    <div className='space-y-2'>
                      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                        <div>
                          <label className='text-sm font-medium text-gray-900'>
                            Expiration Date
                          </label>
                          <Input
                            type='date'
                            value={owner.idExpirationDate || ''}
                            onChange={e => {
                              const updatedOwners = owners.map(o =>
                                o.id === owner.id ? { ...o, idExpirationDate: e.target.value } : o
                              );
                              updateParent(updatedOwners);
                            }}
                            placeholder='dd/mm/yyyy'
                            error={errors[`owners.${index}.idExpirationDate`]}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Employment & Income */}
                <div className='mt-6 space-y-4'>
                  <h4 className='text-sm font-semibold text-gray-900'>Employment & Income</h4>
                  <div className='space-y-6'>
                    {/* Row 1: Employment Status & Industry */}
                    <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                      <div className='space-y-2'>
                        <label className='text-sm font-medium text-gray-900'>
                          Employment Status <span className='text-red-500'>*</span>
                        </label>
                        <Select
                          value={owner.employmentStatus || ''}
                          onChange={val => {
                            const updatedOwners = owners.map(o =>
                              o.id === owner.id ? { ...o, employmentStatus: val } : o
                            );
                            updateParent(updatedOwners);
                          }}
                          options={employmentStatusOptions}
                          placeholder='Select status'
                          error={errors[`owners.${index}.employmentStatus`]}
                        />
                      </div>
                      <div className='space-y-2'>
                        <label className='text-sm font-medium text-gray-900'>Industry</label>
                        <Select
                          value={owner.employmentIndustry || ''}
                          onChange={val => {
                            const updatedOwners = owners.map(o =>
                              o.id === owner.id ? { ...o, employmentIndustry: val } : o
                            );
                            updateParent(updatedOwners);
                          }}
                          options={industryOptions}
                          placeholder='Select industry'
                        />
                      </div>
                    </div>

                    {/* Row 2: Occupation & Employer Name */}
                    <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                      <div className='space-y-2'>
                        <label className='text-sm font-medium text-gray-900'>
                          Occupation / Title
                        </label>
                        <Input
                          value={owner.occupation || ''}
                          onChange={e => {
                            const updatedOwners = owners.map(o =>
                              o.id === owner.id ? { ...o, occupation: e.target.value } : o
                            );
                            updateParent(updatedOwners);
                          }}
                          placeholder='Enter occupation or title'
                        />
                      </div>
                      <div className='space-y-2'>
                        <label className='text-sm font-medium text-gray-900'>Employer Name</label>
                        <Input
                          value={owner.employerName || ''}
                          onChange={e => {
                            const updatedOwners = owners.map(o =>
                              o.id === owner.id ? { ...o, employerName: e.target.value } : o
                            );
                            updateParent(updatedOwners);
                          }}
                          placeholder='Enter employer name'
                        />
                      </div>
                    </div>

                    {/* Row 3: Source of Income & Annual Income */}
                    {/* Row 3: Source of Income & Source of Wealth */}
                    <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                      <div className='space-y-2'>
                        <label className='text-sm font-medium text-gray-900'>
                          Source of Income
                        </label>
                        <Select
                          value={owner.sourceOfIncome || ''}
                          onChange={val => {
                            const updatedOwners = owners.map(o =>
                              o.id === owner.id ? { ...o, sourceOfIncome: val } : o
                            );
                            updateParent(updatedOwners);
                          }}
                          options={sourceOfFundsOptions}
                          placeholder='Select source'
                          direction='up'
                        />
                      </div>
                      <div className='space-y-2'>
                        <label className='text-sm font-medium text-gray-900'>
                          Source of Wealth
                        </label>
                        <Select
                          value={owner.sourceOfWealth || ''}
                          onChange={val => {
                            const updatedOwners = owners.map(o =>
                              o.id === owner.id ? { ...o, sourceOfWealth: val } : o
                            );
                            updateParent(updatedOwners);
                          }}
                          options={sourceOfWealthOptions}
                          placeholder='Select source'
                          direction='up'
                        />
                      </div>
                    </div>

                    {/* Row 4: Annual Income & Authorized Signer */}
                    <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                      <div className='space-y-2'>
                        <label className='text-sm font-medium text-gray-900'>Annual Income</label>
                        <Select
                          value={owner.annualIncome || ''}
                          onChange={val => {
                            const updatedOwners = owners.map(o =>
                              o.id === owner.id ? { ...o, annualIncome: val } : o
                            );
                            updateParent(updatedOwners);
                          }}
                          options={annualIncomeOptions}
                          placeholder='Select range'
                          direction='up'
                        />
                      </div>

                      <div className='flex items-center pt-8'>
                        <label className='flex cursor-pointer items-center gap-2'>
                          <div className='relative flex items-center'>
                            <input
                              type='checkbox'
                              className='peer h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                              checked={owner.authorizedSigner || false}
                              onChange={e => {
                                const updatedOwners = owners.map(o =>
                                  o.id === owner.id
                                    ? { ...o, authorizedSigner: e.target.checked }
                                    : o
                                );
                                updateParent(updatedOwners);
                              }}
                            />
                          </div>
                          <span className='text-xs text-gray-600'>
                            Authorized Signer{' '}
                            <span className='text-gray-400'>(can sign on behalf of company)</span>
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        ))}
      </div>

      <Modal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        size='lg'
        title='Share Form'
      >
        <div className='space-y-6'>
          <div className='flex items-start justify-between'>
            <div>
              <p className='mt-1 text-gray-700'>{selectedOwnerForShare?.name || 'Owner'}</p>
            </div>
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-900'>Form Link</label>
            <div className='flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-1'>
              <span className='flex-1 truncate text-sm font-light text-blue-600'>
                form.itransfr.com/ownership
              </span>
              <button
                onClick={handleCopyUrl}
                className='flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1 text-sm font-normal text-gray-700 shadow-sm transition-colors hover:bg-gray-50'
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
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-900'>First Name</label>
              <Input placeholder='Enter first name' className='border-gray-100 bg-gray-50' />
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-900'>Last Name</label>
              <Input placeholder='Enter last name' className='border-gray-100 bg-gray-50' />
            </div>
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-900'>Invite Member</label>
            <div className='flex gap-2'>
              <div className='relative flex-1'>
                <Mail className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400' />
                <Input placeholder='Add email' className='border-gray-100 bg-gray-50 pl-10' />
              </div>
              <Button className='bg-gradient-blue cursor-pointer px-8 text-white hover:bg-blue-700'>
                Invite
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
