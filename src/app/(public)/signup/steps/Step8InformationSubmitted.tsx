interface Step8Props {
  formData?: any;
  onChange?: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

export function Step8InformationSubmitted({ formData = {}, onChange, errors = {} }: Step8Props) {
  return (
    <div className='space-y-8'>

      {/* Warning Notice Section */}
      <section className='space-y-4'>
        <div className='inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1'>
          <div className='h-2 w-2 rounded-full bg-orange-500' />
          <span className='text-[11px] font-bold uppercase tracking-wide text-orange-400'>
            COMPLIANCE VERIFICATION IN PROGRESS
          </span>
        </div>

        <p className='text-sm leading-relaxed text-gray-900'>
          We are now reviewing your information and documents as part of our compliance and verification process.
          This review is required before your account can be activated.
        </p>

        <div className='space-y-3 pt-2'>
          <h4 className='text-sm font-medium text-gray-900'>What to expect next:</h4>
          <ul className='space-y-2 pl-1'>
            <li className='flex items-center gap-2 text-sm text-gray-700'>
              <span className='h-1 w-1 rounded-full bg-gray-400' />
              Our compliance team will review your submission
            </li>
            <li className='flex items-center gap-2 text-sm text-gray-700'>
              <span className='h-1 w-1 rounded-full bg-gray-400' />
              Additional information may be requested if needed
            </li>
            <li className='flex items-center gap-2 text-sm text-gray-700'>
              <span className='h-1 w-1 rounded-full bg-gray-400' />
              You will be notified by email once the review is complete
            </li>
          </ul>
        </div>

        <p className='text-sm text-gray-800'>
          Typical review time: <span className='font-medium'>1–3 business days</span>. <span className='text-gray-500'>(Some applications may require additional review.)</span>
        </p>
      </section>

      {/* Footer Section */}
      <section className='space-y-8 border-t border-gray-100 pt-8 text-center'>
        <p className='text-xs text-gray-600'>
          If we need anything further, our team will contact you using the email address provided during onboarding.
        </p>

        <button className='rounded-lg border border-gray-200 bg-white px-6 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900'>
          You may safely close this tab
        </button>
      </section>
    </div>
  );
}
