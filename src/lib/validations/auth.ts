import { z } from 'zod';

// Login Schema
export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Sign Up Step 1 - Personal Details
export const signupStep1Schema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .min(2, 'First name must be at least 2 characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .min(2, 'Last name must be at least 2 characters'),
  companyName: z.string().min(1, 'Company name is required'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  mobile: z
    .string()
    .min(1, 'Mobile number is required')
    .min(10, 'Please enter a valid mobile number'),
});

export type SignupStep1Data = z.infer<typeof signupStep1Schema>;

// Sign Up Step 2 - OTP Verification
export const otpSchema = z.object({
  otp: z.string().length(5, 'Please enter the complete verification code'),
});

export type OtpFormData = z.infer<typeof otpSchema>;

// Sign Up Step 3 - Password
export const passwordSchema = z.object({
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export type PasswordFormData = z.infer<typeof passwordSchema>;

// Sign Up Step 4 - Company Details
export const companyDetailsSchema = z.object({
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
  pincode: z.string().min(1, 'Pincode is required'),
  businessType: z.string().min(1, 'Please select a business type'),
});

export type CompanyDetailsFormData = z.infer<typeof companyDetailsSchema>;

// Helper function to get first error message from Zod validation
export function getFirstError(error: z.ZodError): string {
  const firstError = error.errors[0];
  return firstError?.message || 'Validation failed';
}

// Helper function to validate and get all errors as object
export function getFieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  error.errors.forEach(err => {
    const path = err.path.join('.');
    if (!errors[path]) {
      errors[path] = err.message;
    }
  });
  return errors;
}
