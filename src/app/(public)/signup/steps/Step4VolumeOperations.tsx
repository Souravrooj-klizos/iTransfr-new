import { Select } from '@/components/ui/Select';
import {
  VOLUME_OPTIONS,
  TRANSACTION_COUNT_OPTIONS,
  OPERATING_CURRENCIES,
  OPERATING_REGIONS,
  NORTH_AMERICA_SUBREGIONS,
} from '@/lib/constants/business';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Step4Props {
  formData?: any;
  onChange?: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

export function Step4VolumeOperations({ formData = {}, onChange, errors = {} }: Step4Props) {
  // Toggle currency selection
  const toggleCurrency = (currencyId: string) => {
    const current = (formData.currencies as string[]) || [];
    const updated = current.includes(currencyId)
      ? current.filter(c => c !== currencyId)
      : [...current, currencyId];
    onChange?.('currencies', updated);
  };

  // Toggle region selection (multi-select)
  const toggleRegion = (regionId: string) => {
    const current = (formData.regions as string[]) || [];
    const updated = current.includes(regionId)
      ? current.filter(r => r !== regionId)
      : [...current, regionId];
    onChange?.('regions', updated);
  };

  const isRegionSelected = (regionId: string) => {
    return (formData.regions || []).includes(regionId);
  };

  return (
    <div className='space-y-8 pr-2'>
      {/* 1. Expected Monthly Volumes */}
      <section className='border-b border-gray-200 pb-6'>
        <h3 className='mb-4 text-base font-medium text-gray-900'>Expected Monthly Volumes</h3>
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
          {/* Row 1 */}
          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-900'>
              SWIFT / Wire Transfers <span className='text-red-500'>*</span>
            </label>
            <Select
              value={formData.volumeSwift || ''}
              onChange={val => onChange?.('volumeSwift', val)}
              options={VOLUME_OPTIONS}
              placeholder='Select range'
              error={errors.volumeSwift}
            />
          </div>
          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-900'>
              Local Payments <span className='text-gray-400'>(ACH / SEPA)</span>
            </label>
            <Select
              value={formData.volumeLocal || ''}
              onChange={val => onChange?.('volumeLocal', val)}
              options={VOLUME_OPTIONS}
              placeholder='Select range'
              error={errors.volumeLocal}
            />
          </div>

          {/* Row 2 */}
          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-900'>Digital Assets / Crypto</label>
            <Select
              value={formData.volumeCrypto || ''}
              onChange={val => onChange?.('volumeCrypto', val)}
              options={VOLUME_OPTIONS}
              placeholder='Select range'
              error={errors.volumeCrypto}
            />
          </div>
          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-900'>
              Fiat Conversion Volume
            </label>
            <Select
              value={formData.volumeFiatConversion || ''}
              onChange={val => onChange?.('volumeFiatConversion', val)}
              options={VOLUME_OPTIONS}
              placeholder='Select range'
              error={errors.volumeFiatConversion}
            />
          </div>

          {/* Row 3: Transaction Counts */}
          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-900'>
              No. of International Payments <span className='text-gray-400'>(per month)</span>
            </label>
            <Select
              value={formData.volumeInternationalCnt || ''}
              onChange={val => onChange?.('volumeInternationalCnt', val)}
              options={TRANSACTION_COUNT_OPTIONS}
              placeholder='Select range'
              error={errors.volumeInternationalCnt}
            />
          </div>
          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-900'>
              No. of Local Payments <span className='text-gray-400'>(per month)</span>
            </label>
            <Select
              value={formData.volumeLocalCnt || ''}
              onChange={val => onChange?.('volumeLocalCnt', val)}
              options={TRANSACTION_COUNT_OPTIONS}
              placeholder='Select range'
              error={errors.volumeLocalCnt}
            />
          </div>
        </div>
      </section>

      {/* 2. Currencies Needed */}
      <section className='border-b border-gray-200 pb-6'>
        <h3 className='mb-2 text-base font-medium text-gray-900'>
          Currencies Needed <span className='text-red-500'>*</span>
        </h3>
        <p className='mb-4 text-sm text-gray-500'>
          Select all currencies you need for your business operations
        </p>
        <div className='flex flex-wrap gap-3'>
          {OPERATING_CURRENCIES.map(currency => {
            const isSelected = (formData.currencies || []).includes(currency.value);
            return (
              <button
                key={currency.value}
                type='button'
                onClick={() => toggleCurrency(currency.value)}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-all',
                  isSelected
                    ? 'border-blue-500 bg-blue-50 text-blue-600 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                )}
              >
                {isSelected && <Check className='h-4 w-4' />}
                {currency.label}
              </button>
            );
          })}
        </div>
        {errors.currencies && (
          <p className='mt-2 text-xs text-red-500'>{errors.currencies}</p>
        )}
        {errors.operatingCurrencies && (
          <p className='mt-2 text-xs text-red-500'>{errors.operatingCurrencies}</p>
        )}
      </section>

      {/* 3. Regions of Operation */}
      <section className='border-b border-gray-200 pb-6'>
        <h3 className='mb-2 text-base font-medium text-gray-900'>
          Regions of Operation <span className='text-red-500'>*</span>
        </h3>
        <p className='mb-4 text-sm text-gray-500'>
          Select all regions where your business operates or sends/receives payments
        </p>

        <div className='space-y-3'>
          {OPERATING_REGIONS.map(region => {
            const isSelected = isRegionSelected(region.value);

            return (
              <div
                key={region.value}
                className={cn(
                  'overflow-hidden rounded-xl border transition-all',
                  isSelected ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'
                )}
              >
                {/* Header / Clickable Area */}
                <div
                  onClick={() => toggleRegion(region.value)}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 px-4 py-3 text-sm',
                    isSelected ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'
                  )}
                >
                  {/* Checkbox Icon */}
                  <div
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded border transition-colors',
                      isSelected
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-gray-300 bg-white'
                    )}
                  >
                    {isSelected && <Check className='h-3.5 w-3.5 text-white' />}
                  </div>

                  <span className={cn('font-medium', isSelected ? 'text-blue-700' : 'text-gray-700')}>
                    {region.label}
                  </span>
                </div>

                {/* Expanded Content (Only for North America when selected) */}
                {isSelected && region.value === 'north_america' && (
                  <div className='border-t border-blue-200 bg-blue-50/50 px-4 py-3 pl-12'>
                    <p className='mb-2 text-xs text-gray-500'>Countries included:</p>
                    <div className='flex flex-wrap gap-2'>
                      {NORTH_AMERICA_SUBREGIONS.map(sub => (
                        <div
                          key={sub}
                          className='rounded-md border border-blue-200 bg-white px-3 py-1.5 text-sm text-blue-700'
                        >
                          {sub}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expanded Content for LATAM */}
                {isSelected && region.value === 'latam' && (
                  <div className='border-t border-blue-200 bg-blue-50/50 px-4 py-3 pl-12'>
                    <p className='mb-2 text-xs text-gray-500'>Key markets included:</p>
                    <div className='flex flex-wrap gap-2'>
                      {['Brazil', 'Colombia', 'Argentina', 'Chile', 'Peru'].map(country => (
                        <div
                          key={country}
                          className='rounded-md border border-blue-200 bg-white px-3 py-1.5 text-sm text-blue-700'
                        >
                          {country}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expanded Content for Europe */}
                {isSelected && region.value === 'europe' && (
                  <div className='border-t border-blue-200 bg-blue-50/50 px-4 py-3 pl-12'>
                    <p className='mb-2 text-xs text-gray-500'>Key markets included:</p>
                    <div className='flex flex-wrap gap-2'>
                      {['UK', 'Germany', 'France', 'Spain', 'Netherlands'].map(country => (
                        <div
                          key={country}
                          className='rounded-md border border-blue-200 bg-white px-3 py-1.5 text-sm text-blue-700'
                        >
                          {country}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expanded Content for APAC */}
                {isSelected && region.value === 'apac' && (
                  <div className='border-t border-blue-200 bg-blue-50/50 px-4 py-3 pl-12'>
                    <p className='mb-2 text-xs text-gray-500'>Key markets included:</p>
                    <div className='flex flex-wrap gap-2'>
                      {['Singapore', 'Hong Kong', 'Japan', 'Australia', 'India'].map(country => (
                        <div
                          key={country}
                          className='rounded-md border border-blue-200 bg-white px-3 py-1.5 text-sm text-blue-700'
                        >
                          {country}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expanded Content for MEA */}
                {isSelected && region.value === 'mea' && (
                  <div className='border-t border-blue-200 bg-blue-50/50 px-4 py-3 pl-12'>
                    <p className='mb-2 text-xs text-gray-500'>Key markets included:</p>
                    <div className='flex flex-wrap gap-2'>
                      {['UAE', 'Saudi Arabia', 'South Africa', 'Egypt', 'Nigeria'].map(country => (
                        <div
                          key={country}
                          className='rounded-md border border-blue-200 bg-white px-3 py-1.5 text-sm text-blue-700'
                        >
                          {country}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {errors.regions && (
          <p className='mt-2 text-xs text-red-500'>{errors.regions}</p>
        )}
        {errors.primaryOperatingRegions && (
          <p className='mt-2 text-xs text-red-500'>{errors.primaryOperatingRegions}</p>
        )}
      </section>

      {/* Selected Summary */}
      {((formData.currencies?.length > 0) || (formData.regions?.length > 0)) && (
        <section className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
          <h4 className='mb-3 text-sm font-medium text-gray-700'>Selected Summary</h4>
          <div className='space-y-2'>
            {formData.currencies?.length > 0 && (
              <div className='flex items-start gap-2'>
                <span className='text-sm text-gray-500'>Currencies:</span>
                <span className='text-sm font-medium text-gray-900'>
                  {formData.currencies.join(', ')}
                </span>
              </div>
            )}
            {formData.regions?.length > 0 && (
              <div className='flex items-start gap-2'>
                <span className='text-sm text-gray-500'>Regions:</span>
                <span className='text-sm font-medium text-gray-900'>
                  {formData.regions
                    .map((r: string) => OPERATING_REGIONS.find(reg => reg.value === r)?.label || r)
                    .join(', ')}
                </span>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
