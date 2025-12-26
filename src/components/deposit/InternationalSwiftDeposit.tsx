import { BankDetailsField } from '@/components/ui/BankDetailsField';
import { ImportantNotes } from '@/components/ui/ImportantNotes';

export function InternationalSwiftDeposit() {
  return (
    <div className='space-y-6'>
      <h2 className='text-xl font-semibold text-gray-900'>International SWIFT Deposit (USD)</h2>

      {/* BBVA Bank Details Section */}
      <div className='space-y-4'>
        <h3 className='text-base font-semibold text-gray-900'>BBVA Bank Details</h3>

        <div className='grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 md:grid-cols-2 lg:grid-cols-3'>
          <BankDetailsField label='Beneficiary Name' value='System Pay Services Malta Limited' />
          <BankDetailsField label='Account Number' value='ES9401828393949300004487' />
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
          <BankDetailsField label='Swift Code' value='BBVAESMAXXX' />
          <BankDetailsField
            label='Bank Name'
            value='Banco Bilbao Vizcaya Argentaria, S.A. (BBVA)'
          />
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
          <BankDetailsField label='Currency' value='USD' />
          <div className='flex flex-col gap-2'>
            <label className='text-sm font-medium text-gray-700'>
              Payment Reference <span className='text-red-600'>*</span>
            </label>
            <BankDetailsField
              label=''
              value='REF-4371049'
              valueClassName='text-sm text-blue-500 font-semibold tracking-widest'
            />
          </div>
        </div>
      </div>
    </div>
  );
}
