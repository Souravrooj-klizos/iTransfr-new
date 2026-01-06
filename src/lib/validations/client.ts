import { SUPPORTED_COUNTRIES, getEntityTypesForCountry } from '@/lib/constants/countries';
import { z } from 'zod';

// Country codes (excluding restricted countries from the guide)
export const ALLOWED_COUNTRIES = SUPPORTED_COUNTRIES.map(c => c.code);

export const RESTRICTED_COUNTRIES = [
  'RU',
  'UA',
  'BY',
  'CU',
  'IL',
  'VE',
  'IR',
  'YE',
  'SO',
  'KP',
] as const;

// Dynamic entity types function (replaces static ENTITY_TYPES)
export const getEntityTypesForValidation = (countryCode: string): string[] => {
  return getEntityTypesForCountry(countryCode).map(et => et.value);
};

// Legacy support for existing code (maps to new dynamic system)
export const ENTITY_TYPES = {
  US: getEntityTypesForValidation('US'),
  CO: getEntityTypesForValidation('CO'),
  BR: getEntityTypesForValidation('BR'),
  MX: getEntityTypesForValidation('MX'),
  DEFAULT: getEntityTypesForValidation('DEFAULT') || [
    'corporation',
    'limited_liability_company',
    'partnership',
    'limited_private_company',
  ],
} as const;

// Zod schema for country-specific entity type validation
export const createCountryEntityTypeSchema = (countryCode: string) => {
  const validEntityTypes = getEntityTypesForValidation(countryCode);
  if (validEntityTypes.length === 0) {
    return z.string().refine(() => false, {
      message: `No valid entity types for ${countryCode}`,
    });
  }
  return z.enum(validEntityTypes as [string, ...string[]], {
    errorMap: () => ({ message: `Invalid entity type for ${countryCode}` }),
  });
};

// Restricted country validation
export const validateCountryNotRestricted = (countryCode: string): boolean => {
  return !RESTRICTED_COUNTRIES.includes(countryCode as any);
};

// Document types for different account types
export const DOCUMENT_TYPES = {
  PERSONAL: [
    'passport',
    'driversLicenseFront',
    'driversLicenseBack',
    'idCard',
    'idCardBack',
    'proofOfAddress',
    'selfie',
  ],
  BUSINESS: ['formationDocument', 'proofOfRegistration'],
  FINTECH: [
    'formationDocument',
    'proofOfRegistration',
    'msbCert', // Usually required for Fintechs
  ],
} as const;

// Phone number validation (E.164 format)
const phoneRegex = /^\+[1-9]\d{1,14}$/;

// Date validation helpers
const today = new Date();
const minAge = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());

// Base schemas
export const countrySchema = z.enum(ALLOWED_COUNTRIES as [string, ...string[]], {
  errorMap: () => ({ message: 'Country not supported or restricted' }),
});

export const phoneSchema = z
  .string()
  .regex(phoneRegex, 'Phone number must be in E.164 format (+1234567890)')
  .min(7, 'Phone number too short')
  .max(16, 'Phone number too long');

