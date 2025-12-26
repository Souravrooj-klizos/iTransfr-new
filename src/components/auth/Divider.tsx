import React from 'react';

interface DividerProps {
  text?: string;
}

export function Divider({ text = 'or continue with' }: DividerProps) {
  return (
    <div className='relative my-6 flex items-center justify-center'>
      <div className='absolute inset-0 flex items-center'>
        <div className='w-full border-t border-gray-300'></div>
      </div>
      <div className='relative bg-white px-4'>
        <span className='text-xs text-gray-500'>{text}</span>
      </div>
    </div>
  );
}
