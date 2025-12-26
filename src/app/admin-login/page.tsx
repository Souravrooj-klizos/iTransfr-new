'use client';

import { AlertCircle, Lock, Shield, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate inputs (already trimmed on change)
      if (!username) {
        throw new Error('Username cannot be empty or contain only spaces');
      }
      if (!password) {
        throw new Error('Password cannot be empty or contain only spaces');
      }

      // Use custom admin authentication API
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Login failed');
      }

      if (!result.success) {
        throw new Error(result.error || 'Invalid credentials');
      }

      // Store session token in localStorage and cookies
      localStorage.setItem('admin_session_token', result.session_token);
      localStorage.setItem('admin_user', JSON.stringify(result.admin));

      // Set cookie for middleware (HttpOnly would be better but let's use regular for now)
      document.cookie = `admin_session_token=${result.session_token}; path=/; max-age=86400`;

      // Store session data
      localStorage.setItem('admin_session_token', result.session_token);
      localStorage.setItem('admin_user', JSON.stringify(result.admin));

      // Set cookie for middleware
      document.cookie = `admin_session_token=${result.session_token}; path=/; max-age=86400`;

      // Small delay to ensure cookie is set, then redirect
      setTimeout(() => {
        window.location.href = '/admin/dashboard';
      }, 100);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-900 p-4'>
      <div className='w-full max-w-md'>
        {/* Logo/Header */}
        <div className='mb-8 text-center'>
          <div className='mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-600'>
            <Shield className='h-8 w-8 text-white' />
          </div>
          <h1 className='text-2xl font-bold text-white'>Admin Console</h1>
          <p className='mt-1 text-gray-400'>iTransfer Administration - Username Login</p>
        </div>

        {/* Login Form */}
        <div className='rounded-lg border border-gray-700 bg-gray-800 p-8 shadow-xl'>
          <div className='mb-6 rounded-lg border border-blue-500/20 bg-blue-900/20 p-4'>
            <div className='flex items-start gap-3'>
              <svg
                className='mt-0.5 h-5 w-5 shrink-0 text-blue-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
              <div>
                <h3 className='text-sm font-medium text-blue-400'>Admin Login</h3>
                <p className='mt-1 text-xs text-blue-200'>
                  Use username <span className='font-mono font-bold'>admin</span> and password{' '}
                  <span className='font-mono font-bold'>SecurePass123!</span>
                </p>
              </div>
            </div>
          </div>
          <form onSubmit={handleLogin} className='space-y-6'>
            {error && (
              <div className='flex items-center gap-2 rounded-lg border border-red-500 bg-red-900/50 px-4 py-3 text-red-200'>
                <AlertCircle className='h-5 w-5 shrink-0' />
                <span className='text-sm'>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor='username' className='mb-2 block text-sm font-medium text-gray-300'>
                Username
              </label>
              <div className='relative'>
                <User className='absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-500' />
                <input
                  id='username'
                  type='text'
                  value={username}
                  onChange={e => setUsername(e.target.value.trim())}
                  placeholder='Enter admin username'
                  required
                  className='w-full rounded-lg border border-gray-600 bg-gray-700 py-3 pr-4 pl-10 text-white placeholder-gray-400 focus:border-transparent focus:ring-2 focus:ring-blue-500'
                />
              </div>
              <p className='mt-1 text-xs text-gray-400'>
                Default username: <span className='font-mono text-blue-400'>admin</span>
              </p>
            </div>

            <div>
              <label htmlFor='password' className='mb-2 block text-sm font-medium text-gray-300'>
                Password
              </label>
              <div className='relative'>
                <Lock className='absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-500' />
                <input
                  id='password'
                  type='password'
                  value={password}
                  onChange={e => setPassword(e.target.value.trim())}
                  placeholder='••••••••'
                  required
                  className='w-full rounded-lg border border-gray-600 bg-gray-700 py-3 pr-4 pl-10 text-white placeholder-gray-400 focus:border-transparent focus:ring-2 focus:ring-blue-500'
                />
              </div>
            </div>

            <button
              type='submit'
              disabled={loading}
              className='w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50'
            >
              {loading ? (
                <span className='flex items-center justify-center gap-2'>
                  <svg className='h-5 w-5 animate-spin' viewBox='0 0 24 24'>
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'
                      fill='none'
                    />
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In to Admin'
              )}
            </button>
          </form>

          <div className='mt-6 border-t border-gray-700 pt-6'>
            <p className='text-center text-sm text-gray-500'>
              Not an administrator?{' '}
              <a href='/login' className='text-blue-400 hover:text-blue-300'>
                Go to Client Login
              </a>
            </p>
          </div>
        </div>

        <p className='mt-8 text-center text-xs text-gray-500'>
          Protected area. Unauthorized access is prohibited.
        </p>
      </div>
    </div>
  );
}
