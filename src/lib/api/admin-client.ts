/**
 * Admin Client Creation API Service
 *
 * Frontend API calls for admin client onboarding.
 * All methods use the adminAxios instance with admin auth interceptors.
 */

import { adminAxios } from './axios';

// Step data types
export interface Step1Data {
  accountType: 'personal' | 'business' | 'fintech';
}

export interface Step2Data {
  country: string;
  entityType: string;
  businessName: string;
  taxId: string;
  address: {
    country: string;
    streetAddress: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postalCode: string;
  };
  website?: string;
  phone?: string;
  phoneCountryCode?: string;
}

export interface Step3Data {
  industry: string;
  businessDescription: string;
  expectedMonthlyVolume: string;
  primaryUseCase: string;
}

export interface Step4Data {
  volumeSwiftMonthly?: number;
  volumeLocalMonthly?: number;
  volumeCryptoMonthly?: number;
  volumeInternationalTxCount?: number;
  volumeLocalTxCount?: number;
  operatingCurrencies: string[];
  primaryOperatingRegions: string[];
}

export interface PersonOwner {
  type: 'person';
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  phoneCountryCode: string;
  dateOfBirth: string;
  citizenship: string;
  secondaryCitizenship?: string;
  taxId?: string;
  role: string;
  title?: string;
  ownershipPercentage: number;
  isAuthorizedSigner: boolean;
  residentialCountry: string;
  residentialAddress: string;
  residentialApt?: string;
  residentialCity: string;
  residentialState?: string;
  residentialPostalCode: string;
  idType: string;
  idNumber: string;
  idIssuingCountry: string;
  idIssueDate: string;
  idExpirationDate: string;
  employmentStatus: string;
  employmentIndustry?: string;
  occupation?: string;
  employerName?: string;
  sourceOfIncome?: string;
  sourceOfWealth?: string;
  annualIncome?: string;
}

export interface EntityOwner {
  type: 'entity';
  entityName: string;
  entityCountry: string; // Changed from countryOfIncorporation to match API
  entityType: string;
  registrationNumber: string;
  ownershipPercentage: number;
}

export type Owner = PersonOwner | EntityOwner;

export interface Step5Data {
  owners: Owner[];
}

export interface Step6Data {
  pepScreening: {
    isPEPSeniorOfficial: boolean;
    isPEPPoliticalParty: boolean;
    isPEPFamilyMember: boolean;
    isPEPCloseAssociate: boolean;
    additionalNotes?: string;
  };
}

export interface DocumentData {
  type: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  ownerId?: string | null;
  uploadedAt?: string;
  uploadedBy?: string;
}

export interface Step7Data {
  documents: DocumentData[];
}

export interface Step8Data {
  confirmAccuracy: boolean;
  agreeToTerms: boolean;
}

export interface SessionResponse {
  success: boolean;
  sessionId: string;
  step: number;
  completedSteps: number[];
  data?: any;
  message?: string;
  canSubmit?: boolean;
  summary?: any;
}

export interface UploadResponse {
  success: boolean;
  document: DocumentData;
  message: string;
}

export interface ShareResponse {
  success: boolean;
  shareToken: string;
  shareUrl: string;
  expiresAt: string;
  message: string;
  recipient: {
    email: string;
    name: string;
  };
}

export interface FinalSubmissionResponse {
  success: boolean;
  clientId: string;
  message: string;
  onboardingComplete: boolean;
  clientDetails: {
    id: string;
    accountType: string;
    businessName?: string;
    status: string;
    createdAt: string;
  };
  nextSteps: string[];
}

// =====================================================
// CLIENT DETAIL TYPES
// =====================================================

export interface ClientDetail {
  // Basic Info
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  mobile?: string;
  country?: string;
  city?: string;
  state?: string;
  status: string;

