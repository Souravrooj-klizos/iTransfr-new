'use client';

import { useToast } from '@/components/ui/Toast';
import { useFormValidation } from '@/hooks/useFormValidation';
import { adminClientApi } from '@/lib/api/admin-client';
import { getErrorMessage } from '@/lib/api/axios';
import {
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  step5Schema,
  step6Schema,
  step7Schema,
} from '@/lib/validations/client-steps';
import { useCallback, useEffect, useState } from 'react';

// ============================================
// Types & Interfaces
// ============================================

export interface ClientFormData {
  // Step 1
  accountType: string;
  // Step 2
  country: string;
  documents: {
    type: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: string;
    uploadedBy: string;
    ownerId?: string | null;
  }[];
  entityType: string;
  businessName: string;
  taxId: string;
  state: string;
  address: string;
  apt: string;
  city: string;
  postalCode: string;
  website: string;
  ownerPhone: string;
  // Step 3
  industry: string;
  businessDescription: string;
  expectedMonthlyVolume: string;
  primaryUseCase: string;
  // Step 4
  volumeSwift: string;
  volumeLocal: string;
  volumeCrypto: string;
  volumeFiatConversion: string;
  volumeInternationalCnt: string;
  volumeLocalCnt: string;
  currencies: string[];
  regions: string[];
  // Step 5
  owners: any[];
  // Step 6
  pepResponses: Record<string, boolean>;
}

export interface UseClientOnboardingOptions {
  // 'admin' uses admin APIs, 'public' would use public APIs (future)
  mode: 'admin' | 'public';
  // localStorage key for session persistence (optional)
  storageKey?: string;
  // Callback when session is created
  onSessionCreated?: (sessionId: string) => void;
  // Callback when step is saved successfully
  onStepSaved?: (step: number) => void;
  // Callback when onboarding is complete
  onComplete?: () => void;
}

export interface UseClientOnboardingReturn {
  // State
  currentStep: number;
  sessionId: string | null;
  isSubmitting: boolean;
  isLoadingSession: boolean;
  isLoadingStepData: boolean;
  isGoingBack: boolean;
  validationErrors: Record<string, string>;
  formData: ClientFormData;

  // Actions
  setCurrentStep: (step: number) => void;
  updateFormData: (field: string, value: any) => void;
  setFormData: React.Dispatch<React.SetStateAction<ClientFormData>>;
  saveCurrentStep: () => Promise<boolean>;
  goToNextStep: () => Promise<void>;
  goToPreviousStep: () => Promise<void>;
  resetOnboarding: () => void;
  clearValidationErrors: () => void;

