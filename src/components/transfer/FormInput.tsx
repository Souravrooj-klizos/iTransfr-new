interface FormInputProps {
  label?: string;
  type?: 'text' | 'number';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showMax?: boolean;
  required?: boolean;
}

export function FormInput({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  showMax = false,
  required = false,
}: FormInputProps) {
  return (
    <div className='w-full'>
      {label && (
        <label className='mb-2 block text-sm font-medium text-gray-700'>
          {label}
          {required && <span className='ml-1 text-red-500'>*</span>}
        </label>
      )}
      <div className='relative'>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className='h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-50'
        />
        {showMax && (
          <button
            type='button'
            onClick={() => {
              // Handle max click - you can implement this to set max balance
            }}
            className='absolute top-1/2 right-4 -translate-y-1/2 transform text-sm font-medium text-gray-500 transition-colors hover:text-gray-700'
          >
            Max
          </button>
        )}
      </div>
    </div>
  );
}
