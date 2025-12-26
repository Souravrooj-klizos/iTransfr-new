'use client';

import { AuthCard } from '@/components/auth/AuthCard';
import { Step1PersonalDetails } from '@/components/auth/signup-steps/Step1PersonalDetails';
import { Step2Verification } from '@/components/auth/signup-steps/Step2Verification';
import { Step3Password } from '@/components/auth/signup-steps/Step3Password';
import { Step4CompanyDetails } from '@/components/auth/signup-steps/Step4CompanyDetails';
import { Step5KYC } from '@/components/auth/signup-steps/Step5KYC';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    email: '',
    mobile: '',
    password: '',
    city: '',
    country: '',
    pincode: '',
    businessType: '',
    passportFile: null,
    addressProofFile: null,
    photoIdFile: null,
  });

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      setError('');

      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/oauth-callback?flow=signup`,
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      // OAuth will redirect automatically
    } catch (err: any) {
      setError('Failed to initiate Google signup');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (data: any) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  // Step 1 -> 2: Send OTP
  const handleStep1Next = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2 -> 3: Verify OTP
  const handleStep2Next = async (otp: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid OTP');
      }

      setStep(3);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 3 -> 4: Create user account and auto-login
  const handleStep3Next = async () => {
    setLoading(true);
    setError('');
    try {
      // Parse phone number to extract country code and mobile
      let countryCode = 'US'; // default
      let mobile = formData.mobile || '';

      if (mobile) {
        // Extract country code from phone number (e.g., "+1 1234567890" -> countryCode: "US", mobile: "1234567890")
        const phoneParts = mobile.split(' ');
        if (phoneParts.length >= 2) {
          const countryCodeMap: { [key: string]: string } = {
            '+1': 'US',
            '+91': 'IN',
            '+44': 'GB',
            '+61': 'AU',
            '+49': 'DE',
            '+33': 'FR',
            '+39': 'IT',
            '+34': 'ES',
            '+31': 'NL',
            '+32': 'BE',
            '+41': 'CH',
            '+43': 'AT',
            '+46': 'SE',
            '+47': 'NO',
            '+45': 'DK',
          };

          const fullCountryCode = phoneParts[0];
          countryCode = countryCodeMap[fullCountryCode] || 'US';
          mobile = phoneParts.slice(1).join(' ').replace(/\s+/g, ''); // Remove spaces from mobile number
        }
      }

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          companyName: formData.companyName,
          mobile: mobile,
          countryCode: countryCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      // Auto-login the user after account creation
      const supabase = createClient();
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (loginError) {
        console.error('Auto-login failed:', loginError);
        // Don't throw error here, continue to next step even if auto-login fails
        // The user can still manually log in later
      }

      setUserId(data.user.id);
      setStep(4);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 4 -> 5: Complete profile with company details
  const handleStep4Next = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          city: formData.city,
          country: formData.country,
          pincode: formData.pincode,
          businessType: formData.businessType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setStep(5);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Final submission: Upload KYC documents
  const handleFinalSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      // Upload all three documents
      const uploads = [
        { type: 'passport', file: formData.passportFile },
        { type: 'address_proof', file: formData.addressProofFile },
        { type: 'photo_id', file: formData.photoIdFile },
      ];

      for (const upload of uploads) {
        if (upload.file) {
          const formDataToSend = new FormData();
          formDataToSend.append('userId', userId!);
          formDataToSend.append('documentType', upload.type);
          formDataToSend.append('file', upload.file);

          const response = await fetch('/api/auth/upload-kyc', {
            method: 'POST',
            body: formDataToSend,
          });

          if (!response.ok) {
            throw new Error(`Failed to upload ${upload.type}`);
          }
        }
      }

      // Redirect to dashboard or success page
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Determine card title and subtitle based on step
  const getStepContent = () => {
    switch (step) {
      case 1:
        return {
          title: "Let's open your account",
          subtitle: 'Fill out the details to continue',
          component: (
            <Step1PersonalDetails
              formData={formData}
              updateFormData={updateFormData}
              onNext={handleStep1Next}
            />
          ),
        };
      case 2:
        return {
          title: '',
          subtitle: '',
          component: <Step2Verification formData={formData} onNext={handleStep2Next} />,
        };
      case 3:
        return {
          title: '',
          subtitle: '',
          component: (
            <Step3Password
              formData={formData}
              updateFormData={updateFormData}
              onNext={handleStep3Next}
            />
          ),
        };
      case 4:
        return {
          title: "Let's open your account",
          subtitle: 'Fill out the details to continue',
          component: (
            <Step4CompanyDetails
              formData={formData}
              updateFormData={updateFormData}
              onNext={handleStep4Next}
            />
          ),
        };
      case 5:
        return {
          title: '',
          subtitle: '',
          component: (
            <Step5KYC
              formData={formData}
              updateFormData={updateFormData}
              onSubmit={handleFinalSubmit}
            />
          ),
        };
      default:
        return { title: '', subtitle: '', component: null };
    }
  };

  const { title, subtitle, component } = getStepContent();

  return (
    <>
      {error && (
        <div className='fixed top-4 right-4 z-50 max-w-md rounded-md border border-red-400 bg-red-100 px-4 py-3 text-red-700'>
          <p className='font-medium'>Error</p>
          <p className='text-sm'>{error}</p>
          <button
            onClick={() => setError('')}
            className='absolute top-2 right-2 text-red-700 hover:text-red-900'
          >
            ×
          </button>
        </div>
      )}

      <AuthCard title={title} subtitle={subtitle} className={step === 5 ? 'max-w-4xl' : 'max-w-md'}>
        {loading && (
          <div className='bg-opacity-75 absolute inset-0 z-10 flex items-center justify-center bg-white'>
            <div className='h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'></div>
          </div>
        )}

        {/* Google OAuth Option - Show on first step only */}
        {/* {step === 1 && (
          <>
            <OAuthButton onClick={handleGoogleSignup} />
            <Divider />
          </>
        )} */}

        {component}
      </AuthCard>
    </>
  );
}
