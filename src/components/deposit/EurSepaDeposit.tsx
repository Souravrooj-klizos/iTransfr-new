import { BankDetailsField } from '@/components/ui/BankDetailsField';

export function EurSepaDeposit() {
  return (
    <div className='space-y-6'>
      <h2 className='text-xl font-semibold text-gray-900'>EUR SEPA Deposit</h2>

      {/* Viban EUR Bank Details Section */}
      <div className='space-y-4'>
        <h3 className='text-base font-semibold text-gray-900'>Viban EUR Bank Details</h3>

        <div className='grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 md:grid-cols-2 lg:grid-cols-3'>
          <BankDetailsField label='Account Name' value='RWA Bridge LLC' />
          <BankDetailsField label='Currency' value='USD' />
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
          <BankDetailsField label='IBAN' value='EE936849400016400003686936' />
          <BankDetailsField label='BIC' value='EAPEESP2' />
        </div>
      </div>
    </div>
  );
}