  // Session management
  resumeSession: (sessionId: string) => Promise<void>;
  loadStepData: (step: number) => Promise<void>;
  setSessionId: (id: string | null) => void;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Normalize country codes to valid enum values (UK -> GB, etc.)
 */
export const normalizeCountryCode = (code: string | undefined): string => {
  if (!code) return 'US';
  const uppercased = code.toUpperCase();
  const countryMapping: Record<string, string> = {
    'UK': 'GB',
    'EN': 'GB',
    'ENGLAND': 'GB',
    'BRITAIN': 'GB',
    'UNITED KINGDOM': 'GB',
    'USA': 'US',
    'UNITED STATES': 'US',
    'CANADA': 'CA',
    'GERMANY': 'DE',
    'SPAIN': 'ES',
    'HONG KONG': 'HK',
    'SINGAPORE': 'SG',
    'UAE': 'AE',
    'BRAZIL': 'BR',
    'MEXICO': 'MX',
    'COLOMBIA': 'CO',
    'INDIA': 'IN',
  };
  return countryMapping[uppercased] || uppercased;
};

/**
 * Sanitize phone number to E.164 format
 */
export const sanitizePhoneNumber = (phone: string | undefined): string => {
  if (!phone) return '+10000000000';
  return phone.replace(/[\s\(\)\-]/g, '');
};

/**
 * Map UI role values to API-accepted role values
 */
export const mapOwnerRole = (role: string | undefined): string => {
  const roleMapping: Record<string, string> = {
    'ceo': 'officer',
    'cfo': 'officer',
    'owner': 'shareholder',
  };
  return roleMapping[role || ''] || role || 'other';
};

// ============================================
// Initial Form Data
// ============================================

export const getInitialFormData = (): ClientFormData => ({
  accountType: 'business',
  country: '',
  entityType: '',
  businessName: '',
  taxId: '',
  state: '',
  address: '',
  apt: '',
  city: '',
  postalCode: '',
  website: '',
  ownerPhone: '',
  industry: '',
  businessDescription: '',
  expectedMonthlyVolume: '',
  primaryUseCase: '',
  volumeSwift: '',
  volumeLocal: '',
  volumeCrypto: '',
  volumeFiatConversion: '',
  volumeInternationalCnt: '',
  volumeLocalCnt: '',
  currencies: [],
  regions: [],
  owners: [],
  pepResponses: {},
  documents: [],
});

// ============================================
// Data Transformers (Form -> API)
// ============================================

const transformStep1Data = (formData: ClientFormData) => ({
  accountType: formData.accountType as 'personal' | 'business' | 'fintech',
});

const transformStep2Data = (formData: ClientFormData) => ({
  country: formData.country.toUpperCase(),
  entityType: formData.entityType,
  businessName: formData.businessName,
  taxId: formData.taxId,
  address: {
    country: formData.country.toUpperCase(),
    streetAddress: formData.address,
    addressLine2: formData.apt || undefined,
    city: formData.city,
    state: formData.state || undefined,
    postalCode: formData.postalCode,
  },
});

const transformStep3Data = (formData: ClientFormData) => ({
  industry: formData.industry,
  website: formData.website || undefined,
  businessDescription: formData.businessDescription,
  expectedMonthlyVolume: formData.expectedMonthlyVolume,
  primaryUseCase: formData.primaryUseCase,
});

const transformStep4Data = (formData: ClientFormData) => ({
  volumeSwift: formData.volumeSwift || undefined,
  volumeLocal: formData.volumeLocal || undefined,
  volumeCrypto: formData.volumeCrypto || undefined,
  volumeFiatConversion: formData.volumeFiatConversion || undefined,
  volumeInternationalCnt: formData.volumeInternationalCnt || undefined,
  volumeLocalCnt: formData.volumeLocalCnt || undefined,
  currencies: Array.isArray(formData.currencies) ? formData.currencies : [],
  regions: Array.isArray(formData.regions) ? formData.regions : [],
});

const transformStep5Data = (formData: ClientFormData) => {
  let owners = formData.owners;

  // Map owners to API format
  const mappedOwners = owners.map((owner: any) => {
    if (owner.type === 'entity') {
      return {
        type: 'entity' as const,
        entityName: owner.entityName,
        entityCountry: normalizeCountryCode(owner.entityCountry),
        entityType: owner.entityType,
        registrationNumber: owner.registrationNumber,
        ownershipPercentage: Math.min(parseFloat(owner.percentage) || 0, 100),
      };
    } else {
      return {
        type: 'person' as const,
        firstName: owner.firstName,
        lastName: owner.lastName,
        email: owner.email,
        // Extract actual phone code from format "US:+1" or use directly if already just "+1"
        phone: (owner.phoneCountryCode?.includes(':')
          ? owner.phoneCountryCode.split(':')[1]
          : (owner.phoneCountryCode || '+1')) + (owner.phone || '').replace(/[\s\(\)\-]/g, ''),
        phoneCountryCode: owner.phoneCountryCode?.includes(':')
          ? owner.phoneCountryCode.split(':')[1]
          : (owner.phoneCountryCode || '+1'),
        dateOfBirth: owner.dob,
        citizenship: normalizeCountryCode(owner.citizenship),
        secondaryCitizenship: owner.secondaryCitizenship ? normalizeCountryCode(owner.secondaryCitizenship) : undefined,
        taxId: owner.taxId,
        role: mapOwnerRole(owner.role),
        ownershipPercentage: Math.min(parseFloat(owner.percentage) || 0, 100),
        isAuthorizedSigner: owner.authorizedSigner || false,
        residentialCountry: normalizeCountryCode(owner.residentialCountry),
        residentialAddress: owner.residentialAddress,
        residentialApt: owner.residentialApt || undefined,
        residentialCity: owner.residentialCity,
        residentialState: owner.residentialState || undefined,
        residentialPostalCode: owner.residentialPostalCode,
        idType: owner.idType,
        idNumber: owner.idNumber,
        idIssuingCountry: normalizeCountryCode(owner.idIssuingCountry),
        idIssueDate: owner.idIssueDate,
        idExpirationDate: owner.idExpirationDate,
        employmentStatus: owner.employmentStatus,
        employmentIndustry: owner.employmentIndustry || undefined,
        occupation: owner.occupation || undefined,
        employerName: owner.employerName || undefined,
        sourceOfIncome: owner.sourceOfIncome || undefined,
        sourceOfWealth: owner.sourceOfWealth || undefined,
        annualIncome: owner.annualIncome || undefined,
      };
    }
  });

  return { owners: mappedOwners };
};

