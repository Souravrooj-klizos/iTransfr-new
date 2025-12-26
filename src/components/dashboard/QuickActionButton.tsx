import Link from 'next/link';

interface QuickActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: 'primary' | 'default';
}

export function QuickActionButton({
  icon,
  label,
  onClick,
  href,
  variant = 'default',
}: QuickActionButtonProps) {
  const isPrimary = variant === 'primary';

  const ButtonContent = () => (
    <div
      className={`group flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-xl border p-4 transition-all ${
        isPrimary
          ? 'bg-gradient-blue border-none'
          : 'border-gray-200 bg-white hover:border-blue-500 hover:shadow-md'
      }`}
    >
      <div
        className={`mb-3 flex items-center justify-center rounded-full transition-colors ${
          isPrimary ? 'text-white' : 'text-gray-600 group-hover:text-blue-600'
        }`}
      >
        {icon}
      </div>
      <span
        className={`text-center text-xs font-medium transition-colors ${
          isPrimary ? 'text-white' : 'text-gray-700 group-hover:text-blue-600'
        }`}
      >
        {label}
      </span>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className='block h-full w-full' onClick={onClick}>
        <ButtonContent />
      </Link>
    );
  }

  return (
    <button onClick={onClick} className='h-full w-full border-none bg-transparent p-0 text-left'>
      <ButtonContent />
    </button>
  );
}

import React from 'react';
