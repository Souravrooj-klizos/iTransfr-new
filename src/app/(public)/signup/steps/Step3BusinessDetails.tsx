import { Select } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/TextArea';

interface Step3Props {
  formData?: any;
  onChange?: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

const Step3BusinessDetails = ({ formData, onChange, errors = {} }: Step3Props) => {
  const industryOptions = [
    { value: 'retail', label: 'Retail' },
    { value: 'e-commerce', label: 'E-commerce' },
    { value: 'wholesale', label: 'Wholesale' },
    { value: 'other', label: 'Other' },
  ];

  const primaryUseCaseOptions = [
    { value: 'payment_processing', label: 'Payment Processing' },
    { value: 'online_transactions', label: 'Online Transactions' },
    { value: 'cash_management', label: 'Cash Management' },
  ];

  const expectedMonthlyVolumeOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ];

  return (
    <div className='space-y-6'>
      {/* Row 1 */}
      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
        <div className='space-y-2'>
          <label className='text-sm font-medium text-gray-900'>
            Industry <span className='text-red-500'>*</span>
          </label>
          <Select
            value={formData.industry || ''}
            onChange={val => onChange?.('industry', val)}
            options={industryOptions}
            placeholder='Select Industry'
            error={errors.industry}
          />
        </div>
        <div className='space-y-2'>
          <label className='text-sm font-medium text-gray-900'>
            Website <span className='text-gray-400'>(Optional)</span>
          </label>
          <Input
            value={formData.website || ''}
            onChange={e => onChange?.('website', e.target.value)}
            placeholder='Enter website URL'
            error={errors.website}
          />
        </div>
      </div>

      {/* Row 2 */}
      <div>
        <div className='space-y-2'>
          <label className='text-sm font-medium text-gray-900'>
            Business Description <span className='text-red-500'>*</span>
          </label>
          <Textarea
            value={formData.businessDescription || ''}
            onChange={e => onChange?.('businessDescription', e.target.value)}
            placeholder='Describe the nature of the business, products / services offered and target markets...'
            error={errors.businessDescription}
          />
        </div>
      </div>

      {/* Row 3 */}
      <div className='grid grid-cols-1 gap-6 border-b border-gray-200 pb-6 md:grid-cols-2'>
        <div className='space-y-2'>
          <label className='text-sm font-medium text-gray-900'>Expected Monthly Volume</label>
          <Select
            value={formData.expectedMonthlyVolume || ''}
            onChange={val => onChange?.('expectedMonthlyVolume', val)}
            options={expectedMonthlyVolumeOptions}
            placeholder='Select range'
            direction='up'
            error={errors.expectedMonthlyVolume}
          />
        </div>
        <div className='space-y-2'>
          <label className='text-sm font-medium text-gray-900'>Primary Use Case</label>
          <Select
            value={formData.primaryUseCase || ''}
            onChange={val => onChange?.('primaryUseCase', val)}
            options={primaryUseCaseOptions}
            placeholder='Select use case'
            direction='up'
            error={errors.primaryUseCase}
          />
        </div>
      </div>
    </div>
  );
};

export default Step3BusinessDetails;