  // Business Info
  account_type: 'personal' | 'business' | 'fintech' | null;
  company_name?: string;
  entity_type?: string;
  tax_id?: string;
  business_address?: {
    country?: string;
    streetAddress?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
  website?: string;
  industry?: string;
  business_description?: string;
  expected_monthly_volume?: string;
  primary_use_case?: string;

  // Onboarding
  onboarding_step: number;
  onboarding_completed: boolean;
  createdAt: string;
  updatedAt?: string;

  // KYC
  kyc_status: string;
  kyc_record?: {
    id: string;
    status: string;
    riskScore?: number;
    reviewedAt?: string;
    notes?: string[];
  };

  // Business Operations
  business_operations?: {
    volume_swift_monthly?: number;
    volume_local_monthly?: number;
    volume_crypto_monthly?: number;
    volume_international_tx_count?: number;
    volume_local_tx_count?: number;
    operating_currencies?: string[];
    primary_operating_regions?: string[];
  };

  // Owners
  owners: BeneficialOwner[];

  // Documents
  documents: ClientDocument[];

  // Stats
  stats: {
    total_volume: number;
    total_profit: number;
    fee_rate: number;
    transaction_count: number;
  };

  // Missing requirements
  missing_requirements: string[];
}

export interface BeneficialOwner {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  ownership_percentage: number;
  role?: string;
  is_authorized_signer: boolean;
  citizenship?: string;
  date_of_birth?: string;
  residential_country?: string;
  residential_city?: string;
  employment_status?: string;
  occupation?: string;
  pep_screening_completed: boolean;
  verification_status: string;
}

export interface ClientDocument {
  id: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt: string;
  ownerId?: string;
}

export interface ClientDetailResponse {
  success: boolean;
  client: ClientDetail | null;
  error?: string;
}

// =====================================================
// ADMIN CLIENT CREATION API
// =====================================================

export const adminClientApi = {
  // List Clients (Active & Completed)

  // Delete Client (with all related data)
  async deleteClient(clientId: string): Promise<{ success: boolean; message: string }> {
    const response = await adminAxios.delete<{ success: boolean; message: string }>(
      `/client/delete?clientId=${clientId}`
    );

    if (!response.data) {
      throw new Error('Invalid API response: missing data in delete client');
    }

    return response.data;
  },

  // Get Single Client Details (Complete or Draft)
  async getClient(clientId: string): Promise<ClientDetailResponse> {
    const response = await adminAxios.get<ClientDetailResponse>(`/client/${clientId}`);

    if (!response.data) {
      throw new Error('Invalid API response: missing data in get client');
    }

    return response.data;
  },

  // Submit KYC Verification for a Client
  async submitKYC(clientId: string): Promise<{
    success: boolean;
    applicantId?: string;
    verificationId?: string;
    formUrl?: string;
    documentIds?: string[];
    error?: string;
  }> {
    const response = await adminAxios.post<any>(`/client/${clientId}/submit-kyc`);

    if (!response.data) {
      throw new Error('Invalid API response: missing data in submit KYC');
    }

    return response.data;
  },

  // Get KYC Submission Status for a Client
  async getKYCStatus(clientId: string): Promise<{
    hasKycRecord: boolean;
    status?: string; // Real-time status from AMLBot if available, otherwise local DB
    amlbotRequestId?: string; // Verification ID
    amlbotApplicantId?: string; // Applicant ID
    riskScore?: number;
    rejectionDetails?: {
      profile?: { verified: boolean; comment?: string; decline_reasons?: string[] };
      document?: { verified: boolean; comment?: string; decline_reasons?: string[] };
    };
    createdAt?: string;
    updatedAt?: string; // Real-time timestamp from AMLBot if available
  }> {
    const response = await adminAxios.get<{
      hasKycRecord: boolean;
      status?: string;
      amlbotRequestId?: string;
      amlbotApplicantId?: string;
      riskScore?: number;
      rejectionDetails?: {
        profile?: { verified: boolean; comment?: string; decline_reasons?: string[] };
        document?: { verified: boolean; comment?: string; decline_reasons?: string[] };
      };
      createdAt?: string;
      updatedAt?: string;
    }>(`/client/${clientId}/kyc-status`);

    if (!response.data) {
      throw new Error('Invalid API response: missing data in get KYC status');
    }

    return response.data;
  },

  async listClients(params: {
    search?: string;
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    clients: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.type) queryParams.append('type', params.type);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await adminAxios.get<{
      clients: any[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/client/list?${queryParams.toString()}`);

    return response.data;
  },

  // Step 1: Account Type Selection
  async saveStep1(sessionId: string | null, data: Step1Data): Promise<SessionResponse> {
    const payload = sessionId ? { sessionId, ...data } : data;
    const response = await adminAxios.post<SessionResponse>('/client/step-1', payload);

    console.log(response);

    if (!response.data) {
      throw new Error('Invalid API response: missing data in step 1');
    }

    return response.data;
  },

  async getStep1(sessionId: string): Promise<SessionResponse> {
    const response = await adminAxios.get<SessionResponse>(`/client/step-1?sessionId=${sessionId}`);

    if (!response.data) {
      throw new Error('Invalid API response: missing data in get step 1');
    }

    return response.data;
  },

  // Step 2: Business Information
  async saveStep2(sessionId: string, data: Step2Data): Promise<SessionResponse> {
    const response = await adminAxios.post<SessionResponse>('/client/step-2', {
      sessionId,
      ...data,
    });

    if (!response.data) {
      throw new Error('Invalid API response: missing data in step 2');
    }

    return response.data;
  },

  async getStep2(sessionId: string): Promise<SessionResponse> {
    const response = await adminAxios.get<SessionResponse>(`/client/step-2?sessionId=${sessionId}`);

    if (!response.data) {
      throw new Error('Invalid API response: missing data in get step 2');
    }

    return response.data;
  },

  // Step 3: Business Details
  async saveStep3(sessionId: string, data: Step3Data): Promise<SessionResponse> {
    const response = await adminAxios.post<SessionResponse>('/client/step-3', {
      sessionId,
      ...data,
    });

    if (!response.data) {
      throw new Error('Invalid API response: missing data in step 3');
    }

    return response.data;
  },

  async getStep3(sessionId: string): Promise<SessionResponse> {
    const response = await adminAxios.get<SessionResponse>(`/client/step-3?sessionId=${sessionId}`);

    if (!response.data) {
      throw new Error('Invalid API response: missing data in get step 3');
    }

    return response.data;
  },

  // Step 4: Volume & Operations
  async saveStep4(sessionId: string, data: Step4Data): Promise<SessionResponse> {
    const response = await adminAxios.post<SessionResponse>('/client/step-4', {
      sessionId,
      ...data,
    });

    if (!response.data) {
      throw new Error('Invalid API response: missing data in step 4');
    }

    return response.data;
  },

  async getStep4(sessionId: string): Promise<SessionResponse> {
    const response = await adminAxios.get<SessionResponse>(`/client/step-4?sessionId=${sessionId}`);

    if (!response.data) {
      throw new Error('Invalid API response: missing data in get step 4');
    }

    return response.data;
  },

  // Step 5: Owners & Representatives
  async saveStep5(sessionId: string, data: Step5Data): Promise<SessionResponse> {
    const response = await adminAxios.post<SessionResponse>('/client/step-5', {
      sessionId,
      ...data,
    });

    if (!response.data) {
      throw new Error('Invalid API response: missing data in step 5');
    }

    return response.data;
  },

  async getStep5(sessionId: string): Promise<SessionResponse> {
    const response = await adminAxios.get<SessionResponse>(`/client/step-5?sessionId=${sessionId}`);

    if (!response.data) {
      throw new Error('Invalid API response: missing data in get step 5');
    }

    return response.data;
  },

  // Step 6: PEP & Sanctions Screening
  async saveStep6(sessionId: string, data: Step6Data): Promise<SessionResponse> {
    const response = await adminAxios.post<SessionResponse>('/client/step-6', {
      sessionId,
      ...data,
    });

    if (!response.data) {
      throw new Error('Invalid API response: missing data in step 6');
    }

    return response.data;
  },

  async getStep6(sessionId: string): Promise<SessionResponse> {
    const response = await adminAxios.get<SessionResponse>(`/client/step-6?sessionId=${sessionId}`);

    if (!response.data) {
      throw new Error('Invalid API response: missing data in get step 6');
    }

    return response.data;
  },

  // Step 7: Document Upload
  async saveStep7(sessionId: string, data: Step7Data): Promise<SessionResponse> {
    const response = await adminAxios.post<SessionResponse>('/client/step-7', {
      sessionId,
      ...data,
    });

    if (!response.data) {
      throw new Error('Invalid API response: missing data in step 7');
    }

    return response.data;
  },

  async getStep7(sessionId: string): Promise<SessionResponse> {
    const response = await adminAxios.get<SessionResponse>(`/client/step-7?sessionId=${sessionId}`);

    if (!response.data) {
      throw new Error('Invalid API response: missing data in get step 7');
    }

    return response.data;
  },

  // Step 8: Final Submission
  async submitFinal(sessionId: string, data: Step8Data): Promise<FinalSubmissionResponse> {
    const response = await adminAxios.post<FinalSubmissionResponse>('/client/step-8', {
      sessionId,
      ...data,
    });

    if (!response.data) {
      throw new Error('Invalid API response: missing data in step 8');
    }

    return response.data;
  },

  async getStep8(sessionId: string): Promise<SessionResponse> {
    const response = await adminAxios.get<SessionResponse>(`/client/step-8?sessionId=${sessionId}`);

    if (!response.data) {
      throw new Error('Invalid API response: missing data in get step 8');
    }

    return response.data;
  },

  // File Upload
  async uploadDocument(
    sessionId: string,
    file: File,
    documentType: string,
    ownerId?: string
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    formData.append('sessionId', sessionId);
    if (ownerId) {
      formData.append('ownerId', ownerId);
    }

    const response = await adminAxios.post<UploadResponse>('/client/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.data) {
      throw new Error('Invalid API response: missing data in upload document');
    }

    return response.data;
  },

  async deleteDocument(
    sessionId: string,
    documentIndex: number
  ): Promise<{ success: boolean; message: string }> {
    const response = await adminAxios.delete<{ success: boolean; message: string }>(
      `/client/upload?sessionId=${sessionId}&documentIndex=${documentIndex}`
    );

    if (!response.data) {
      throw new Error('Invalid API response: missing data in delete document');
    }

    return response.data;
  },

  // Share Form Functionality
  async shareForm(
    sessionId: string,
    ownerIndex: number,
    recipientEmail: string,
    recipientName: string
  ): Promise<ShareResponse> {
    const response = await adminAxios.post<ShareResponse>('/client/share', {
      sessionId,
      ownerIndex,
      recipientEmail,
      recipientName,
    });

    if (!response.data) {
      throw new Error('Invalid API response: missing data in share form');
    }

    return response.data;
  },

  // =====================================================
  // DYNAMIC TAB APIs (CLIENT DETAILS)
  // =====================================================

  // Documents
  async getDocuments(
    clientId: string
  ): Promise<{ success: boolean; documents: any[]; count: number }> {
    const response = await adminAxios.get(`/client/${clientId}/documents`);
    return response.data;
  },

  async addDocument(clientId: string, data: any): Promise<{ success: boolean; document: any }> {
    const response = await adminAxios.post(`/client/${clientId}/documents`, data);
    return response.data;
  },

  async deleteClientDocument(
    clientId: string,
    documentId: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await adminAxios.delete(`/client/${clientId}/documents`, {
      data: { documentId },
    });
    return response.data;
  },

  // Notes
  async getNotes(clientId: string): Promise<{ success: boolean; notes: any[]; count: number }> {
    const response = await adminAxios.get(`/client/${clientId}/notes`);
    return response.data;
  },

  async createNote(
    clientId: string,
    data: { type: string; content: string }
  ): Promise<{ success: boolean; note: any }> {
    const response = await adminAxios.post(`/client/${clientId}/notes`, data);
    return response.data;
  },

  async deleteNote(
    clientId: string,
    noteId: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await adminAxios.delete(`/client/${clientId}/notes`, {
      data: { noteId },
    });
    return response.data;
  },

  // Activity
  async getActivity(
    clientId: string,
    limit = 50,
    offset = 0
  ): Promise<{ success: boolean; activities: any[]; count: number; total: number }> {
    const response = await adminAxios.get(
      `/client/${clientId}/activity?limit=${limit}&offset=${offset}`
    );
    return response.data;
  },

  // Owners
  async getOwners(
    clientId: string
  ): Promise<{ success: boolean; owners: BeneficialOwner[]; count: number }> {
    const response = await adminAxios.get(`/client/${clientId}/owners`);
    return response.data;
  },

  // Add Representative
  async addRepresentative(
    clientId: string,
    representativeData: {
      firstName: string;
      lastName: string;
      email: string;
      dob?: string;
      phoneCountry?: string;
      phoneNumber?: string;
      title?: string;
      ownershipPercentage: number;
      employmentStatus?: string;
      occupation: string;
      employer?: string;
      annualIncome?: string;
      taxId?: string;
      sourceOfFunds?: string;
      sourceOfWealth?: string;
    }
  ): Promise<{
    success: boolean;
    message?: string;
    representative?: BeneficialOwner;
    error?: string;
  }> {
    const response = await adminAxios.post<{
      success: boolean;
      message?: string;
      representative?: BeneficialOwner;
      error?: string;
    }>(`/client/${clientId}/representatives`, representativeData);

    if (!response.data) {
      throw new Error('Invalid API response: missing data in add representative');
    }

    return response.data;
  },
};

// =====================================================
// SHARED FORM API (for public access)
// =====================================================

export const sharedFormApi = {
  async submitSharedForm(
    shareToken: string,
    updatedOwnerData: Partial<PersonOwner>
  ): Promise<{ success: boolean; message: string }> {
    const response = await adminAxios.put<{ success: boolean; message: string }>('/client/share', {
      shareToken,
      updatedOwnerData,
    });

    if (!response.data) {
      throw new Error('Invalid API response: missing data in submit shared form');
    }

    return response.data;
  },

  // Note: GET endpoint for shared forms would be handled by a separate public route
  // that doesn't require admin authentication
};
