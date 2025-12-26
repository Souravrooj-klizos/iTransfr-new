'use client';

import { AuthCard } from '@/components/auth/AuthCard';
import { Divider } from '@/components/auth/Divider';
import { FormCheckbox } from '@/components/auth/FormCheckbox';
import { FormInput } from '@/components/auth/FormInput';
import { OAuthButton } from '@/components/auth/OAuthButton';
import { useToast } from '@/components/ui/Toast';
import { createClient } from '@/lib/supabase/client';
import { getFirstError, loginSchema } from '@/lib/validations/auth';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  /* useRef imported above */
  const toastShownRef = useRef(false);

  useEffect(() => {
    // Check for error in URL params
    const error = searchParams.get('error');
    if (error && !toastShownRef.current) {
      toastShownRef.current = true;
      // Show error toast
      // Small delay to ensure UI is ready
      setTimeout(() => {
        toast.error('Login Failed', error);
      }, 500);

      // Optional: remove the error from URL after a longer delay (e.g. 5 seconds) to keep the static alert visible for a bit
      setTimeout(() => {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('error');
        window.history.replaceState({}, '', newUrl.toString());
      }, 5000);
    }
  }, [searchParams, toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    // Validate with Zod
    const result = loginSchema.safeParse({ email, password });

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        const field = err.path[0] as string;
        if (!errors[field]) {
          errors[field] = err.message;
        }
      });
      setFieldErrors(errors);
      toast.error('Validation Error', getFirstError(result.error));
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error('Login Failed', error.message);
        return;
      }

      toast.success('Welcome back!', 'You have been logged in successfully.');
      router.push('/dashboard');
    } catch (error) {
      toast.error('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);

      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/oauth-callback?flow=login`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        toast.error('Google Login Failed', error.message);
        return;
      }
    } catch (err: any) {
      toast.error('Error', 'Failed to initiate Google login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title='Log in to your Account' subtitle='Welcome back! Select method to log in'>
      {/* Error Alert Fallback */}
      {searchParams.get('error') && (
        <div className='mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600 ring-1 ring-red-200'>
          {searchParams.get('error')}
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleLogin} className='space-y-4' noValidate>
        <div>
          <FormInput
            icon='email'
            type='email'
            placeholder='Email'
            value={email}
            onChange={e => {
              setEmail(e.target.value);
              if (fieldErrors.email) {
                setFieldErrors(prev => ({ ...prev, email: '' }));
              }
            }}
          />
          {fieldErrors.email && <p className='mt-1 text-xs text-red-500'>{fieldErrors.email}</p>}
        </div>

        <div>
          <FormInput
            icon='password'
            type='password'
            placeholder='Password'
            value={password}
            onChange={e => {
              setPassword(e.target.value);
              if (fieldErrors.password) {
                setFieldErrors(prev => ({ ...prev, password: '' }));
              }
            }}
          />
          {fieldErrors.password && (
            <p className='mt-1 text-xs text-red-500'>{fieldErrors.password}</p>
          )}
        </div>

        <div className='flex items-center justify-between'>
          <FormCheckbox
            id='keepLoggedIn'
            label='Keep me on this device for 30 days'
            checked={keepLoggedIn}
            onChange={e => setKeepLoggedIn(e.target.checked)}
          />
        </div>

        <button
          type='submit'
          disabled={loading}
          className='h-11 w-full cursor-pointer rounded-[10px] bg-gradient-blue font-medium text-white transition-all hover:opacity-90 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>

      {/* Divider */}
      <Divider />

      {/* OAuth Button */}
      <OAuthButton onClick={handleGoogleLogin} />

      {/* Sign Up Link */}
      <div className='mt-6 text-center'>
        <p className='text-sm text-gray-600'>
          Don't have an account?{' '}
          <Link href='/signup' className='font-medium text-blue-600 hover:text-blue-700'>
            Open Account
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
