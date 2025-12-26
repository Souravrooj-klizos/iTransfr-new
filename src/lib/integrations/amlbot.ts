/**
 * AMLBot Integration Client
 *
 * AMLBot API documentation: https://docs.amlbot.com
 * Base URL: https://kyc-api.amlbot.com
 *
 * This client handles:
 * - Creating applicants for KYC verification
 * - Creating and managing verifications
 * - Fetching verification status and results
 *
 * Refactored to use Axios with proper error handling.
 */

import axios, { AxiosError, AxiosInstance } from 'axios';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export type ApplicantType = 'PERSON' | 'COMPANY';
export type VerificationStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'expired';
export type VerificationResult = 'approved' | 'declined' | 'review_needed';

export interface AMLBotApplicant {
  id: string;
  external_id: string;
  type: ApplicantType;
  first_name?: string;
  last_name?: string;
  dob?: string;
  email?: string;
  phone?: string;
  residence_country?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateApplicantRequest {
  type: ApplicantType;
  external_id: string;
  first_name?: string;
  last_name?: string;
  dob?: string;
  email?: string;
  phone?: string;
  residence_country?: string;
}

export interface AMLBotVerification {
  id: string;
  applicant_id: string;
  status: VerificationStatus;
  result?: VerificationResult;
  risk_score?: number;
  types: string[];
  callback_url?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface CreateVerificationRequest {
  applicant_id: string;
  types: string[];
  callback_url?: string;
  form_id?: string;
}

export interface AMLBotWebhookPayload {
  event: 'verification.completed' | 'verification.failed' | 'verification.updated';
  data: {
    verification_id: string;
    applicant_id: string;
    status: VerificationStatus;
    result?: VerificationResult;
    risk_score?: number;
    completed_at?: string;
  };
  timestamp: string;
}

export interface AMLBotForm {
  id: string;
  form_id: string;
  type: string;
  status: string;
  created_at: string;
}

export interface AMLBotFormUrl {
  form_url: string;
  verification_id: string;
  applicant_id: string;
  expires_at: string;
}

export interface CreateFormUrlRequest {
  external_applicant_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  redirect_url?: string;
}

// =====================================================
// AXIOS CLIENT CONFIGURATION
// =====================================================

const AMLBOT_BASE_URL = 'https://kyc-api.amlbot.com';

function getApiKey(): string {
  const apiKey = process.env.AML_BOT_API_KEY;
  if (!apiKey) {
    throw new Error('AML_BOT_API_KEY environment variable is not set');
  }
  return apiKey;
}

/**
 * Create AMLBot Axios instance with auth headers
 */
function createAmlBotClient(): AxiosInstance {
  const client = axios.create({
    baseURL: AMLBOT_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add auth interceptor
  client.interceptors.request.use(config => {
    config.headers.Authorization = `Token ${getApiKey()}`;
    console.log(`[AMLBot] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  });

  // Add response interceptor for logging
  client.interceptors.response.use(
    response => {
      console.log(`[AMLBot] Response ${response.status}:`, response.config.url);
      return response;
    },
    (error: AxiosError) => {
      const status = error.response?.status;
      const data = error.response?.data as any;
      console.error(`[AMLBot] Error ${status}:`, data?.message || error.message);

      // Detailed logging for validation errors
      if (status === 422) {
          console.error('[AMLBot] Validation Error Details:', JSON.stringify(data, null, 2));
      }

      throw error;
    }
  );

  return client;
}

// Lazy-initialized client
let amlBotClient: AxiosInstance | null = null;

function getClient(): AxiosInstance {
  if (!amlBotClient) {
    amlBotClient = createAmlBotClient();
  }
  return amlBotClient;
}

// =====================================================
// APPLICANT FUNCTIONS
// =====================================================

/**
 * Create a new applicant in AMLBot
 */
export async function createApplicant(data: CreateApplicantRequest): Promise<AMLBotApplicant> {
  console.log('[AMLBot] Creating applicant:', data.external_id);
  const response = await getClient().post<any>('/applicants', data);

  console.log('[AMLBot] Create Applicant Raw Response:', JSON.stringify(response.data, null, 2));

  // Handle different response structures
  // Some versions return { applicant_id: "..." }
  // Others return { id: "...", ... } or nested { data: { ... } }
  let applicantId = response.data.id || response.data.applicant_id;

  if (!applicantId && response.data.data) {
     applicantId = response.data.data.id || response.data.data.applicant_id;
  }

  if (!applicantId) {
    console.error('[AMLBot] Failed to extract applicant ID from response');
    throw new Error('Invalid AMLBot response format');
  }

  // Normalize the object to match our expected interface
  const applicant: AMLBotApplicant = {
      ...response.data,
      id: applicantId
  };

  console.log('[AMLBot] Applicant created:', applicant.id);
  return applicant;
}

/**
 * Get an existing applicant by ID
 */
export async function getApplicant(applicantId: string): Promise<AMLBotApplicant> {
  console.log('[AMLBot] Fetching applicant:', applicantId);
  const response = await getClient().get<AMLBotApplicant>(`/applicants/${applicantId}`);
  return response.data;
}

/**
 * Get an applicant by external ID (your user ID)
 */
export async function getApplicantByExternalId(
  externalId: string
): Promise<AMLBotApplicant | null> {
  console.log('[AMLBot] Searching applicant by external ID:', externalId);
  const response = await getClient().get<{ data: AMLBotApplicant[] }>(
    `/applicants?external_id=${encodeURIComponent(externalId)}`
  );
  return response.data.data?.[0] || null;
}

/**
 * Update an existing applicant
 */
export async function updateApplicant(
  applicantId: string,
  data: Partial<CreateApplicantRequest>
): Promise<AMLBotApplicant> {
  console.log('[AMLBot] Updating applicant:', applicantId);
  const response = await getClient().patch<AMLBotApplicant>(`/applicants/${applicantId}`, data);
  return response.data;
}

// =====================================================
// VERIFICATION FUNCTIONS
// =====================================================

/**
 * Create a new verification for an applicant
 * Types can include: 'document-verification', 'selfie-verification', 'aml-screening'
 */
export async function createVerification(
  data: CreateVerificationRequest
): Promise<AMLBotVerification> {
  console.log('[AMLBot] Creating verification for applicant:', data.applicant_id);
  const response = await getClient().post<any>('/verifications', data);

  console.log('[AMLBot] Create Verification Raw Response:', JSON.stringify(response.data, null, 2));

  // Handle different response structures
  // Handle different response structures
  let verificationId = response.data.id || response.data.verification_id;

  if (!verificationId && response.data.data) {
     verificationId = response.data.data.id || response.data.data.verification_id;
  }

  if (!verificationId) {
    console.error('[AMLBot] Failed to extract verification ID from response');
    throw new Error('Invalid AMLBot verification response format');
  }

  // Normalize the object
  const verification: AMLBotVerification = {
      ...response.data,
      id: verificationId
  };

  console.log('[AMLBot] Verification created:', verification.id);
  return verification;
}

/**
 * Get verification by ID
 */
export async function getVerification(verificationId: string): Promise<AMLBotVerification> {
  console.log('[AMLBot] Fetching verification:', verificationId);
  const response = await getClient().get<AMLBotVerification>(`/verifications/${verificationId}`);
  return response.data;
}

/**
 * Get all verifications for an applicant
 */
export async function getVerificationsForApplicant(
  applicantId: string
): Promise<AMLBotVerification[]> {
  console.log('[AMLBot] Fetching verifications for applicant:', applicantId);
  const response = await getClient().get<{ data: AMLBotVerification[] }>(
    `/verifications?applicant_id=${applicantId}`
  );
  return response.data.data || [];
}

// =====================================================
// FORMS API FUNCTIONS (Primary method for KYC)
// =====================================================

/**
 * Get list of available forms
 */
export async function getForms(): Promise<AMLBotForm[]> {
  console.log('[AMLBot] Fetching forms list...');
  const response = await getClient().get<{ items: AMLBotForm[] }>('/forms');
  console.log('[AMLBot] Forms retrieved:', response.data.items?.length || 0);
  return response.data.items || [];
}

/**
 * Get a form URL for a user to complete KYC
 * This is the primary method to start KYC verification
 */
export async function getFormUrl(
  formId: string,
  data: CreateFormUrlRequest
): Promise<AMLBotFormUrl> {
  console.log('[AMLBot] Getting form URL for:', data.external_applicant_id);
  const response = await getClient().post<AMLBotFormUrl>(`/forms/${formId}/urls`, data);
  console.log('[AMLBot] Form URL created, verification ID:', response.data.verification_id);
  return response.data;
}

// =====================================================
// WEBHOOK VERIFICATION
// =====================================================

/**
 * Verify webhook signature (if webhook secret is configured)
 */
export function verifyWebhookSignature(payload: string, signature: string): boolean {
  const secret = process.env.AML_BOT_WEBHOOK_SECRET;

  if (!secret) {
    console.warn('[AMLBot] Webhook secret not configured, skipping verification');
    return true;
  }

  const crypto = require('crypto');
  const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return signature === expectedSignature;
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Test API connection
 */
export async function testConnection(): Promise<{
  success: boolean;
  details: string;
  status?: number;
}> {
  try {
    console.log('[AMLBot] Testing connection...');
    console.log('[AMLBot] Base URL:', AMLBOT_BASE_URL);
    console.log('[AMLBot] API Key (first 8 chars):', getApiKey().substring(0, 8) + '...');

    const response = await getClient().get('/forms');

    console.log('[AMLBot] ✅ Connection successful');
    return { success: true, details: 'Connection successful', status: response.status };
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;
      console.error('[AMLBot] ❌ Connection failed:', status, message);
      return { success: false, details: `HTTP ${status}: ${message}`, status };
    }
    console.error('[AMLBot] ❌ Connection error:', error.message);
    return { success: false, details: error.message };
  }
}

/**
 * Map AMLBot result to internal KYC status
 */
export function mapVerificationResultToKycStatus(
  result: VerificationResult | undefined
): 'approved' | 'rejected' | 'under_review' {
  switch (result) {
    case 'approved':
      return 'approved';
    case 'declined':
      return 'rejected';
    case 'review_needed':
      return 'under_review';
    default:
      return 'under_review';
  }
}

// =====================================================
// DOCUMENT VERIFICATION FUNCTIONS
// =====================================================

export interface DocumentUploadRequest {
  applicantId: string;
  documentType: 'passport' | 'national_id' | 'drivers_license' | 'residence_permit' | 'other';
  documentSide?: 'front' | 'back';
  fileContent: Buffer | string; // Base64 string or Buffer
  fileName: string;
  country?: string;
}

export interface DocumentUploadResponse {
  documentId: string;
  applicantId: string;
  type: string;
  status: 'uploaded' | 'processing' | 'verified' | 'rejected';
  createdAt: string;
}

export interface DocumentVerificationRequest {
  applicantId: string;
  documentIds?: string[]; // If not provided, verifies all uploaded documents
  types?: string[]; // Verification types: 'document', 'face', 'database'
}

export interface DocumentVerificationStatus {
  verificationId: string;
  applicantId: string;
  status: VerificationStatus;
  result?: VerificationResult;
  documents: Array<{
    documentId: string;
    type: string;
    status: 'pending' | 'verified' | 'rejected';
    rejectionReasons?: string[];
    extractedData?: {
      documentNumber?: string;
      fullName?: string;
      dateOfBirth?: string;
      expiryDate?: string;
      issueDate?: string;
      nationality?: string;
    };
  }>;
  createdAt: string;
  completedAt?: string;
}

/**
 * Upload a document for an applicant
 * This is used for document-based KYC verification
 */
export async function uploadDocument(
  data: DocumentUploadRequest
): Promise<DocumentUploadResponse> {
  console.log('[AMLBot] Uploading document for applicant:', data.applicantId);

  // Prepare form data
  const formData = new FormData();
  formData.append('applicant_id', data.applicantId);
  formData.append('type', data.documentType);

  if (data.documentSide) {
    formData.append('side', data.documentSide);
  }

  if (data.country) {
    formData.append('country', data.country);
  }

  // Handle file content
  let fileBlob: Blob;
  if (typeof data.fileContent === 'string') {
    // Base64 string
    const base64Data = data.fileContent.replace(/^data:.*?;base64,/, '');
    const binaryData = Buffer.from(base64Data, 'base64');
    fileBlob = new Blob([new Uint8Array(binaryData)]);
  } else {
    // Buffer
    fileBlob = new Blob([new Uint8Array(data.fileContent)]);
  }

  formData.append('file', fileBlob, data.fileName);

  const response = await getClient().post<any>('/documents', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  console.log('[AMLBot] Document uploaded:', response.data.id || response.data.document_id);

  return {
    documentId: response.data.id || response.data.document_id,
    applicantId: data.applicantId,
    type: response.data.type || data.documentType,
    status: response.data.status || 'uploaded',
    createdAt: response.data.created_at || new Date().toISOString(),
  };
}

/**
 * Create a document verification request
 * This triggers the actual verification process
 */
export async function createDocumentVerification(
  data: DocumentVerificationRequest
): Promise<AMLBotVerification> {
  console.log('[AMLBot] Creating document verification for applicant:', data.applicantId);

  const verificationTypes = data.types || ['DOCUMENT_VERIFICATION'];

  const requestPayload: CreateVerificationRequest = {
    applicant_id: data.applicantId,
    types: verificationTypes,
  };

  const response = await createVerification(requestPayload);
  console.log('[AMLBot] Document verification created:', response.id);

  return response;
}

/**
 * Get detailed document verification status
 */
export async function getDocumentVerificationStatus(
  verificationId: string
): Promise<DocumentVerificationStatus> {
  console.log('[AMLBot] Fetching document verification status:', verificationId);

  const verification = await getVerification(verificationId);

  // Fetch documents for this verification
  // Note: Actual endpoint may vary based on AMLBot API
  let documents: any[] = [];
  try {
    const docsResponse = await getClient().get<any>(
      `/verifications/${verificationId}/documents`
    );
    documents = docsResponse.data.documents || docsResponse.data || [];
  } catch (error) {
    console.warn('[AMLBot] Could not fetch detailed document info:', error);
  }

  return {
    verificationId: verification.id,
    applicantId: verification.applicant_id,
    status: verification.status,
    result: verification.result,
    documents: documents.map((doc: any) => ({
      documentId: doc.id || doc.document_id,
      type: doc.type,
      status: doc.status || 'pending',
      rejectionReasons: doc.rejection_reasons || [],
      extractedData: doc.extracted_data || {},
    })),
    createdAt: verification.created_at,
    completedAt: verification.completed_at,
  };
}

/**
 * Check if applicant has sufficient documents for verification
 */
export async function checkApplicantDocuments(
  applicantId: string
): Promise<{
  hasDocuments: boolean;
  documentCount: number;
  documents: Array<{ id: string; type: string; status: string }>;
}> {
  console.log('[AMLBot] Checking documents for applicant:', applicantId);

  try {
    const response = await getClient().get<any>(
      `/applicants/${applicantId}/documents`
    );

    const documents = response.data.documents || response.data || [];

    return {
      hasDocuments: documents.length > 0,
      documentCount: documents.length,
      documents: documents.map((doc: any) => ({
        id: doc.id || doc.document_id,
        type: doc.type,
        status: doc.status || 'unknown',
      })),
    };
  } catch (error) {
    console.warn('[AMLBot] Could not fetch applicant documents:', error);
    return {
      hasDocuments: false,
      documentCount: 0,
      documents: [],
    };
  }
}

