import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Building, Phone, Globe, Map } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: 'email' | 'password' | 'user' | 'building' | 'phone' | 'globe' | 'map' | 'none';
  error?: string;
}

export function FormInput({
  label,
  icon = 'none',
  error,
  type = 'text',
  className,
  ...props
}: FormInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  const IconComponent = {
    email: Mail,
    password: Lock,
    user: User,
    building: Building,
    phone: Phone,
    globe: Globe,
    map: Map,
    none: null,
  }[icon];

  return (
    <div className='w-full'>
      {label && <label className='mb-1.5 block text-sm font-medium text-gray-700'>{label}</label>}
      <div className='relative'>
        {/* Left Icon */}
        {IconComponent && (
          <div className='absolute top-1/2 left-3 -translate-y-1/2 text-gray-400'>
            <IconComponent className='h-5 w-5' />
          </div>
        )}

        {/* Input Field */}
        <input
          type={inputType}
          className={cn(
            'h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 transition-colors',
            'placeholder:text-gray-400',
            'focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none',
            'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-50',
            IconComponent && 'pl-10',
            isPassword && 'pr-10',
            error && 'border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        />

        {/* Password Toggle */}
        {isPassword && (
          <button
            type='button'
            onClick={() => setShowPassword(!showPassword)}
            className='absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600'
          >
            {showPassword ? <EyeOff className='h-5 w-5' /> : <Eye className='h-5 w-5' />}
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && <p className='mt-1.5 text-xs text-red-600'>{error}</p>}
    </div>
  );
}
