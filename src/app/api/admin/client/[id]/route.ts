import { validateAdminRequest } from '@/lib/auth-utils';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export interface ClientDetailResponse {
  success: boolean;
  client: ClientDetail | null;
  error?: string;
}

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Validate Admin
    const auth = await validateAdminRequest(request);
    if (!auth.isValid) {
      return auth.errorResponse!;
    }

    const { id: clientId } = await params;

    if (!clientId) {
      return NextResponse.json(
        { success: false, client: null, error: 'Client ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 2. First check if this is a completed client (in client_profiles)
    const { data: clientProfile, error: profileError } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('id', clientId)
      .single();

    if (clientProfile && !profileError) {
      // This is a completed client - fetch all related data
      const [
        kycResult,
        ownersResult,
        documentsResult,
        operationsResult,
        transactionsResult,
      ] = await Promise.all([
        supabase
          .from('kyc_records')
          .select('*')
          .eq('userId', clientId)
          .single(),
        supabase
          .from('beneficial_owners')
          .select('*')
          .eq('clientId', clientId)
          .order('ownership_percentage', { ascending: false }),
        supabase
          .from('kyc_documents')
          .select('*')
          .eq('kycRecordId', clientId),
        supabase
          .from('business_operations')
          .select('*')
          .eq('clientId', clientId)
          .single(),
        supabase
          .from('transactions')
          .select('id, amount, type')
          .eq('userId', clientId),
      ]);

      // Calculate stats
      const transactions = transactionsResult.data || [];
      const totalVolume = transactions.reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0);
      const transactionCount = transactions.length;

      // Calculate missing requirements
      const missingRequirements = calculateMissingRequirements(
        clientProfile,
        ownersResult.data || [],
        documentsResult.data || [],
        operationsResult.data
      );

      const response: ClientDetailResponse = {
        success: true,
        client: {
          // Basic Info
          id: clientProfile.id,
          first_name: clientProfile.first_name,
          last_name: clientProfile.last_name,
          mobile: clientProfile.mobile,
          country: clientProfile.country,
          city: clientProfile.city,
          state: clientProfile.state,
          status: clientProfile.status,

          // Business Info
          account_type: clientProfile.account_type,
          company_name: clientProfile.company_name,
          entity_type: clientProfile.entity_type || clientProfile.business_type,
          tax_id: clientProfile.tax_id,
          business_address: clientProfile.business_address,
          website: clientProfile.website,
          industry: clientProfile.industry,
          business_description: clientProfile.business_description,
          expected_monthly_volume: clientProfile.expected_monthly_volume,
          primary_use_case: clientProfile.primary_use_case,

          // Onboarding
          onboarding_step: clientProfile.onboarding_step || 8,
          onboarding_completed: clientProfile.onboarding_completed || true,
          createdAt: clientProfile.createdAt,
          updatedAt: clientProfile.updatedAt,

          // KYC
          kyc_status: kycResult.data?.status || 'not_started',
          kyc_record: kycResult.data ? {
            id: kycResult.data.id,
            status: kycResult.data.status,
            riskScore: kycResult.data.riskScore,
            reviewedAt: kycResult.data.reviewedAt,
            notes: kycResult.data.notes,
          } : undefined,

          // Business Operations
          business_operations: operationsResult.data ? {
            volume_swift_monthly: operationsResult.data.volume_swift_monthly,
            volume_local_monthly: operationsResult.data.volume_local_monthly,
            volume_crypto_monthly: operationsResult.data.volume_crypto_monthly,
            volume_international_tx_count: operationsResult.data.volume_international_tx_count,
            volume_local_tx_count: operationsResult.data.volume_local_tx_count,
            operating_currencies: operationsResult.data.operating_currencies,
            primary_operating_regions: operationsResult.data.primary_operating_regions,
          } : undefined,

          // Owners (Fetched separately by ClientRepresentatives)
          owners: [],

          // Documents (Fetched separately by ClientDocuments)
          documents: [],

          // Stats
          stats: {
            total_volume: totalVolume,
            total_profit: 0, // Calculate based on fee
            fee_rate: 0.25, // Default fee rate
            transaction_count: transactionCount,
          },

          // Missing requirements
          missing_requirements: missingRequirements,
        },
      };

      return NextResponse.json(response);
    }

    // 3. Check if this is an onboarding session (draft client)
    const { data: session, error: sessionError } = await supabase
      .from('onboarding_sessions')
      .select('*')
      .eq('id', clientId)
      .single();

    if (session && !sessionError) {
      // This is a draft/onboarding client
      const sessionData = session.session_data || {};
      const owners = sessionData.owners || [];
      const primaryOwner = owners.find((o: any) => o.type === 'person') || owners[0] || {};
      const businessInfo = sessionData.businessInfo || {};
      const businessDetails = sessionData.businessDetails || {};
      const operationsData = sessionData.operations || {};
      const pepData = sessionData.pepScreening || {};
      const documents = sessionData.documents || [];

      // Calculate missing requirements for draft
      const missingRequirements = calculateDraftMissingRequirements(sessionData);

      const response: ClientDetailResponse = {
        success: true,
        client: {
          // Basic Info
          id: session.id,
          first_name: primaryOwner.firstName || 'New',
          last_name: primaryOwner.lastName || 'Client',
          email: primaryOwner.email,
          mobile: primaryOwner.phone,
          country: businessInfo.country,
          city: businessInfo.address?.city,
          state: businessInfo.state,
          status: 'onboarding',

          // Business Info
          account_type: sessionData.accountType || null,
          company_name: businessInfo.businessName || 'Draft Application',
          entity_type: businessInfo.entityType,
          tax_id: businessInfo.taxId,
          business_address: businessInfo.address,
          website: businessInfo.website,
          industry: businessDetails.industry,
          business_description: businessDetails.businessDescription,
          expected_monthly_volume: businessDetails.expectedMonthlyVolume,
          primary_use_case: businessDetails.primaryUseCase,

          // Onboarding
          onboarding_step: session.current_step || 1,
          onboarding_completed: false,
          createdAt: session.started_at || session.created_at,
          updatedAt: session.last_updated,

          // KYC
          kyc_status: 'not_started',

          // Business Operations
          business_operations: operationsData ? {
            volume_swift_monthly: operationsData.volumeSwiftMonthly,
            volume_local_monthly: operationsData.volumeLocalMonthly,
            volume_crypto_monthly: operationsData.volumeCryptoMonthly,
            volume_international_tx_count: operationsData.volumeInternationalTxCount,
            volume_local_tx_count: operationsData.volumeLocalTxCount,
            operating_currencies: operationsData.operatingCurrencies,
            primary_operating_regions: operationsData.primaryOperatingRegions,
          } : undefined,

          // Owners (Fetched separately)
          owners: [],

          // Documents (Fetched separately)
          documents: [],

          // Stats (empty for draft)
          stats: {
            total_volume: 0,
            total_profit: 0,
            fee_rate: 0.25,
            transaction_count: 0,
          },

          // Missing requirements
          missing_requirements: missingRequirements,
        },
      };

      return NextResponse.json(response);
    }

    // 4. Client not found
    return NextResponse.json(
      { success: false, client: null, error: 'Client not found' },
      { status: 404 }
    );

  } catch (error) {
    console.error('Get client detail error:', error);
    return NextResponse.json(
      { success: false, client: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Calculate missing requirements for a completed client
 */
function calculateMissingRequirements(
  profile: any,
  owners: any[],
  documents: any[],
  operations: any
): string[] {
  const missing: string[] = [];

  // Business operations checks
  if (!operations?.volume_swift_monthly && !operations?.volume_local_monthly) {
    missing.push('Monthly volume estimates required');
  }
  if (!operations?.primary_operating_regions?.length) {
    missing.push('Regions of operation required');
  }

  // Industry/NAICS check
  if (!profile.industry) {
    missing.push('NAICS code required');
  }

  // Owner checks
  const documentTypes = documents.map(d => d.documentType);
  const businessDocTypes = ['formationDocument', 'proofOfRegistration', 'proofOfOwnership', 'bankStatement', 'taxId'];
  const ownerDocTypes = ['owner_passport', 'owner_driversLicense', 'owner_national_id'];

  owners.forEach((owner: any) => {
    const ownerMissing: string[] = [];
    if (!owner.employment_status) ownerMissing.push('employment');
    if (!owner.source_of_income) ownerMissing.push('source of funds');

    if (ownerMissing.length > 0) {
      missing.push(`${owner.first_name} ${owner.last_name}: missing ${ownerMissing.join(', ')}`);
    }

    // Check owner documents
    const hasOwnerDocs = documentTypes.some(dt => dt.startsWith('owner_') && documents.find(d => d.ownerId === owner.id));
    if (!hasOwnerDocs) {
      missing.push(`${owner.first_name} docs: missing ID documents`);
    }
  });

  // Business document checks
  const missingBusinessDocs = businessDocTypes.filter(type => !documentTypes.includes(type));
  if (missingBusinessDocs.length > 0 && profile.account_type !== 'personal') {
    missing.push(`Missing business docs: ${missingBusinessDocs.length} of ${businessDocTypes.length}`);
  }

  return missing;
}

/**
 * Calculate missing requirements for a draft/onboarding client
 */
function calculateDraftMissingRequirements(sessionData: any): string[] {
  const missing: string[] = [];
  const owners = sessionData.owners || [];
  const operations = sessionData.operations || {};
  const documents = sessionData.documents || [];

  // Step validations
  if (!sessionData.accountType) {
    missing.push('Account type not selected');
  }

  if (!sessionData.businessInfo?.businessName) {
    missing.push('Business name required');
  }

  if (!operations?.volumeSwiftMonthly && !operations?.volumeLocalMonthly) {
    missing.push('Monthly volume estimates required');
  }

  if (!operations?.primaryOperatingRegions?.length) {
    missing.push('Regions of operation required');
  }

  if (!sessionData.businessDetails?.industry) {
    missing.push('NAICS code required');
  }

  // Owner checks
  owners.forEach((owner: any) => {
    if (owner.type === 'person') {
      const ownerMissing: string[] = [];
      if (!owner.employmentStatus) ownerMissing.push('employment');
      if (!owner.sourceOfIncome) ownerMissing.push('source of funds');

      if (ownerMissing.length > 0) {
        missing.push(`${owner.firstName || 'Owner'} ${owner.lastName || ''}: missing ${ownerMissing.join(', ')}`);
      }
    }
  });

  // Document checks
  const businessDocTypes = ['formationDocument', 'proofOfRegistration', 'proofOfOwnership', 'bankStatement', 'taxId'];
  const uploadedTypes = documents.map((d: any) => d.type);
  const missingDocs = businessDocTypes.filter(type => !uploadedTypes.includes(type));

  if (missingDocs.length > 0 && sessionData.accountType !== 'personal') {
    missing.push(`Missing business docs: ${missingDocs.length} of ${businessDocTypes.length}`);
  }

  // Owner document checks
  owners.forEach((owner: any) => {
    if (owner.type === 'person') {
      const ownerDocs = documents.filter((d: any) => d.ownerId === owner.id);
      if (ownerDocs.length < 3) {
        missing.push(`${owner.firstName || 'Owner'} docs: ${3 - ownerDocs.length} of 3 missing`);
      }
    }
  });

  return missing;
}
