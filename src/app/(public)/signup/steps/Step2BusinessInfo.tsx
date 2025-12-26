import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  COUNTRY_OPTIONS,
  getEntityTypesForCountry,
  getStatesForCountry,
  hasStateDropdown
} from '@/lib/constants/countries';
import { useEffect, useState } from 'react';

interface Step2Props {
  formData?: any;
  onChange?: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

export function Step2BusinessInfo({ formData = {}, onChange, errors = {} }: Step2Props) {
  const [entityTypeOptions, setEntityTypeOptions] = useState<{ label: string; value: string }[]>([]);
  const [stateOptions, setStateOptions] = useState<{ label: string; value: string }[]>([]);
  const [showStateDropdown, setShowStateDropdown] = useState(false);

  // Update entity types and state options when country changes
  useEffect(() => {
    const selectedCountry = formData.country;
    if (selectedCountry) {
      // Update entity types based on country
      const entityTypes = getEntityTypesForCountry(selectedCountry);
      setEntityTypeOptions(entityTypes);

      // Check if country has state dropdown
      const hasDropdown = hasStateDropdown(selectedCountry);
      setShowStateDropdown(hasDropdown);

      if (hasDropdown) {
        const states = getStatesForCountry(selectedCountry);
        setStateOptions(states || []);
      } else {
        setStateOptions([]);
      }

      // Clear entity type if it's not valid for the new country
      if (formData.entityType && !entityTypes.some(et => et.value === formData.entityType)) {
        onChange?.('entityType', '');
      }
    } else {
      // Default entity types for no country selected
      setEntityTypeOptions([
        { label: 'Corporation', value: 'corporation' },
        { label: 'Limited Liability Company', value: 'llc' },
        { label: 'Partnership', value: 'partnership' },
        { label: 'Limited Private Company', value: 'limited_private' },
      ]);
      setShowStateDropdown(false);
      setStateOptions([]);
    }
  }, [formData.country, formData.entityType, onChange]);

  return (
    <div className='space-y-6'>
      {/* Row 1 */}
      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
        <div className='space-y-2'>
          <label className='text-sm font-medium text-gray-900'>
            Country of Incorporation <span className='text-red-500'>*</span>
          </label>
          <Select
            value={formData.country || ''}
            onChange={val => onChange?.('country', val)}
            options={COUNTRY_OPTIONS}
            placeholder='Select Country'
            error={errors.country}
            searchable
            searchPlaceholder='Search countries...'
          />
        </div>
        <div className='space-y-2'>
          <label className='text-sm font-medium text-gray-900'>
            Entity Type <span className='text-red-500'>*</span>
          </label>
          <Select
            value={formData.entityType || ''}
            onChange={val => onChange?.('entityType', val)}
            options={entityTypeOptions}
            placeholder='Select entity type'
            error={errors.entityType}
          />
        </div>
      </div>

      {/* Row 2 */}
      <div>
        <div className='space-y-2'>
          <label className='text-sm font-medium text-gray-900'>
            Legal Business Name <span className='text-red-500'>*</span>
          </label>
          <Input
            value={formData.businessName || ''}
            onChange={e => onChange?.('businessName', e.target.value)}
            placeholder='Enter legal business name'
            error={errors.businessName}
          />
        </div>
      </div>

      {/* Row 3 */}
      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
        <div className='space-y-2'>
          <label className='text-sm font-medium text-gray-900'>
            Tax ID / EIN <span className='text-red-500'>*</span>
          </label>
          <Input
            value={formData.taxId || ''}
            onChange={e => onChange?.('taxId', e.target.value)}
            placeholder='Enter tax identification number'
            error={errors.taxId}
          />
        </div>
        <div className='space-y-2'>
          <label className='text-sm font-medium text-gray-900'>
            State / Region <span className='text-red-500'>*</span>
          </label>
          {showStateDropdown ? (
            <Select
              value={formData.state || ''}
              onChange={val => onChange?.('state', val)}
              options={stateOptions}
              placeholder='Select state or region'
              error={errors.state || errors['address.state']}
              searchable
              searchPlaceholder='Search states...'
            />
          ) : (
            <Input
              value={formData.state || ''}
              onChange={e => onChange?.('state', e.target.value)}
              placeholder='Enter state, region, or province'
              error={errors.state || errors['address.state']}
            />
          )}
        </div>
      </div>

      {/* Row 4 */}
      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
        <div className='space-y-2'>
          <label className='text-sm font-medium text-gray-900'>
            Street Address <span className='text-red-500'>*</span>
          </label>
          <Input
            value={formData.address || ''}
            onChange={e => onChange?.('address', e.target.value)}
            placeholder='Street address line 1'
            error={errors.address || errors['address.streetAddress']}
          />
        </div>
        <div className='space-y-2'>
          <label className='text-sm font-medium text-gray-900'>
            Apt. / Suite / Unit <span className='text-gray-400'>(Optional)</span>
          </label>
          <Input
            value={formData.apt || ''}
            onChange={e => onChange?.('apt', e.target.value)}
            placeholder='Enter apt., suite or unit number'
            error={errors.apt}
          />
        </div>
      </div>

      {/* Row 5 */}
      <div className='grid grid-cols-1 gap-6 md:grid-cols-2 border-b border-gray-200 pb-6'>
        <div className='space-y-2'>
          <label className='text-sm font-medium text-gray-900'>
            City <span className='text-red-500'>*</span>
          </label>
          <Input
            value={formData.city || ''}
            onChange={e => onChange?.('city', e.target.value)}
            placeholder='Enter city name'
            error={errors.city || errors['address.city']}
          />
        </div>
        <div className='space-y-2'>
          <label className='text-sm font-medium text-gray-900'>
            Postal Code <span className='text-red-500'>*</span>
          </label>
          <Input
            value={formData.postalCode || ''}
            onChange={e => onChange?.('postalCode', e.target.value)}
            placeholder='Enter postal / zip code'
            error={errors.postalCode || errors['address.postalCode']}
          />
        </div>
      </div>
    </div>
  );
}