  const transformStep6Data = (formData: ClientFormData) => ({
    pepResponses: formData.pepResponses,
  });

const transformStep7Data = (formData: ClientFormData) => ({
  documents: formData.documents || [],
});

// ============================================
// Reverse Data Transformers (API → Form)
// ============================================

const transformStep1ApiToForm = (apiData: any): Partial<ClientFormData> => ({
  accountType: apiData.accountType || 'business',
});

const transformStep2ApiToForm = (apiData: any): Partial<ClientFormData> => ({
  country: apiData.country?.toUpperCase() || '',
  entityType: apiData.entityType || '',
  businessName: apiData.businessName || '',
  taxId: apiData.taxId || '',
  state: apiData.address?.state?.toUpperCase() || '',
  address: apiData.address?.streetAddress || '',
  apt: apiData.address?.addressLine2 || '',
  city: apiData.address?.city || '',
  postalCode: apiData.address?.postalCode || '',
  website: apiData.website || '',
  ownerPhone: apiData.phone || '',
});

const transformStep3ApiToForm = (apiData: any): Partial<ClientFormData> => ({
  industry: apiData.industry || '',
  businessDescription: apiData.businessDescription || '',
  expectedMonthlyVolume: apiData.expectedMonthlyVolume || '',
  primaryUseCase: apiData.primaryUseCase || '',
});

const mapVolumeToOption = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return '';
  if (value === 0) return '0-10k';
  if (value === 10) return '10k-50k';
  if (value === 50) return '50k-100k';
  if (value >= 100) return '100k+';
  return '';
};

const transformStep4ApiToForm = (apiData: any): Partial<ClientFormData> => ({
  volumeSwift: apiData.volumeSwift || '',
  volumeLocal: apiData.volumeLocal || '',
  volumeCrypto: apiData.volumeCrypto || '',
  volumeFiatConversion: apiData.volumeFiatConversion || '',
  volumeInternationalCnt: apiData.volumeInternationalCnt || '',
  volumeLocalCnt: apiData.volumeLocalCnt || '',
  currencies: apiData.currencies || [],
  regions: apiData.regions || [],
});

