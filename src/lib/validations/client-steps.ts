import {
  SUPPORTED_COUNTRIES,
  getEntityTypesForCountry,
  hasStateDropdown,
} from '@/lib/constants/countries';
import { PEP_QUESTIONS, FUND_ORIGIN_QUESTION } from '@/lib/constants/pep';
import { z } from 'zod';

// Create country codes array for Zod enum
const SUPPORTED_COUNTRY_CODES = SUPPORTED_COUNTRIES.map(c => c.code) as [string, ...string[]];

// Base schemas
const countrySchema = z.enum(SUPPORTED_COUNTRY_CODES, {
  errorMap: () => ({ message: 'Country not supported or restricted' }),
});

// Dynamic entity type validation using object-level validation
const entityTypeSchema = z.string();

// Dynamic state validation (required for countries with dropdowns, optional for others)
const stateSchema = z.string().optional();

const phoneSchema = z
  .string()
  .regex(/^\+[1-9]\d{1,14}$/, 'Phone number must be in E.164 format (+1234567890)')
  .min(7, 'Phone number too short')
  .max(16, 'Phone number too long');

const addressSchema = z.object({
  country: countrySchema,
  streetAddress: z.string().min(1, 'Street address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().optional(),
  postalCode: z.string().min(1, 'Postal code is required'),
});

// Step 1: Account Type Selection
export const step1Schema = z.object({
  accountType: z.enum(['personal', 'business', 'fintech'], {
    errorMap: () => ({ message: 'Account type must be personal, business, or fintech' }),
  }),
});

// Step 2: Business Information
export const step2Schema = z
  .object({
    country: countrySchema,
    entityType: entityTypeSchema,
    businessName: z.string().min(1, 'Business name is required').max(100, 'Business name too long'),
    taxId: z.string().min(1, 'Tax ID is required'),
    address: addressSchema,
    phone: phoneSchema.optional(),
    phoneCountryCode: z.string().optional(),
  })
  .refine(
    data => {
      // Validate entity type based on country
      const validEntityTypes = getEntityTypesForCountry(data.country);
      return validEntityTypes.some(et => et.value === data.entityType);
    },
    {
      message: 'Invalid entity type for selected country',
      path: ['entityType'],
    }
  )
  .refine(
    data => {
      // Validate state based on country requirements
      const requiresDropdown = hasStateDropdown(data.country);
      if (requiresDropdown) {
        return data.address.state && data.address.state.length > 0;
      }
      return true;
    },
    {
      message: 'State/Region is required for this country',
      path: ['address', 'state'],
    }
  );

// Step 3: Business Details
export const step3Schema = z.object({
  industry: z.string().min(1, 'Industry is required'),
  businessDescription: z
    .string()
    .min(10, 'Business description must be at least 10 characters')
    .max(1000, 'Business description too long'),
  expectedMonthlyVolume: z.string().optional(),
  primaryUseCase: z.string().optional(),
  // Website is fully optional - accepts empty string, null, undefined, or valid URL
  website: z.string().optional().nullable().transform(val => {
    // Return undefined for empty/null values (makes it truly optional)
    if (!val || val.trim() === '') return undefined;
    return val;
  }).pipe(
    z.string().url('Invalid website URL').optional()
  ),
});

// Step 4: Volume & Operations
export const step4Schema = z.object({
  // Volume amounts (string values from dropdown selections)
  volumeSwift: z.string().optional(),
  volumeLocal: z.string().optional(),
  volumeCrypto: z.string().optional(),
  volumeFiatConversion: z.string().optional(),
  // Transaction counts (string values from dropdown selections)
  volumeInternationalCnt: z.string().optional(),
  volumeLocalCnt: z.string().optional(),
  // Currencies (multi-select array) - default to empty array if undefined
  currencies: z.array(z.string()).default([]).refine(
    (arr) => arr.length >= 1,
    { message: 'At least one currency is required' }
  ),
  // Regions (multi-select array) - default to empty array if undefined
  regions: z.array(z.string()).default([]).refine(
    (arr) => arr.length >= 1,
    { message: 'At least one operating region is required' }
  ),
});

// Step 5: Owners & Representatives
const personOwnerSchema = z
  .object({
    type: z.literal('person'),
    firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
    lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
    email: z.string().email('Valid email is required'),
    phone: phoneSchema,
    phoneCountryCode: z.string().min(1, 'Phone country code is required'),
    dateOfBirth: z.string().refine(date => {
      const dob = new Date(date);
      const minAge = new Date();
      minAge.setFullYear(minAge.getFullYear() - 18);
      return dob <= minAge;
    }, 'Must be at least 18 years old'),
    citizenship: countrySchema,
    secondaryCitizenship: countrySchema.optional(),
    taxId: z.string().optional(),
    role: z.enum(['director', 'officer', 'shareholder', 'authorized_signer', 'other'], {
      errorMap: () => ({ message: 'Invalid role selected' }),
    }),
    title: z.string().optional(),
    ownershipPercentage: z.number().min(0).max(100),
    isAuthorizedSigner: z.boolean(),
    // Residential address
    residentialCountry: countrySchema,
    residentialAddress: z.string().min(1, 'Residential address is required'),
    residentialApt: z.string().optional(),
    residentialCity: z.string().min(1, 'Residential city is required'),
    residentialState: z.string().optional(),
    residentialPostalCode: z.string().min(1, 'Residential postal code is required'),
    // ID information
    idType: z.enum(['passport', 'drivers_license', 'national_id', 'other'], {
      errorMap: () => ({ message: 'Please select ID type' }),
    }),
    idNumber: z.string().min(1, 'ID number is required'),
    idIssuingCountry: countrySchema,
    idIssueDate: z
      .string()
      .refine(date => new Date(date) < new Date(), 'Issue date cannot be in the future'),
    idExpirationDate: z.string(),
    // Employment information
    employmentStatus: z.enum(
      ['employed', 'self_employed', 'unemployed', 'student', 'retired', 'other'],
      {
        errorMap: () => ({ message: 'Please select employment status' }),
      }
    ),
    employmentIndustry: z.string().optional(),
    occupation: z.string().optional(),
    employerName: z.string().optional(),
    sourceOfIncome: z.string().optional(),
    sourceOfWealth: z.string().optional(),
    annualIncome: z.string().optional(),
  })
  .refine(
    data => {
      // Validate residential state based on residential country
      const requiresDropdown = hasStateDropdown(data.residentialCountry);
      if (requiresDropdown) {
        return data.residentialState && data.residentialState.length > 0;
      }
      return true;
    },
    {
      message: 'State/Region is required for this country',
      path: ['residentialState'],
    }
  );

const entityOwnerSchema = z
  .object({
    type: z.literal('entity'),
    entityName: z.string().min(1, 'Entity name is required').max(100, 'Entity name too long'),
    entityCountry: countrySchema,
    entityType: z.string(),
    registrationNumber: z.string().min(1, 'Registration number is required'),
    ownershipPercentage: z.number().min(0).max(100),
  })
  .refine(
    data => {
      // Validate entity type based on entity country
      const validEntityTypes = getEntityTypesForCountry(data.entityCountry);
      return validEntityTypes.some(et => et.value === data.entityType);
    },
    {
      message: 'Invalid entity type for selected country',
      path: ['entityType'],
    }
  );

const ownerSchema = z.union([personOwnerSchema, entityOwnerSchema]);

export const step5Schema = z.object({
  owners: z.array(ownerSchema).min(1, 'At least one owner is required'),
});

// Step 6: PEP & Sanctions Screening
export const step6Schema = z.object({
  pepResponses: z.record(z.boolean()).refine(
    (responses) => {
      // Must answer all standard PEP questions
      const allQuestionsAnswered = PEP_QUESTIONS.every((q) => responses[q.id] !== undefined);
      if (!allQuestionsAnswered) return false;

      // If any PEP question is Yes, must answer Fund Origin question
      const hasPepFlag = PEP_QUESTIONS.some((q) => responses[q.id] === true);
      if (hasPepFlag) {
        return responses[FUND_ORIGIN_QUESTION.id] !== undefined;
      }

      return true;
    },
    {
      message: 'Please answer all required questions',
    }
  ),
});

// Step 7: Document Upload
const documentSchema = z.object({
  type: z.string(),
  fileName: z.string(),
  fileUrl: z.string(),
  fileSize: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB'),
  mimeType: z.string(),
  ownerId: z.string().nullish(),
  uploadedAt: z.string().optional(),
  uploadedBy: z.string().optional(),
});

export const step7Schema = z.object({
  documents: z.array(documentSchema).min(1, 'At least one document is required'),
});

// Step 8: Final Submission
export const step8Schema = z.object({
  confirmAccuracy: z
    .boolean()
    .refine(val => val === true, 'You must confirm the accuracy of the information'),
  agreeToTerms: z
    .boolean()
    .refine(val => val === true, 'You must agree to the terms and conditions'),
});

// Session-based validation (combines all steps)
export const completeClientSchema = z.object({
  accountType: step1Schema.shape.accountType,
  businessInfo: step2Schema,
  businessDetails: step3Schema,
  businessOperations: step4Schema,
  owners: step5Schema.shape.owners,
  pepResponses: step6Schema.shape.pepResponses,
  documents: step7Schema.shape.documents,
  finalConfirmation: step8Schema,
});

// Types
export type Step1Data = z.infer<typeof step1Schema>;
export type Step2Data = z.infer<typeof step2Schema>;
export type Step3Data = z.infer<typeof step3Schema>;
export type Step4Data = z.infer<typeof step4Schema>;
export type Step5Data = z.infer<typeof step5Schema>;
export type Step6Data = z.infer<typeof step6Schema>;
export type Step7Data = z.infer<typeof step7Schema>;
export type Step8Data = z.infer<typeof step8Schema>;
export type CompleteClientData = z.infer<typeof completeClientSchema>;
