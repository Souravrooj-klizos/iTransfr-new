import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/utils';

interface Step4Props {
  formData?: any;
  onChange?: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

export function Step4VolumeOperations({ formData = {}, onChange, errors = {} }: Step4Props) {
  // Volume Options
  const volumeOptions = [
    { value: '0-10k', label: '$0 - $10k' },
    { value: '10k-50k', label: '$10k - $50k' },
    { value: '50k-100k', label: '$50k - $100k' },
    { value: '100k+', label: '$100k+' },
  ];

  // Currencies
  const curriences = [
    { id: 'USD', name: 'USD - US Dollars' },
    { id: 'EUR', name: 'EUR - Euro' },
    { id: 'GBP', name: 'GBP - British Pound' },
    { id: 'BRL', name: 'BRL - Brazilian Real' },
    { id: 'CNY', name: 'CNY - Chinese Yuan' },
    { id: 'COP', name: 'COP - Colombian Peso' },
    { id: 'MXN', name: 'MXN - Mexican Peso' },
  ];

  // Regions
  const regions = [
    { id: 'north_america', name: 'North America' },
    { id: 'latam', name: 'Latin America & Caribbean' },
    { id: 'europe', name: 'Europe' },
    { id: 'mea', name: 'Middle East & Africa' },
    { id: 'apac', name: 'Asia Pacific' },
  ];

  // North America Sub-regions
  const naSubRegions = ['United States', 'Canada', 'Mexico'];

  const toggleCurrency = (currencyId: string) => {
    const current = (formData.currencies as string[]) || [];
    const updated = current.includes(currencyId)
      ? current.filter(c => c !== currencyId)
      : [...current, currencyId];
    onChange?.('currencies', updated);
  };

  return (
    <div className='space-y-8 pr-2'>
      {/* 1. Expected Monthly Volumes */}
      <section className='border-b border-gray-200 pb-6'>
        <h3 className='mb-4 text-base font-medium text-gray-900'>Expected Monthly Volumes</h3>
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
          {/* Row 1 */}
          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-900'>SWIFT / Wire Transfers</label>
            <Select
              value={formData.volumeSwift || ''}
              onChange={val => onChange?.('volumeSwift', val)}
              options={volumeOptions}
              placeholder='Select range'
            />
          </div>
          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-900'>
              Local Payments <span className='text-gray-400'>(ACH / SEPA)</span>
            </label>
            <Select
              value={formData.volumeLocal || ''}
              onChange={val => onChange?.('volumeLocal', val)}
              options={volumeOptions}
              placeholder='Select range'
            />
          </div>

          {/* Row 2 */}
          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-900'>Digital Assets / Crypto</label>
            <Select
              value={formData.volumeCrypto || ''}
              onChange={val => onChange?.('volumeCrypto', val)}
              options={volumeOptions}
              placeholder='Select range'
            />
          </div>
          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-900'>
              No. of International Payments
            </label>
            <Select
              value={formData.volumeInternationalCnt || ''}
              onChange={val => onChange?.('volumeInternationalCnt', val)}
              options={volumeOptions}
              placeholder='Select range'
            />
          </div>

          {/* Row 3 */}
          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-900'>No. of Local Payments</label>
            <Select
              value={formData.volumeLocalCnt || ''}
              onChange={val => onChange?.('volumeLocalCnt', val)}
              options={volumeOptions}
              placeholder='Select range'
            />
          </div>
        </div>
      </section>

      {/* 2. Currencies Needed */}
      <section className='border-b border-gray-200 pb-6'>
        <h3 className='mb-4 text-base font-medium text-gray-900'>
          Currencies Needed <span className='text-red-500'>*</span>
        </h3>
        <div className='flex flex-wrap gap-3'>
          {curriences.map(currency => {
            const isSelected = (formData.currencies || []).includes(currency.id);
            return (
              <button
                key={currency.id}
                onClick={() => toggleCurrency(currency.id)}
                className={cn(
                  'cursor-pointer rounded-lg border px-4 py-2 text-sm transition-colors',
                  isSelected
                    ? 'border-blue-500 bg-blue-50 text-blue-500'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                )}
              >
                {currency.name}
              </button>
            );
          })}
        </div>
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
          Select the regions where your client operates or sends / receives payments
        </p>

        <div className='space-y-3'>
          {regions.map(region => {
            const isSelected = formData.region === region.id;

            return (
              <div
                key={region.id}
                className={cn(
                  'overflow-hidden rounded-xl border transition-all',
                  isSelected ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'
                )}
              >
                {/* Header / Clickable Area */}
                <div
                  onClick={() => onChange?.('region', region.id)}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 bg-white px-4 py-3 text-sm',
                    isSelected ? 'bg-white' : 'hover:bg-gray-50'
                  )}
                >
                  {/* Radio Icon */}
                  <div
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full border',
                      isSelected ? 'border-blue-600' : 'border-gray-300'
                    )}
                  >
                    {isSelected && <div className='h-2.5 w-2.5 rounded-full bg-blue-600' />}
                  </div>

                  <span className='text-gray-700'>{region.name}</span>
                </div>

                {/* Expanded Content (Only for North America) */}
                {isSelected && region.id === 'north_america' && (
                  <div className='bg-white px-4 pb-4 pl-12'>
                    <div className='flex flex-wrap gap-2'>
                      {naSubRegions.map(sub => (
                        <div
                          key={sub}
                          className='rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600'
                        >
                          {sub}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {errors.primaryOperatingRegions && (
          <p className='mt-2 text-xs text-red-500'>{errors.primaryOperatingRegions}</p>
        )}
      </section>
    </div>
  );
}
