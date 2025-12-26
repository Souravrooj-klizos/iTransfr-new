'use client';

import { OTPInput } from '@/components/ui/OTPInput';
import { useToast } from '@/components/ui/Toast';
import { getFirstError, otpSchema } from '@/lib/validations/auth';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Step2Props {
  formData: any;
  onNext: (otp: string) => void;
}

export function Step2Verification({ formData, onNext }: Step2Props) {
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState('');
  const toast = useToast();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleResend = async () => {
    setLoading(true);
    setTimer(30);
    setCanResend(false);
    try {
      await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      toast.success('Code Sent', 'A new verification code has been sent to your email.');
    } catch (error) {
      toast.error('Failed to Send', 'Could not resend verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = (enteredOtp: string) => {
    setOtp(enteredOtp);
    setFieldError('');
  };

  const handleVerify = async () => {
    setFieldError('');

    // Validate with Zod
    const result = otpSchema.safeParse({ otp });

    if (!result.success) {
      const errorMessage = getFirstError(result.error);
      setFieldError(errorMessage);
      toast.error('Validation Error', errorMessage);
      return;
    }

    setLoading(true);
    try {
      await onNext(otp);
    } catch (error) {
      toast.error('Verification Failed', 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='relative space-y-6'>
      {loading && (
        <div className='bg-opacity-75 absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white'>
          <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600'></div>
        </div>
      )}

      <div className='mb-8 text-center'>
        <h2 className='mb-2 text-xl font-semibold text-gray-900'>Check your email for a code</h2>
        <p className='text-sm text-gray-600'>
          We have sent a verification code to{' '}
          <span className='font-medium text-gray-900'>{formData.email || 'user@example.com'}</span>
        </p>
      </div>

      <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
        <div className='mb-4 flex items-center justify-between'>
          <span className='text-sm text-gray-600'>Enter code</span>
          <button
            onClick={handleResend}
            disabled={!canResend || loading}
            className={`cursor-pointer text-xs ${canResend && !loading ? 'text-blue-600 hover:text-blue-700' : 'cursor-not-allowed text-gray-400'}`}
          >
            {loading && !canResend
              ? 'Sending...'
              : canResend
                ? 'Resend Code'
                : `Resend Code (${timer}s)`}
          </button>
        </div>

        <OTPInput length={5} onComplete={handleComplete} />
        {fieldError && <p className='mt-2 text-xs text-red-500'>{fieldError}</p>}
      </div>

      <button
        onClick={handleVerify}
        disabled={!otp || otp.length !== 5 || loading}
        className='h-11 w-full cursor-pointer rounded-[10px] bg-gradient-to-b from-[#588CFF] to-[#2462EB] font-medium text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50'
      >
        {loading ? 'Verifying...' : 'Verify & Continue'}
      </button>

      <div className='mt-4 text-center'>
        <p className='text-sm text-gray-600'>
          Already have an account?{' '}
          <Link href='/login' className='font-medium text-blue-600 hover:text-blue-700'>
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
