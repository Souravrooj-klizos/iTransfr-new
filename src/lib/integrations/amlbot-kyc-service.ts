/**
 * AMLBot KYC Service - Complete Integration
 *
 * This service handles the complete KYC verification flow with AMLBot:
 * 1. Create Applicant - Register the person/company in AMLBot
 * 2. Upload Files - Upload document images to AMLBot
 * 3. Create Documents - Link files to document records with proper types
 * 4. Create Verification - Start the verification process
 *
 * AMLBot API documentation: https://kyc-docs.amlbot.com
 * Base URL: https://kyc-api.amlbot.com
 */

import axios, { AxiosError, AxiosInstance } from 'axios';
import FormData from 'form-data';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export type AMLBotDocumentType =
  | 'PASSPORT'
  | 'DOMESTIC_PASSPORT'
  | 'GOVERNMENT_ID'
  | 'DRIVERS_LICENSE'
  | 'PERMANENT_RESIDENCE_PERMIT'
  | 'REFUGEE_CARD'
  | 'FOREIGN_CITIZEN_PASSPORT'
  | 'DIPLOMATIC_PASSPORT'
  | 'VISA'
  | 'VOTING_CARD'
  | 'VEHICLE_PASSPORT'
  | 'OTHER'
  | 'FINANCIAL_DOCUMENT'
  | 'SELFIE';

export type AMLBotVerificationType =
  | 'DOCUMENT'
  | 'AML'
  | 'PASSPORT'
  | 'SELFIE'
  | 'LIVENESS'
  | 'ADDRESS';

export interface AMLBotApplicant {
  applicant_id: string;
  type: 'PERSON' | 'COMPANY';
  first_name?: string;
  last_name?: string;
  dob?: string;
  email?: string;
  phone?: string;
  residence_country?: string;
  nationality?: string;
  created_at?: string;
}

export interface CreateApplicantInput {
  type: 'PERSON' | 'COMPANY';
  first_name?: string;
  last_name?: string;
  dob?: string; // YYYY-MM-DD format
  email?: string;
  phone?: string;
  residence_country?: string; // ISO 3166-1 alpha-2
  nationality?: string; // ISO 3166-1 alpha-2
}

export interface AMLBotFile {
  file_id: string;
  file_name?: string;
  mime_type?: string;
  size?: number;
  created_at?: string;
}

export interface AMLBotDocument {
  document_id: string;
  applicant_id: string;
  type: AMLBotDocumentType;
  document_number?: string;
  issue_date?: string;
  expiry_date?: string;
  front_side_id?: string;
  back_side_id?: string;
  created_at?: string;
}

export interface CreateDocumentInput {
  applicant_id: string;
  type: AMLBotDocumentType;
  document_number?: string;
  issue_date?: string; // YYYY-MM-DD
  expiry_date?: string; // YYYY-MM-DD
  front_side_id: string; // File ID from upload
  back_side_id?: string; // File ID from upload (optional for some docs)
}

export interface AMLBotVerification {
  verification_id: string;
  applicant_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'expired';
  result?: 'approved' | 'declined' | 'review_needed';
  types: AMLBotVerificationType[];
  form_id?: string;
  callback_url?: string;
  created_at?: string;
}

export interface CreateVerificationInput {
  applicant_id: string;
  types: AMLBotVerificationType[];
  form_id?: string;
  callback_url?: string;
}

export interface AMLBotForm {
  form_id: string;
  name: string;
  status: string;
}

export interface GetFormUrlInput {
  applicant_id?: string;
  external_applicant_id?: string;
  redirect_url?: string;
}

export interface AMLBotFormUrl {
  form_url: string;
  verification_id: string;
  applicant_id: string;
  expires_at: string;
}

