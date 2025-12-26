import { cn } from '@/lib/utils';

interface Step6Props {
  formData?: any;
  onChange?: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

export function Step6PEPSanctionsScreening({ formData = {}, onChange, errors = {} }: Step6Props) {
  // Helper function to render Yes/No radio buttons
  const renderYesNoRadio = (field: string, value: boolean | null) => {
    return (
      <div className='flex items-center gap-4'>
        {/* Yes Option */}
        <div
          onClick={() => onChange?.(field, true)}
          className='flex cursor-pointer items-center gap-2'
        >
          <div
            className={cn(
              'flex h-5 w-5 items-center justify-center rounded-full border',
              value === true ? 'border-blue-600' : 'border-gray-300'
            )}
          >
            {value === true && <div className='h-2.5 w-2.5 rounded-full bg-blue-600' />}
          </div>
          <span className='text-sm text-gray-700'>Yes</span>
        </div>

        {/* No Option */}
        <div
          onClick={() => onChange?.(field, false)}
          className='flex cursor-pointer items-center gap-2'
        >
          <div
            className={cn(
              'flex h-5 w-5 items-center justify-center rounded-full border',
              value === false ? 'border-blue-600' : 'border-gray-300'
            )}
          >
            {value === false && <div className='h-2.5 w-2.5 rounded-full bg-blue-600' />}
          </div>
          <span className='text-sm text-gray-700'>No</span>
        </div>
      </div>
    );
  };

  return (
    <div className='space-y-8 pr-2'>
      {/* Questions Section */}
      <section className='mb-2 space-y-3'>
        {/* Question 1 */}
        <div className='space-y-2 rounded-xl border border-gray-200 p-3'>
          <p className='text-sm leading-relaxed font-medium text-gray-900'>
            Are you, or any beneficial owner, a senior official in the executive, legislative,
            administrative, military, or judicial branch of any government (elected or not)?
          </p>
          {renderYesNoRadio('isPEPSeniorOfficial', formData.isPEPSeniorOfficial)}
        </div>

        {/* Question 2 */}
        <div className='space-y-2 rounded-xl border border-gray-200 p-3'>
          <p className='text-sm leading-relaxed font-medium text-gray-900'>
            Are you, or any beneficial owner, a senior official of a major political party or senior
            executive of a government-owned enterprise?
          </p>
          {renderYesNoRadio('isPEPPoliticalParty', formData.isPEPPoliticalParty)}
        </div>

        {/* Question 3 */}
        <div className='space-y-2 rounded-xl border border-gray-200 p-3'>
          <p className='text-sm leading-relaxed font-medium text-gray-900'>
            Are you, or any beneficial owner, an immediate family member (spouse, parent, sibling,
            child, or in- law) of any person described above?
          </p>
          {renderYesNoRadio('isPEPFamilyMember', formData.isPEPFamilyMember)}
        </div>

        {/* Question 4 */}
        <div className='space-y-2 rounded-xl border border-gray-200 p-3'>
          <p className='text-sm leading-relaxed font-medium text-gray-900'>
            Are you, or any beneficial owner, a close associate (business partner, advisor,
            consultant) of any politically exposed person?
          </p>
          {renderYesNoRadio('isPEPCloseAssociate', formData.isPEPCloseAssociate)}
        </div>

        {/* Sanctions Screening Notice */}
        <div className='rounded-lg border border-orange-200 bg-orange-50 p-4'>
          <p className='text-xs leading-relaxed text-yellow-600'>
            <span className='font-medium'>Sanctions Screening:</span> All clients are automatically
            screened against{' '}
            <span className='font-medium'>
              OFAC SDN, OFAC Consolidated Sanctions, FinCEN 311, UN Security Council, and EU
              Consolidated Sanctions lists.
            </span>
          </p>
        </div>
      </section>
    </div>
  );
}
