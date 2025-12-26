/**
 * Admin API to submit KYC for an existing client
 *
 * POST /api/admin/client/[id]/submit-kyc
 *
 * This endpoint allows admins to manually trigger KYC/AML verification
 * for clients who have uploaded documents.
 */

import { validateAdminRequest } from '@/lib/auth-utils';
import {
    DOCUMENT_TYPE_MAP,
    getKYCFormUrl,
    submitKYC,
    type KYCDocument,
} from '@/lib/integrations/amlbot-kyc-service';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export interface SubmitKYCResponse {
  success: boolean;
  applicantId?: string;
  verificationId?: string;
  formUrl?: string;
  documentIds?: string[];
  error?: string;
}

export async function POST(
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
        { success: false, error: 'Client ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 2. Check if this is a completed client or an onboarding session
    let clientData: any = null;
    let owners: any[] = [];
    let documents: any[] = [];
    let isOnboardingSession = false;

    // First check client_profiles
    const { data: clientProfile, error: profileError } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('id', clientId)
      .single();

    if (clientProfile && !profileError) {
      clientData = clientProfile;

      // Get owners
      const { data: ownersData } = await supabase
        .from('beneficial_owners')
        .select('*')
        .eq('clientId', clientId);
      owners = ownersData || [];

      // Get documents from kyc_documents
      const { data: kycRecord } = await supabase
        .from('kyc_records')
        .select('id')
        .eq('userId', clientId)
        .single();

      if (kycRecord) {
        const { data: docsData } = await supabase
          .from('kyc_documents')
          .select('*')
          .eq('kycRecordId', kycRecord.id);
        documents = docsData || [];
      }
    } else {
      // Check if it's an onboarding session
      const { data: session, error: sessionError } = await supabase
        .from('onboarding_sessions')
        .select('*')
        .eq('id', clientId)
        .single();

      if (session && !sessionError) {
        isOnboardingSession = true;
        const sessionData = session.session_data || {};

        // Get primary owner from session data
        owners = sessionData.owners || [];
        documents = sessionData.documents || [];

        clientData = {
          first_name: owners[0]?.firstName || 'Unknown',
          last_name: owners[0]?.lastName || 'Unknown',
          country: sessionData.businessInfo?.country,
        };
      } else {
        return NextResponse.json(
          { success: false, error: 'Client not found' },
          { status: 404 }
        );
      }
    }

    // 3. Find primary person owner
    let primaryOwner: any = null;

    if (isOnboardingSession) {
      primaryOwner = owners.find((o: any) => o.type === 'person') || owners[0];
    } else {
      primaryOwner = owners[0]; // For completed clients, all owners are persons
    }

    if (!primaryOwner) {
      return NextResponse.json(
        { success: false, error: 'No owner found for KYC verification' },
        { status: 400 }
      );
    }

    // 4. Prepare documents for AMLBot
    const kycDocuments: KYCDocument[] = documents
      .filter((doc: any) => {
        const docType = doc.type || doc.documentType;
        return (doc.fileUrl || doc.fileUrl) && DOCUMENT_TYPE_MAP[docType];
      })
      .map((doc: any) => ({
        type: doc.type || doc.documentType,
        fileName: doc.fileName || `document-${Date.now()}`,
        fileUrl: doc.fileUrl,
        mimeType: doc.mimeType,
        documentNumber: doc.documentNumber,
        issueDate: doc.issueDate,
        expiryDate: doc.expiryDate,
      }));

    console.log('[Submit KYC] Prepared documents:', kycDocuments.length);

    // 5. Submit KYC based on document availability
    let result: SubmitKYCResponse;

    if (kycDocuments.length > 0) {
      // Use complete submission flow
      console.log('[Submit KYC] Using document-based submission');

      const kycResult = await submitKYC({
        firstName: isOnboardingSession
          ? primaryOwner.firstName
          : primaryOwner.first_name,
        lastName: isOnboardingSession
          ? primaryOwner.lastName
          : primaryOwner.last_name,
        email: primaryOwner.email,
        phone: primaryOwner.phone,
        dateOfBirth: isOnboardingSession
          ? primaryOwner.dateOfBirth
          : primaryOwner.date_of_birth,
        residenceCountry: isOnboardingSession
          ? (primaryOwner.residentialCountry || clientData.country)
          : (primaryOwner.residential_country || clientData.country),
        nationality: primaryOwner.citizenship,
        documents: kycDocuments,
        verificationTypes: ['DOCUMENT', 'AML'],
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/amlbot`,
      });

      result = {
        success: kycResult.success,
        applicantId: kycResult.applicantId,
        verificationId: kycResult.verificationId,
        documentIds: kycResult.documentIds,
        error: kycResult.error,
      };
    } else {
      // Use form-based submission
      console.log('[Submit KYC] No documents, using form-based submission');

      const formId = process.env.AMLBOT_FORM_ID || '7b6ea16b17e0a14f791aa1f9fe5d2812dcf1';
      const formResult = await getKYCFormUrl(
        formId,
        isOnboardingSession ? primaryOwner.firstName : primaryOwner.first_name,
        isOnboardingSession ? primaryOwner.lastName : primaryOwner.last_name,
        primaryOwner.email,
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/kyc/complete`
      );

      result = {
        success: formResult.success,
        applicantId: formResult.applicantId,
        verificationId: formResult.verificationId,
        formUrl: formResult.formUrl,
        documentIds: [],
        error: formResult.error,
      };
    }

    // 6. Update KYC record if successful
    if (result.success && result.verificationId) {
      if (!isOnboardingSession) {
        // Get or create KYC record
        const { data: existingKyc } = await supabase
          .from('kyc_records')
          .select('id')
          .eq('userId', clientId)
          .single();

        if (existingKyc) {
          await supabase
            .from('kyc_records')
            .update({
              amlbotRequestId: result.verificationId,
              status: 'under_review',
              updatedAt: new Date().toISOString(),
              notes: result.formUrl
                ? [`KYC form URL: ${result.formUrl}`]
                : ['KYC submitted via API'],
            })
            .eq('id', existingKyc.id);
        } else {
          await supabase.from('kyc_records').insert({
            userId: clientId,
            status: 'under_review',
            amlbotRequestId: result.verificationId,
            notes: result.formUrl
              ? [`KYC form URL: ${result.formUrl}`]
              : ['KYC submitted via API'],
          });
        }
      }

      // Audit log
      await supabase.from('audit_log').insert({
        adminId: auth.admin.id,
        action: 'kyc_submission',
        entityType: 'client',
        entityId: clientId,
        newValues: {
          applicantId: result.applicantId,
          verificationId: result.verificationId,
          documentCount: result.documentIds?.length || 0,
          hasFormUrl: !!result.formUrl,
        },
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Submit KYC error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to submit KYC'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/client/[id]/submit-kyc
 *
 * Check KYC submission status for a client
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await validateAdminRequest(request);
    if (!auth.isValid) {
      return auth.errorResponse!;
    }

    const { id: clientId } = await params;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check KYC record
    const { data: kycRecord, error } = await supabase
      .from('kyc_records')
      .select('*')
      .eq('userId', clientId)
      .single();

    if (error || !kycRecord) {
      return NextResponse.json({
        hasKycRecord: false,
        status: 'not_started',
        message: 'No KYC record found for this client',
      });
    }

    return NextResponse.json({
      hasKycRecord: true,
      status: kycRecord.status,
      amlbotRequestId: kycRecord.amlbotRequestId,
      riskScore: kycRecord.riskScore,
      notes: kycRecord.notes,
      createdAt: kycRecord.createdAt,
      updatedAt: kycRecord.updatedAt,
    });

  } catch (error: any) {
    console.error('Get KYC status error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get KYC status' },
      { status: 500 }
    );
  }
}