// Map our document types to AMLBot document types
export const DOCUMENT_TYPE_MAP: Record<string, AMLBotDocumentType> = {
  passport: 'PASSPORT',
  driversLicenseFront: 'DRIVERS_LICENSE',
  driversLicenseBack: 'DRIVERS_LICENSE',
  idCard: 'GOVERNMENT_ID',
  idCardBack: 'GOVERNMENT_ID',
  selfie: 'SELFIE',
  proofOfAddress: 'OTHER',
  bankStatement: 'FINANCIAL_DOCUMENT',
  taxId: 'OTHER',
  formationDocument: 'OTHER',
  proofOfRegistration: 'OTHER',
  proofOfOwnership: 'OTHER',
  owner_passport: 'PASSPORT',
  owner_driversLicense: 'DRIVERS_LICENSE',
  owner_national_id: 'GOVERNMENT_ID',
  owner_proof_of_address: 'OTHER',
  owner_selfie: 'SELFIE',
};

// =====================================================
// AXIOS CLIENT
// =====================================================

const AMLBOT_BASE_URL = 'https://kyc-api.amlbot.com';

function getApiKey(): string {
  const apiKey = process.env.AML_BOT_API_KEY;
  if (!apiKey) {
    throw new Error('AML_BOT_API_KEY environment variable is not set');
  }
  return apiKey;
}