const transformStep5ApiToForm = (apiData: any): Partial<ClientFormData> => {
  // API returns owners array directly (not wrapped in .owners)
  const ownersArray = Array.isArray(apiData) ? apiData : (apiData.owners || apiData.data || []);

  // Map API field names to form field names
  const mappedOwners = ownersArray.map((owner: any, index: number) => {
    // Generate a stable ID if missing. Using index + timestamp is okay here since this is re-created on load.
    // Better to use random string to avoid key collisions if list changes.
    const tempId = owner.id || `owner-${Date.now()}-${index}`;

    if (owner.type === 'entity') {
      return {
        id: tempId,
        type: 'entity',
        entityName: owner.entityName || '',
        entityCountry: owner.entityCountry?.toUpperCase() || '',
        entityType: owner.entityType || '',
        registrationNumber: owner.registrationNumber || '',
        percentage: owner.ownershipPercentage?.toString() || '',
      };
    } else {
      return {
        id: tempId,
        type: 'person',
        firstName: owner.firstName || '',
        middleName: owner.middleName || '',
        lastName: owner.lastName || '',
        email: owner.email || '',
        // Convert phone code to dropdown format: "CC:+X" (e.g., "US:+1")
        // Use residential country if available, otherwise default to the stored code
        phoneCountryCode: owner.phoneCountryCode
          ? `${owner.residentialCountry || 'US'}:${owner.phoneCountryCode}`
          : 'US:+1',
        // Extract phone number by removing the country code prefix
        phone: owner.phone && owner.phoneCountryCode
          ? owner.phone.replace(owner.phoneCountryCode, '')
          : owner.phone || '',
        dob: owner.dateOfBirth || '',
        citizenship: owner.citizenship?.toUpperCase() || '',
        secondaryCitizenship: owner.secondaryCitizenship?.toUpperCase() || '',
        taxId: owner.taxId || '',
        role: owner.role || '',
        percentage: owner.ownershipPercentage?.toString() || '',
        authorizedSigner: owner.isAuthorizedSigner || false,
        residentialCountry: owner.residentialCountry?.toUpperCase() || '',
        residentialAddress: owner.residentialAddress || '',
        residentialApt: owner.residentialApt || '',
        residentialCity: owner.residentialCity || '',
        residentialState: owner.residentialState?.toUpperCase() || '',
        residentialPostalCode: owner.residentialPostalCode || '',
        idType: owner.idType || '',
        idNumber: owner.idNumber || '',
        idIssuingCountry: owner.idIssuingCountry?.toUpperCase() || '',
        idIssueDate: owner.idIssueDate || '',
        idExpirationDate: owner.idExpirationDate || '',
        employmentStatus: owner.employmentStatus || '',
        employmentIndustry: owner.employmentIndustry || '',
        occupation: owner.occupation || '',
        employerName: owner.employerName || '',
        sourceOfIncome: owner.sourceOfIncome || '',
        sourceOfWealth: owner.sourceOfWealth || '',
        annualIncome: owner.annualIncome || '',
      };
    }
  });

  return { owners: mappedOwners };
};

const transformStep6ApiToForm = (apiData: any): Partial<ClientFormData> => {
  const pepData = apiData.data || apiData.pepScreening || apiData;
  return {
    pepResponses: pepData.pepResponses || pepData,
  };
};

const transformStep7ApiToForm = (apiData: any): Partial<ClientFormData> => ({
  documents: Array.isArray(apiData) ? apiData : (apiData.documents || []),
});

// Map step number to transformer function
const getApiToFormTransformer = (step: number) => {
  const transformers = {
    1: transformStep1ApiToForm,
    2: transformStep2ApiToForm,
    3: transformStep3ApiToForm,
    4: transformStep4ApiToForm,
    5: transformStep5ApiToForm,
    6: transformStep6ApiToForm,
    7: transformStep7ApiToForm,
  };
  return transformers[step as keyof typeof transformers];
};

// ============================================
// Main Hook
// ============================================