// Address schema
export const addressSchema = z.object({
  country: countrySchema,
  streetAddress: z.string().min(1, 'Street address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().optional(), // Will be validated based on country
  postalCode: z.string().min(1, 'Postal code is required'),
});

// Entity type validation based on country
export const entityTypeSchema = z.string().refine(val => {
  // This will be validated at runtime based on country
  return val && val.length > 0;
}, 'Entity type is required');

// Person owner schema
export const personOwnerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  email: z.string().email('Valid email is required'),
  phone: phoneSchema,
  phoneCountryCode: z.string().min(1, 'Phone country code is required'),
  dateOfBirth: z.string().refine(date => {
    const dob = new Date(date);
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
  idType: z.enum(['passport', 'drivers_license', 'national_id', 'other']),
  idNumber: z.string().min(1, 'ID number is required'),
  idIssuingCountry: countrySchema,
  idIssueDate: z
    .string()
    .refine(date => new Date(date) < today, 'Issue date cannot be in the future'),
  idExpirationDate: z.string().refine(date => new Date(date) > today, 'ID must not be expired'),
  // Employment information
  employmentStatus: z.enum([
    'employed',
    'self_employed',
    'unemployed',
    'student',
    'retired',
    'other',
  ]),
  employmentIndustry: z.string().optional(),
  occupation: z.string().optional(),
  employerName: z.string().optional(),
  sourceOfIncome: z.string().optional(),
  sourceOfWealth: z.string().optional(),
  annualIncome: z.string().optional(),
});

// Entity owner schema
export const entityOwnerSchema = z.object({
  entityName: z.string().min(1, 'Entity name is required').max(100, 'Entity name too long'),
  countryOfIncorporation: countrySchema,
  entityType: entityTypeSchema,
  registrationNumber: z.string().min(1, 'Registration number is required'),
  ownershipPercentage: z.number().min(0).max(100),
});

// Combined owner schema (union of person and entity)
export const ownerSchema = z.union([
  personOwnerSchema.extend({ type: z.literal('person') }),
  entityOwnerSchema.extend({ type: z.literal('entity') }),
]);

// PEP screening schema
export const pepScreeningSchema = z.object({
  isPEPSeniorOfficial: z.boolean(),
  isPEPPoliticalParty: z.boolean(),
  isPEPFamilyMember: z.boolean(),
  isPEPCloseAssociate: z.boolean(),
  additionalNotes: z.string().optional(),
});

// Document schema
export const documentSchema = z.object({
  type: z.string(),
  fileName: z.string(),
  fileUrl: z.string(),
  fileSize: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB'), // 10MB limit
  mimeType: z.string(),
  ownerId: z.string().nullish(), // For owner-specific documents
  uploadedAt: z.string().optional(),
  uploadedBy: z.string().optional(),
});

// Business operations schema
export const businessOperationsSchema = z.object({
  volumeSwiftMonthly: z.number().min(0).optional(),
  volumeLocalMonthly: z.number().min(0).optional(),
  volumeCryptoMonthly: z.number().min(0).optional(),
  volumeInternationalTxCount: z.number().min(0).optional(),
  volumeLocalTxCount: z.number().min(0).optional(),
  operatingCurrencies: z.array(z.string()).min(1, 'At least one operating currency required'),
  primaryOperatingRegions: z.array(z.string()).min(1, 'At least one operating region required'),
});

// Main client creation schema
export const createClientSchema = z.object({
  // Creator identification
  createdBy: z.enum(['user', 'admin'], {
    errorMap: () => ({ message: "Creator type must be 'user' or 'admin'" }),
  }),
  adminId: z.string().uuid().optional(), // Required if createdBy = 'admin'

  // Account type
  accountType: z.enum(['personal', 'business', 'fintech'], {
    errorMap: () => ({ message: 'Account type must be personal, business, or fintech' }),
  }),

  // Business Information (Step 2)
  country: countrySchema,
  entityType: z.string().min(1, 'Entity type is required'),
  businessName: z.string().min(1, 'Business name is required').max(100, 'Business name too long'),
  taxId: z.string().min(1, 'Tax ID is required'),
  state: z
    .string({
      required_error: 'State/ Region is required',
      invalid_type_error: 'State/ Region is required',
    })
    .min(1, 'State/ Region is required'),
  address: addressSchema,
  phone: phoneSchema,
  phoneCountryCode: z.string().min(1, 'Phone country code is required'),

  // Business Details (Step 3)
  industry: z.string().min(1, 'Industry is required'),
  businessDescription: z
    .string()
    .min(10, 'Business description must be at least 10 characters')
    .max(1000, 'Business description too long'),
  expectedMonthlyVolume: z.string().min(1, 'Expected monthly volume is required'),
  primaryUseCase: z.string().min(1, 'Primary use case is required'),
  // Website is fully optional - accepts empty string, null, undefined, or valid URL
  website: z.string().optional().nullable().transform(val => {
    if (!val || val.trim() === '') return undefined;
    return val;
  }).pipe(
    z.string().url('Invalid website URL').optional()
  ),

  // Business Operations (Step 4)
  businessOperations: businessOperationsSchema,

  // Owners and Representatives (Step 5)
  owners: z
    .array(ownerSchema)
    .min(1, 'At least one owner is required')
    .refine(owners => {
      const totalPercentage = owners.reduce((sum, owner) => sum + owner.ownershipPercentage, 0);
      return Math.abs(totalPercentage - 100) < 0.01; // Allow for small floating point errors
    }, 'Total ownership percentage must equal exactly 100%'),

  // PEP Screening (Step 6)
  pepScreening: pepScreeningSchema,

  // Documents (Step 7)
  documents: z.array(documentSchema).refine(docs => {
    // Ensure required documents are present based on account type
    // This would be validated at runtime based on accountType
    return docs.length > 0;
  }, 'At least one document is required'),

  // Additional metadata
  metadata: z
    .object({
      ipAddress: z.string().optional(),
      userAgent: z.string().optional(),
      source: z.string().optional(), // 'web', 'api', 'admin'
      notes: z.string().optional(),
    })
    .optional(),
});

// Validation helper for country-specific entity types
export const validateEntityType = (country: string, entityType: string): boolean => {
  const countryCode = country.toUpperCase();
  const entityTypes =
    ENTITY_TYPES[countryCode as keyof typeof ENTITY_TYPES] || ENTITY_TYPES.DEFAULT;
  return (entityTypes as readonly string[]).includes(entityType);
};

// Validation helper for required documents
export const validateRequiredDocuments = (accountType: string, documents: any[]): boolean => {
  const normAccountType = accountType.toUpperCase();
  const uploadedTypes = new Set(documents.map(doc => doc.type));

  if (normAccountType === 'PERSONAL') {
    const hasIdentity =
      uploadedTypes.has('passport') ||
      uploadedTypes.has('personalId') ||
      (uploadedTypes.has('driversLicenseFront') && uploadedTypes.has('driversLicenseBack')) ||
      (uploadedTypes.has('idCard') && uploadedTypes.has('idCardBack'));

    const hasAddress = uploadedTypes.has('proofOfAddress');
    const hasSelfie = uploadedTypes.has('selfie');

    return hasIdentity && hasAddress && hasSelfie;
  }

  const requiredTypes =
    DOCUMENT_TYPES[accountType.toUpperCase() as keyof typeof DOCUMENT_TYPES] || [];

  // Check if all required document types are present
  return requiredTypes.every(requiredType => uploadedTypes.has(requiredType));
};

// Export types
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type OwnerInput = z.infer<typeof ownerSchema>;
export type PersonOwnerInput = z.infer<typeof personOwnerSchema>;
export type EntityOwnerInput = z.infer<typeof entityOwnerSchema>;
export type DocumentInput = z.infer<typeof documentSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type BusinessOperationsInput = z.infer<typeof businessOperationsSchema>;
export type PEPScreeningInput = z.infer<typeof pepScreeningSchema>;
