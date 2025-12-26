import {
  createApplicant,
  createVerification,
  type CreateApplicantRequest,
} from '@/lib/integrations/amlbot';
import { createClient } from '@/lib/supabase/server';
import {
  CreateClientInput,
  createClientSchema,
  validateEntityType,
  validateRequiredDocuments,
} from '@/lib/validations/client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Validate input data
    const validationResult = createClientSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const data: CreateClientInput = validationResult.data;

    // Validate entity type based on country
    if (!validateEntityType(data.country, data.entityType)) {
      return NextResponse.json(
        { error: 'Invalid entity type for selected country' },
        { status: 400 }
      );
    }

    // Validate required documents
    if (!validateRequiredDocuments(data.accountType, data.documents)) {
      return NextResponse.json(
        { error: 'Missing required documents for account type' },
        { status: 400 }
      );
    }

    // Check if creator is authenticated
    let creatorId: string | null = null;
    let creatorType: 'user' | 'admin' = data.createdBy;

    if (data.createdBy === 'user') {
      // For user-created clients, get the authenticated user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json(
          { error: 'Authentication required for user-created clients' },
          { status: 401 }
        );
      }
      creatorId = user.id;
    } else if (data.createdBy === 'admin') {
      // For admin-created clients, validate admin session
      if (!data.adminId) {
        return NextResponse.json(
          { error: 'Admin ID required for admin-created clients' },
          { status: 400 }
        );
      }

      // Validate admin session token from cookies
      const sessionToken = request.cookies.get('admin_session_token')?.value;
      if (!sessionToken) {
        return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
      }

      // Verify admin session
      const { data: sessionData, error: sessionError } = await supabase.rpc(
        'validate_admin_session',
        { p_session_token: sessionToken }
      );

      if (sessionError || !sessionData?.valid || sessionData.admin?.id !== data.adminId) {
        return NextResponse.json({ error: 'Invalid admin session' }, { status: 401 });
      }

      creatorId = data.adminId;
    }

    // Start transaction - create client and all related data
    const { data: clientData, error: clientError } = await supabase.rpc(
      'create_client_with_onboarding',
      {
        p_created_by: creatorType,
        p_creator_id: creatorId,
        p_account_type: data.accountType,
        p_country: data.country,
        p_entity_type: data.entityType,
        p_business_name: data.businessName,
        p_tax_id: data.taxId,
        p_state: data.state,
        p_business_address: data.address,
        p_website: data.website || null,
        p_phone: data.phone,
        p_phone_country_code: data.phoneCountryCode,
        p_industry: data.industry,
        p_business_description: data.businessDescription,
        p_expected_monthly_volume: data.expectedMonthlyVolume,
        p_primary_use_case: data.primaryUseCase,
        p_business_operations: data.businessOperations,
        p_owners: data.owners,
        p_pep_screening: data.pepScreening,
        p_documents: data.documents,
        p_metadata: data.metadata || {},
      }
    );

    if (clientError) {
      console.error('Client creation error:', clientError);
      return NextResponse.json(
        { error: 'Failed to create client', details: clientError.message },
        { status: 500 }
      );
    }

    const clientId = clientData.client_id;

    // Submit to AMLBot for verification
    try {
      // Get primary owner info
      const primaryOwner = data.owners.find(owner => owner.type === 'person');
      if (!primaryOwner || primaryOwner.type !== 'person') {
        throw new Error('Primary person owner required for AMLBot verification');
      }

      // Create AMLBot applicant
      const applicantData: CreateApplicantRequest = {
        type: 'PERSON',
        external_id: clientId,
        first_name: primaryOwner.firstName,
        last_name: primaryOwner.lastName,
        email: primaryOwner.email,
        phone: primaryOwner.phone,
        residence_country: primaryOwner.residentialCountry || data.country,
        dob: primaryOwner.dateOfBirth,
      };

      const applicant = await createApplicant(applicantData);

      // Create verification with documents
      const verification = await createVerification({
        applicant_id: applicant.id,
        types: ['identity', 'address', 'pep_sanctions'], // Standard KYC verification types
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/amlbot`,
      });

      // Update KYC record with AMLBot IDs
      await supabase
        .from('kyc_records')
        .update({
          amlbotRequestId: applicant.id,
          updatedAt: new Date().toISOString(),
        })
        .eq('userId', clientId);

      // Log client creation in audit log
      await supabase.from('audit_log').insert({
        adminId: creatorType === 'admin' ? creatorId : null,
        action: 'client_created',
        entityType: 'client',
        entityId: clientId,
        newValues: {
          accountType: data.accountType,
          businessName: data.businessName,
          country: data.country,
          createdBy: creatorType,
          amlbotApplicantId: applicant.id,
          amlbotVerificationId: verification.id,
        },
        ipAddress:
          data.metadata?.ipAddress ||
          request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip'),
        userAgent: data.metadata?.userAgent || request.headers.get('user-agent'),
        createdAt: new Date().toISOString(),
      });
    } catch (amlbotError) {
      console.error('AMLBot submission error:', amlbotError);
      // Don't fail the entire request if AMLBot fails - just log it
      // The client is still created successfully
    }

    // Create client management action record
    if (creatorType === 'admin' && creatorId) {
      await supabase.from('client_management_actions').insert({
        adminId: creatorId,
        clientId: clientId,
        action: 'created',
        notes: `Client created via API by admin ${creatorId}`,
        metadata: {
          accountType: data.accountType,
          source: data.metadata?.source || 'api',
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      });
    }

    return NextResponse.json({
      success: true,
      clientId,
      message: 'Client created successfully',
      onboardingStatus: {
        currentStep: 1,
        completedSteps: [],
        isActive: true,
      },
      nextSteps: [
        'Complete business verification',
        'Upload additional documents if required',
        'AMLBot verification in progress',
      ],
    });
  } catch (error) {
    console.error('Client creation API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve client creation schema (for frontend validation)
export async function GET() {
  return NextResponse.json({
    schema: {
      accountTypes: ['personal', 'business', 'fintech'],
      supportedCountries: ['US', 'CA', 'GB', 'DE', 'ES', 'HK', 'SG', 'AE', 'BR', 'MX', 'CO', 'IN'],
      documentTypes: {
        personal: [
          'passport',
          'driversLicenseFront',
          'driversLicenseBack',
          'idCard',
          'idCardBack',
          'proofOfAddress',
          'selfie',
        ],
        business: [
          'formationDocument',
          'proofOfRegistration',
          'proofOfOwnership',
          'bankStatement',
          'taxId',
          'wolfsbergQuestionnaire',
          'agreement',
          'registration',
        ],
        fintech: [
          'formationDocument',
          'proofOfRegistration',
          'proofOfOwnership',
          'bankStatement',
          'taxId',
          'wolfsbergQuestionnaire',
          'agreement',
          'registration',
          'msbCert',
          'mtlLicense',
          'amlPolicy',
          'amlAudit',
          'soc2Report',
          'transactionFlowDiagram',
        ],
      },
      requiredFields: {
        personal: [
          'firstName',
          'lastName',
          'email',
          'phone',
          'address',
          'idDocument',
          'proofOfAddress',
          'selfie',
        ],
        business: [
          'businessName',
          'country',
          'entityType',
          'taxId',
          'address',
          'owners',
          'documents',
        ],
        fintech: [
          'businessName',
          'country',
          'entityType',
          'taxId',
          'address',
          'owners',
          'documents',
          'complianceDocs',
        ],
      },
    },
  });
}
