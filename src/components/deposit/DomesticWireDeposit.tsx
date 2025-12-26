import { BankDetailsField } from '@/components/ui/BankDetailsField';

export function DomesticWireDeposit() {
  return (
    <div className='space-y-6'>
      <h2 className='text-xl font-semibold text-gray-900'>Domestic U.S. Wire Transfer Deposit</h2>

      {/* Bank Details Section */}
      <div className='space-y-4'>
        <h3 className='text-base font-semibold text-gray-900'>Bank Details</h3>

        <div className='grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 md:grid-cols-2 lg:grid-cols-3'>
          <BankDetailsField label='Bank Name' value='Lead Bank' />
          <BankDetailsField label='Account Name' value='RWA Bridge LLC' />
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
          <BankDetailsField label='Account Number' value='1234567890' />
          <BankDetailsField label='Routing Number' value='021000021' />
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
          <BankDetailsField label='Swift Code' value='LEADUS33' />
          <BankDetailsField label='Address' value='123 Banking St., New York, NY 10001' />
        </div>
      </div>
    </div>
  );
}