export function useClientOnboarding(options: UseClientOnboardingOptions): UseClientOnboardingReturn {
  const { mode, storageKey, onSessionCreated, onStepSaved, onComplete } = options;

  const toast = useToast();
  const { errors: validationErrors, validateForm, clearAllErrors, clearError, setFieldError } = useFormValidation();

  const [currentStep, setCurrentStep] = useState(1);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isLoadingStepData, setIsLoadingStepData] = useState(false);
  const [isGoingBack, setIsGoingBack] = useState(false);
  const [formData, setFormData] = useState<ClientFormData>(getInitialFormData());

  // Persist sessionId to localStorage when it changes
  useEffect(() => {
    if (storageKey && sessionId) {
      localStorage.setItem(storageKey, sessionId);
      console.log('💾 Session saved to localStorage:', sessionId);
    }
  }, [sessionId, storageKey]);

  // Update a single form field
  const updateFormData = useCallback((field: string, value: any) => {
    // Handle Step 5 owners array - only clear specific field errors that changed
    if (field === 'owners' && Array.isArray(value)) {
      // Get previous owners from current formData state
      const prevOwners = formData.owners || [];
      const newOwners = value;

      // Find which owner and which field changed
      for (let i = 0; i < Math.max(prevOwners.length, newOwners.length); i++) {
        const prevOwner = prevOwners[i] || {};
        const newOwner = newOwners[i] || {};

        // Check each field in the owner
        const allFields = new Set([...Object.keys(prevOwner), ...Object.keys(newOwner)]);
        allFields.forEach(fieldName => {
          if (prevOwner[fieldName] !== newOwner[fieldName]) {
            // This field changed - map form field to validation field
            const fieldMappings: Record<string, string> = {
              'percentage': 'ownershipPercentage',
              'dob': 'dateOfBirth',
              'authorizedSigner': 'isAuthorizedSigner',
            };
            const validationField = fieldMappings[fieldName] || fieldName;
            clearError(`owners.${i}.${validationField}`);
          }
        });
      }
    }

    // Update the form data
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error for this field (for non-owners fields)
    if (field !== 'owners') {
      clearError(field);
    }

    // Handle mappings for nested fields (specifically for Step 2)
    const addressFields: Record<string, string> = {
      'address': 'address.streetAddress',
      'apt': 'address.addressLine2',
      'city': 'address.city',
      'postalCode': 'address.postalCode',
      'state': 'address.state' // In case validation error comes from address object
    };

    // Handle mappings for Step 4 fields (form field -> validation field)
    // Handle mappings for Step 4 fields (form field -> validation field)
    // No mapping needed as form fields match schema keys now
    const step4Fields: Record<string, string> = {};

    if (addressFields[field]) {
      clearError(addressFields[field]);
    }

    if (step4Fields[field]) {
      clearError(step4Fields[field]);
    }
  }, [clearError, formData.owners]);

  // Reset the entire onboarding flow
  const resetOnboarding = useCallback(() => {
    setCurrentStep(1);
    setSessionId(null);
    setFormData(getInitialFormData());
    clearAllErrors();
  }, [clearAllErrors]);

  // Go to previous step and load its data
  const goToPreviousStep = useCallback(async () => {
    if (currentStep > 1) {
      setIsGoingBack(true);
      try {
        const previousStep = currentStep - 1;
        // Load data for the previous step if we have a session
        if (sessionId) {
          await loadStepData(previousStep);
        }
        setCurrentStep(previousStep);
      } finally {
        setIsGoingBack(false);
      }
    }
  }, [currentStep, sessionId]);

  // Save current step and return success status
  const saveCurrentStep = useCallback(async (): Promise<boolean> => {
    setIsSubmitting(true);

    try {
      // Get the API module based on mode
      const api = mode === 'admin' ? adminClientApi : adminClientApi; // TODO: Add publicClientApi for public mode

      switch (currentStep) {
        case 1: {
          const stepData = transformStep1Data(formData);

          const validation = step1Schema.safeParse(stepData);
          if (!validation.success) {
            console.log('🔴 Step 1 Validation Errors:', validation.error.errors);
            const errors = validation.error.errors.map(e => e.message).join(', ');
            toast.error('Validation Error', errors);
            return false;
          }

          const response = await api.saveStep1(sessionId, stepData);
          if (response.sessionId) {
            setSessionId(response.sessionId);
            onSessionCreated?.(response.sessionId);
          }

          toast.success('Success', 'Account type saved successfully');
          break;
        }

        case 2: {
          if (!sessionId) {
            toast.error('Error', 'Session not found. Please start from Step 1.');
            return false;
          }

          const stepData = transformStep2Data(formData);

          // Map nested validation paths to form field names
          const step2FieldMapping: Record<string, string> = {
            'address.streetAddress': 'address',
            'address.addressLine2': 'apt',
            'address.city': 'city',
            'address.state': 'state',
            'address.postalCode': 'postalCode',
            'address.country': 'country', // Just in case
          };

          if (!validateForm(stepData, step2Schema, step2FieldMapping)) {
            console.log('🔴 Step 2 Validation Failed');
            toast.error('Validation Error', 'Please fix the errors in the form');
            return false;
          }

          await api.saveStep2(sessionId, stepData);
          clearAllErrors();
          toast.success('Success', 'Business information saved successfully');
          break;
        }

        case 3: {
          if (!sessionId) {
            toast.error('Error', 'Session not found.');
            return false;
          }

          const stepData = transformStep3Data(formData);

          if (!validateForm(stepData, step3Schema)) {
            console.log('🔴 Step 3 Validation Failed');
            toast.error('Validation Error', 'Please fix the errors in the form');
            return false;
          }

          await api.saveStep3(sessionId, stepData);
          clearAllErrors();
          toast.success('Success', 'Business details saved successfully');
          break;
        }

        case 4: {
          if (!sessionId) {
            toast.error('Error', 'Session not found.');
            return false;
          }

          const stepData = transformStep4Data(formData);

          if (!validateForm(stepData, step4Schema)) {
            console.log('🔴 Step 4 Validation Failed');
            toast.error('Validation Error', 'Please fix the errors in the form');
            return false;
          }

          await api.saveStep4(sessionId, stepData);
          clearAllErrors();
          toast.success('Success', 'Volume & operations saved successfully');
          break;
        }

        case 5: {
          if (!sessionId) {
            toast.error('Error', 'Session not found.');
            return false;
          }

          if (!formData.owners || formData.owners.length === 0) {
            toast.error('Error', 'Please add at least one owner');
            return false;
          }

          const { owners } = transformStep5Data(formData);
          const stepData = { owners };

          // Step 5 usually validates per-owner in the UI before adding,
          // but validatForm here ensures overall schema validity.
          if (!validateForm(stepData, step5Schema)) {
            console.log('🔴 Step 5 Validation Failed');
            toast.error('Validation Error', 'Please fix the errors in the form');
            return false;
          }

          await api.saveStep5(sessionId, stepData);
          clearAllErrors();
          toast.success('Success', 'Owner information saved successfully');
          break;
        }

        case 6: {
          if (!sessionId) {
            toast.error('Error', 'Session not found.');
            return false;
          }

          const stepData = transformStep6Data(formData);

          if (!validateForm(stepData, step6Schema)) {
            console.log('🔴 Step 6 Validation Failed');
            toast.error('Validation Error', 'Please fix the errors in the form');
            return false;
          }

          await api.saveStep6(sessionId, stepData as any);
          clearAllErrors();
          toast.success('Success', 'PEP screening saved successfully');
          break;
        }

        case 7: {
          if (!sessionId) {
            toast.error('Error', 'Session not found.');
            return false;
          }

          const stepData = transformStep7Data(formData);

          if (!validateForm(stepData, step7Schema)) {
            console.log('🔴 Step 7 Validation Failed');
            toast.error('Validation Error', 'Please fix the errors in the form');
            return false;
          }

          await api.saveStep7(sessionId, stepData);
          clearAllErrors();
          toast.success('Success', 'Documents saved successfully');
          break;
        }

        case 8: {
          // Final submission
          if (!sessionId) throw new Error('No active session ID');

          await api.submitFinal(sessionId, {
            confirmAccuracy: true,
            agreeToTerms: true,
          });
          onComplete?.();
          break;
        }
      }

      onStepSaved?.(currentStep);
      return true;

    } catch (error) {
      console.error('Error saving step:', error);
      toast.error('Error', getErrorMessage(error));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [currentStep, formData, sessionId, mode, toast, validateForm, clearAllErrors, onSessionCreated, onStepSaved, onComplete]);

  // Save current step and move to next
  const goToNextStep = useCallback(async () => {
    const success = await saveCurrentStep();
    if (success && currentStep < 8) {
      setCurrentStep(currentStep + 1);
    }
  }, [saveCurrentStep, currentStep]);

  // Load data for a specific step
  const loadStepData = useCallback(async (step: number) => {
    if (!sessionId || step < 1 || step > 7) return;

    setIsLoadingStepData(true);
    try {
      const api = mode === 'admin' ? adminClientApi : adminClientApi;

      // Call the appropriate GET API
      let response;
      switch (step) {
        case 1:
          response = await api.getStep1(sessionId);
          break;
        case 2:
          response = await api.getStep2(sessionId);
          break;
        case 3:
          response = await api.getStep3(sessionId);
          break;
        case 4:
          response = await api.getStep4(sessionId);
          break;
        case 5:
          response = await api.getStep5(sessionId);
          break;
        case 6:
          response = await api.getStep6(sessionId);
          break;
        case 7:
          response = await api.getStep7(sessionId);
          break;
        default:
          return;
      }

      // Transform API data to form format
      if (response.data) {
        const transformer = getApiToFormTransformer(step);
        if (transformer) {
          const transformedData = transformer(response.data);
          setFormData(prev => ({ ...prev, ...transformedData }));
          console.log(`✅ Loaded Step ${step} data:`, transformedData);
        }
      }
    } catch (error) {
      console.error(`Error loading step ${step} data:`, error);
      toast.error('Error', `Failed to load step ${step} data`);
    } finally {
      setIsLoadingStepData(false);
    }
  }, [sessionId, mode, toast]);

  // Resume session from a saved session ID
  const resumeSession = useCallback(async (savedSessionId: string) => {
    setIsLoadingSession(true);
    try {
      const api = mode === 'admin' ? adminClientApi : adminClientApi;

      // Get Step 1 to check session status and get progress
      const response = await api.getStep1(savedSessionId);

      if (!response.success) {
        throw new Error('Invalid session');
      }

      setSessionId(savedSessionId);
      onSessionCreated?.(savedSessionId);

      // Determine which step to resume from
      const completedSteps = response.completedSteps || [];
      const nextStep = Math.max(...completedSteps, 0) + 1;

      console.log(`📋 Resuming session: ${savedSessionId}`);
      console.log(`✅ Completed steps: ${completedSteps.join(', ')}`);
      console.log(`➡️  Resuming from step: ${nextStep}`);

      // Load data for all completed steps
      for (const step of completedSteps) {
        if (step >= 1 && step <= 7) {
          await loadStepData(step);
        }
      }

      // Set current step to the next incomplete step
      setCurrentStep(Math.min(nextStep, 8));

      toast.success('Session Resumed', `Continuing from Step ${nextStep}`);
    } catch (error) {
      console.error('Error resuming session:', error);
      toast.error('Error', 'Failed to resume session. Starting fresh.');
      // Clear invalid session
      localStorage.removeItem('onboarding_session_id');
      setSessionId(null);
    } finally {
      setIsLoadingSession(false);
    }
  }, [mode, toast, loadStepData, onSessionCreated]);

  return {
    // State
    currentStep,
    sessionId,
    isSubmitting,
    isLoadingSession,
    isLoadingStepData,
    isGoingBack,
    validationErrors,
    formData,

    // Actions
    setCurrentStep,
    updateFormData,
    setFormData,
    saveCurrentStep,
    goToNextStep,
    goToPreviousStep,
    resetOnboarding,
    clearValidationErrors: clearAllErrors,

    // Session management
    resumeSession,
    loadStepData,
    setSessionId,
  };
}
