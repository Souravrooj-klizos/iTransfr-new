import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import React from 'react';

interface SignupStepWrapperProps {
  children: React.ReactNode;
  step: number;
  totalSteps?: number;
  title: string;
  subtitle?: string;
  onNext?: () => void;
  onBack?: () => void;
  showNext?: boolean;
  showBack?: boolean;
  nextLabel?: string;
  backLabel?: string;
  disableNext?: boolean;
  className?: string;
}

export function SignupStepWrapper({
  children,
  step,
  totalSteps = 8,
  title,
  subtitle,
  onNext,
  onBack,
  showNext = true,
  showBack = false,
  nextLabel = 'Continue',
  backLabel = 'Go Back',
  disableNext = false,
  className,
}: SignupStepWrapperProps) {
  return (
    <div className='flex w-full flex-col items-center p-4'>
      <div className='flex w-full flex-1 items-center justify-center'>
        <div
          className={cn(
            'w-full max-w-[800px] rounded-2xl bg-white p-6 shadow-sm md:p-8',
            className
          )}
        >
          {/* Header: Logo and Step Count */}
          <div className='mb-8 flex items-start justify-between'>
            <div className='flex items-center gap-2'>
              {/* Using img tags as in AuthCard, assuming these exist in public */}
              <img src='/logo_dark.svg' alt='iTransfr Icon' className='h-8 w-auto' />
              <img src='/vector.svg' alt='iTransfr' className='h-6 w-auto' />
            </div>
            <div className='text-sm text-gray-500'>
              Step {step} of {totalSteps}
            </div>
          </div>

          {/* Title and Subtitle */}
          <div className='mb-6'>
            <h1 className='mb-2 text-3xl font-semibold text-gray-900'>{title}</h1>
            {subtitle && <p className='text-gray-600'>{subtitle}</p>}
          </div>

          <div className='mb-8 flex gap-2'>
            {Array.from({ length: totalSteps }).map((_, i) => {
              const currentStepNumber = i + 1;
              let bgColor = 'bg-gray-200';
              if (currentStepNumber < step) {
                bgColor = 'bg-green-600';
              } else if (currentStepNumber === step) {
                bgColor = 'bg-blue-600';
              }

              return <div key={i} className={cn('h-1 flex-1 rounded-full', bgColor)} />;
            })}
          </div>

          {/* Content */}
          <div className='mb-4 max-h-[50vh] overflow-y-auto'>{children}</div>

          {/* Footer Buttons */}
          <div className='flex items-center justify-between'>
            {showBack ? (
              <Button
                variant='outline'
                onClick={onBack}
                className='cursor-pointer px-8 text-gray-400 hover:text-gray-600'
              >
                {backLabel}
              </Button>
            ) : (
              <div></div> /* Spacer */
            )}

            {showNext && (
              <Button
                onClick={onNext}
                disabled={disableNext}
                className='bg-gradient-blue cursor-pointer px-8 text-white transition-all hover:bg-blue-700'
              >
                {nextLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
      {/* Copyright */}
      <div className='fixed bottom-4 mt-8 w-full text-center text-xs font-light text-gray-500'>
        <p>Copyright © 2025 iTransfr.</p>
        <div className='mt-1 flex justify-center gap-3'>
          <a href='#' className='underline'>
            Agreement
          </a>
          <a href='#' className='underline'>
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  );
}