function createAmlBotClient(): AxiosInstance {
  const client = axios.create({
    baseURL: AMLBOT_BASE_URL,
    timeout: 60000, // 60 seconds for file uploads
  });

  // Add auth interceptor
  client.interceptors.request.use(config => {
    config.headers.Authorization = `Token ${getApiKey()}`;
    console.log(`[AMLBot KYC] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  });

  // Add response interceptor for logging
  client.interceptors.response.use(
    response => {
      console.log(`[AMLBot KYC] Response ${response.status}:`, response.config.url);
      return response;
    },
    (error: AxiosError) => {
      const status = error.response?.status;
      const data = error.response?.data as any;
      console.error(`[AMLBot KYC] Error ${status}:`, JSON.stringify(data, null, 2));
      throw error;
    }
  );

  return client;
}

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
export async function createApplicant(data: CreateApplicantInput): Promise<AMLBotApplicant> {
  console.log('[AMLBot KYC] Creating applicant:', data);

  const response = await getClient().post<any>('/applicants', data);

  console.log('[AMLBot KYC] Applicant response:', JSON.stringify(response.data, null, 2));

  // Handle different response formats
  const applicantId = response.data.applicant_id || response.data.id;

  if (!applicantId) {
    throw new Error('Failed to get applicant ID from AMLBot response');
  }

  return {
    applicant_id: applicantId,
    type: data.type,
    first_name: data.first_name,
    last_name: data.last_name,
    dob: data.dob,
    email: data.email,
    phone: data.phone,
    residence_country: data.residence_country,
    nationality: data.nationality,
  };
}

/**
 * Get an existing applicant
 */
export async function getApplicant(applicantId: string): Promise<AMLBotApplicant> {
  console.log('[AMLBot KYC] Getting applicant:', applicantId);

  const response = await getClient().get<any>(`/applicants/${applicantId}`);

  return {
    applicant_id: response.data.applicant_id || response.data.id,
    ...response.data,
  };
}

/**
 * Update an existing applicant
 */
export async function updateApplicant(
  applicantId: string,
  data: Partial<CreateApplicantInput>
): Promise<AMLBotApplicant> {
  console.log('[AMLBot KYC] Updating applicant:', applicantId);

  const response = await getClient().patch<any>(`/applicants/${applicantId}`, data);

  return {
    applicant_id: response.data.applicant_id || response.data.id,
    ...response.data,
  };
}

// =====================================================
// FILE FUNCTIONS
// =====================================================

/**
 * Upload a file to AMLBot
 * This returns a file_id that can be used when creating documents
 */
export async function uploadFile(
  fileBuffer: Buffer,
  fileName: string,
  mimeType?: string
): Promise<AMLBotFile> {
  console.log('[AMLBot KYC] Uploading file:', fileName);

  const formData = new FormData();
  formData.append('file', fileBuffer, {
    filename: fileName,
    contentType: mimeType || 'application/octet-stream',
  });

  const response = await getClient().post<any>('/files', formData, {
    headers: {
      ...formData.getHeaders(),
    },
  });

  console.log('[AMLBot KYC] File upload response:', JSON.stringify(response.data, null, 2));

  const fileId = response.data.file_id || response.data.id;

  if (!fileId) {
    throw new Error('Failed to get file ID from AMLBot response');
  }

  return {
    file_id: fileId,
    file_name: fileName,
    mime_type: mimeType,
  };
}

/**
 * Upload a file from a URL (fetches and uploads to AMLBot)
 */
export async function uploadFileFromUrl(
  fileUrl: string,
  fileName: string,
  mimeType?: string
): Promise<AMLBotFile> {
  console.log('[AMLBot KYC] Downloading file from URL:', fileUrl);

  // Fetch the file
  const fileResponse = await axios.get(fileUrl, {
    responseType: 'arraybuffer',
  });

  const fileBuffer = Buffer.from(fileResponse.data);
  const contentType = mimeType || fileResponse.headers['content-type'];

  return uploadFile(fileBuffer, fileName, contentType);
}

/**
 * Upload a file from base64
 */
export async function uploadFileFromBase64(
  base64Data: string,
  fileName: string,
  mimeType?: string
): Promise<AMLBotFile> {
  console.log('[AMLBot KYC] Uploading file from base64:', fileName);

  // Remove data URL prefix if present
  const base64Clean = base64Data.replace(/^data:.*?;base64,/, '');
  const fileBuffer = Buffer.from(base64Clean, 'base64');

  return uploadFile(fileBuffer, fileName, mimeType);
}

// =====================================================
// DOCUMENT FUNCTIONS
// =====================================================

/**
 * Create a document record in AMLBot
 * This links uploaded files to a document type
 */
export async function createDocument(data: CreateDocumentInput): Promise<AMLBotDocument> {
  console.log('[AMLBot KYC] Creating document:', data.type);

  const payload: any = {
    applicant_id: data.applicant_id,
    type: data.type,
    front_side_id: data.front_side_id,
  };

  if (data.back_side_id) {
    payload.back_side_id = data.back_side_id;
  }

  if (data.document_number) {
    payload.document_number = data.document_number;
  }

  if (data.issue_date) {
    payload.issue_date = data.issue_date;
  }

  if (data.expiry_date) {
    payload.expiry_date = data.expiry_date;
  }

  const response = await getClient().post<any>('/documents', payload);

  console.log('[AMLBot KYC] Document response:', JSON.stringify(response.data, null, 2));

  const documentId = response.data.document_id || response.data.id;

  if (!documentId) {
    throw new Error('Failed to get document ID from AMLBot response');
  }

  return {
    document_id: documentId,
    applicant_id: data.applicant_id,
    type: data.type,
    document_number: data.document_number,
    issue_date: data.issue_date,
    expiry_date: data.expiry_date,
    front_side_id: data.front_side_id,
    back_side_id: data.back_side_id,
  };
}

/**
 * Get a document
 */
export async function getDocument(documentId: string): Promise<AMLBotDocument> {
  console.log('[AMLBot KYC] Getting document:', documentId);

  const response = await getClient().get<any>(`/documents/${documentId}`);

  return {
    document_id: response.data.document_id || response.data.id,
    ...response.data,
  };
}

// =====================================================
// VERIFICATION FUNCTIONS
// =====================================================

/**
 * Create a verification for an applicant
 *
 * IMPORTANT: AMLBot API REQUIRES a form_id to create a verification.
 * The form_id determines what types of verification will be performed.
 *
 * Note: Documents must be uploaded first!
 */
export async function createVerification(
  data: CreateVerificationInput
): Promise<AMLBotVerification> {
  console.log('[AMLBot KYC] Creating verification for applicant:', data.applicant_id);

  // AMLBot REQUIRES a form_id - use the provided one or fall back to default
  const formId = data.form_id || process.env.AMLBOT_FORM_ID || process.env.AMLBOT_DEFAULT_FORM_ID;

  if (!formId) {
    throw new Error('AMLBot form_id is required. Set AMLBOT_FORM_ID environment variable or provide form_id.');
  }

  console.log('[AMLBot KYC] Using form_id:', formId);

  // AMLBot API: form_id is REQUIRED, types are optional (determined by the form)
  const payload: any = {
    applicant_id: data.applicant_id,
    form_id: formId,
  };

  // Types are optional - the form determines what verification types are performed
  // But we can still pass them if the user wants to override
  if (data.types && data.types.length > 0) {
    payload.types = data.types;
  }

  if (data.callback_url) {
    payload.callback_url = data.callback_url;
  }

  console.log('[AMLBot KYC] Verification payload:', JSON.stringify(payload, null, 2));

  const response = await getClient().post<any>('/verifications', payload);

  console.log('[AMLBot KYC] Verification response:', JSON.stringify(response.data, null, 2));

  const verificationId = response.data.verification_id || response.data.id;

  if (!verificationId) {
    throw new Error('Failed to get verification ID from AMLBot response');
  }

  return {
    verification_id: verificationId,
    applicant_id: data.applicant_id,
    status: response.data.status || 'pending',
    types: data.types,
    form_id: formId,
    callback_url: data.callback_url,
  };
}

/**
 * Get a verification status
 */
export async function getVerification(verificationId: string): Promise<AMLBotVerification> {
  console.log('[AMLBot KYC] Getting verification:', verificationId);

  const response = await getClient().get<any>(`/verifications/${verificationId}`);

  return {
    verification_id: response.data.verification_id || response.data.id,
    ...response.data,
  };
}

// =====================================================
// FORMS FUNCTIONS
// =====================================================

/**
 * Get list of available forms
 */
export async function getForms(): Promise<AMLBotForm[]> {
  console.log('[AMLBot KYC] Getting forms list');

  const response = await getClient().get<any>('/forms');

  return response.data.items || response.data || [];
}

/**
 * Get a form URL for user to complete KYC
 * This is an alternative to API-based document upload
 */
export async function getFormUrl(
  formId: string,
  data: GetFormUrlInput
): Promise<AMLBotFormUrl> {
  console.log('[AMLBot KYC] Getting form URL for form:', formId);

  const response = await getClient().post<any>(`/forms/${formId}/urls`, data);

  return {
    form_url: response.data.form_url || response.data.url,
    verification_id: response.data.verification_id,
    applicant_id: response.data.applicant_id,
    expires_at: response.data.expires_at,
  };
}

// =====================================================
// COMPLETE KYC SUBMISSION FLOW
// =====================================================

export interface KYCDocument {
  type: string; // Our internal document type
  fileName: string;
  fileUrl?: string; // URL to download file from
  fileBase64?: string; // Base64 file content
  mimeType?: string;
  documentNumber?: string;
  issueDate?: string;
  expiryDate?: string;
}

export interface KYCSubmissionInput {
  // Applicant info
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string; // YYYY-MM-DD
  residenceCountry?: string; // ISO 3166-1 alpha-2
  nationality?: string;

  // Documents
  documents: KYCDocument[];

  // Verification options
  verificationTypes?: AMLBotVerificationType[];
  formId?: string;
  callbackUrl?: string;
}

export interface KYCSubmissionResult {
  success: boolean;
  applicantId: string;
  verificationId?: string;
  formUrl?: string;
  documentIds: string[];
  error?: string;
}

/**
 * Complete KYC submission flow
 * This handles the entire process:
 * 1. Create applicant
 * 2. Upload files
 * 3. Create documents
 * 4. Create verification
 *
 * Note: AMLBot only allows ONE document per type. If multiple documents
 * map to the same type (e.g., multiple "OTHER" documents), only the first
 * will be uploaded and the rest will be skipped.
 */
export async function submitKYC(input: KYCSubmissionInput): Promise<KYCSubmissionResult> {
  console.log('[AMLBot KYC] Starting KYC submission for:', input.firstName, input.lastName);

  const documentIds: string[] = [];
  const usedDocumentTypes: Set<AMLBotDocumentType> = new Set();
  const skippedDocuments: string[] = [];
  let applicantId = '';

  try {
    // Step 1: Create applicant
    const applicant = await createApplicant({
      type: 'PERSON',
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      phone: input.phone,
      dob: input.dateOfBirth,
      residence_country: input.residenceCountry,
      nationality: input.nationality,
    });

    applicantId = applicant.applicant_id;
    console.log('[AMLBot KYC] Created applicant:', applicantId);

    // Step 2 & 3: Upload files and create documents
    // Group documents by type (front/back pairs)
    const documentGroups = groupDocuments(input.documents);

    // Sort document groups to prioritize identity documents (PASSPORT, GOVERNMENT_ID, etc.)
    // These are more important for KYC than generic "OTHER" documents
    const prioritizedGroups = documentGroups.sort((a, b) => {
      const typeA = DOCUMENT_TYPE_MAP[a.type] || 'OTHER';
      const typeB = DOCUMENT_TYPE_MAP[b.type] || 'OTHER';

      // Priority order: identity docs first, then financial, then other
      const priority: Record<string, number> = {
        'PASSPORT': 1,
        'GOVERNMENT_ID': 2,
        'DRIVERS_LICENSE': 3,
        'SELFIE': 4,
        'FINANCIAL_DOCUMENT': 5,
        'OTHER': 6,
      };

      return (priority[typeA] || 10) - (priority[typeB] || 10);
    });

    for (const group of prioritizedGroups) {
      const amlbotDocType = DOCUMENT_TYPE_MAP[group.type] || 'OTHER';

      // Check if this document type has already been used
      // AMLBot only allows ONE document per type
      if (usedDocumentTypes.has(amlbotDocType)) {
        console.log(`[AMLBot KYC] Skipping duplicate document type: ${amlbotDocType} (${group.type})`);
        skippedDocuments.push(`${group.type} (duplicate ${amlbotDocType})`);
        continue;
      }

      try {
        // Upload front side
        let frontFileId: string | undefined;
        if (group.front) {
          const frontFile = await uploadDocumentFile(group.front);
          frontFileId = frontFile.file_id;
        }

        // Upload back side if exists
        let backFileId: string | undefined;
        if (group.back) {
          const backFile = await uploadDocumentFile(group.back);
          backFileId = backFile.file_id;
        }

        // Create document if we have at least the front side
        if (frontFileId) {
          const document = await createDocument({
            applicant_id: applicantId,
            type: amlbotDocType,
            front_side_id: frontFileId,
            back_side_id: backFileId,
            document_number: group.front?.documentNumber,
            issue_date: group.front?.issueDate,
            expiry_date: group.front?.expiryDate,
          });

          documentIds.push(document.document_id);
          usedDocumentTypes.add(amlbotDocType);
          console.log('[AMLBot KYC] Created document:', document.document_id, amlbotDocType);
        }
      } catch (docError: any) {
        // Log error but continue with other documents
        console.error(`[AMLBot KYC] Failed to upload document ${group.type}:`, docError.message);
        skippedDocuments.push(`${group.type} (upload failed)`);

        // If it's a duplicate error, mark the type as used
        if (docError.response?.data?.type === 'limit_exceeded') {
          usedDocumentTypes.add(amlbotDocType);
        }
      }
    }

    if (skippedDocuments.length > 0) {
      console.log('[AMLBot KYC] Skipped documents:', skippedDocuments.join(', '));
    }

    // Step 4: Create verification (even if some documents failed)
    // Note: form_id is REQUIRED - if not provided in input, will use AMLBOT_FORM_ID env var
    if (documentIds.length === 0) {
      console.warn('[AMLBot KYC] No documents uploaded successfully, verification may still work if form allows it');
    }

    // Don't pass types - let the form configuration determine verification types
    const verification = await createVerification({
      applicant_id: applicantId,
      types: input.verificationTypes || [], // Optional - form determines types
      form_id: input.formId, // Will use AMLBOT_FORM_ID env var as fallback
      callback_url: input.callbackUrl,
    });

    console.log('[AMLBot KYC] Created verification:', verification.verification_id);
    console.log('[AMLBot KYC] Total documents uploaded:', documentIds.length);

    return {
      success: true,
      applicantId: applicantId,
      verificationId: verification.verification_id,
      documentIds,
    };

  } catch (error: any) {
    console.error('[AMLBot KYC] Submission error:', error);

    // Return partial success if we have an applicant
    return {
      success: false,
      applicantId: applicantId,
      documentIds,
      error: error.response?.data?.message || error.message || 'KYC submission failed',
    };
  }
}


/**
 * Alternative: Get a form URL for the user to complete KYC
 * Use this when you want the user to upload documents themselves
 */
export async function getKYCFormUrl(
  formId: string,
  firstName: string,
  lastName: string,
  email?: string,
  redirectUrl?: string
): Promise<KYCSubmissionResult> {
  try {
    // Create applicant first
    const applicant = await createApplicant({
      type: 'PERSON',
      first_name: firstName,
      last_name: lastName,
      email: email,
    });

    // Get form URL
    const formUrlResult = await getFormUrl(formId, {
      applicant_id: applicant.applicant_id,
      redirect_url: redirectUrl,
    });

    return {
      success: true,
      applicantId: applicant.applicant_id,
      verificationId: formUrlResult.verification_id,
      formUrl: formUrlResult.form_url,
      documentIds: [],
    };

  } catch (error: any) {
    console.error('[AMLBot KYC] Form URL error:', error);

    return {
      success: false,
      applicantId: '',
      documentIds: [],
      error: error.response?.data?.message || error.message || 'Failed to get form URL',
    };
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

interface DocumentGroup {
  type: string;
  front?: KYCDocument;
  back?: KYCDocument;
}

function groupDocuments(documents: KYCDocument[]): DocumentGroup[] {
  const groups: Map<string, DocumentGroup> = new Map();

  for (const doc of documents) {
    const baseType = doc.type.replace(/Front$|Back$/, '');

    if (!groups.has(baseType)) {
      groups.set(baseType, { type: baseType });
    }

    const group = groups.get(baseType)!;

    if (doc.type.endsWith('Back')) {
      group.back = doc;
    } else {
      group.front = doc;
    }
  }

  return Array.from(groups.values());
}

async function uploadDocumentFile(doc: KYCDocument): Promise<AMLBotFile> {
  if (doc.fileUrl) {
    return uploadFileFromUrl(doc.fileUrl, doc.fileName, doc.mimeType);
  } else if (doc.fileBase64) {
    return uploadFileFromBase64(doc.fileBase64, doc.fileName, doc.mimeType);
  } else {
    throw new Error(`No file content provided for document: ${doc.type}`);
  }
}

/**
 * Test AMLBot connection
 */
export async function testConnection(): Promise<{
  success: boolean;
  message: string;
  forms?: AMLBotForm[];
}> {
  try {
    console.log('[AMLBot KYC] Testing connection...');
    const forms = await getForms();
    console.log('[AMLBot KYC] Connection successful, found', forms.length, 'forms');
    return {
      success: true,
      message: `Connection successful. Found ${forms.length} forms.`,
      forms,
    };
  } catch (error: any) {
    console.error('[AMLBot KYC] Connection test failed:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Connection failed',
    };
  }
}
