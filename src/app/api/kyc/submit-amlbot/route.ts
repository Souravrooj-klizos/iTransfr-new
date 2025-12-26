import {
  createApplicant,
  createVerification,
  getApplicantByExternalId,
  type CreateApplicantRequest,
} from '@/lib/integrations/amlbot';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/kyc/submit-amlbot
 *
 * Submit a user's KYC to AMLBot for verification
 *
 * Request body:
 * {
 *   "userId": "user-uuid-here"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "applicantId": "amlbot-applicant-id",
 *   "verificationId": "amlbot-verification-id",
 *   "message": "KYC submitted to AMLBot successfully"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Check if AMLBot API key is configured
    if (!process.env.AML_BOT_API_KEY) {
      return NextResponse.json({ error: 'AMLBot API key not configured' }, { status: 500 });
    }

    console.log('[Submit AMLBot] Processing for userId:', userId);

    // 1. Fetch user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('client_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('[Submit AMLBot] Profile not found:', profileError);
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // 2. Check if KYC record exists
    const { data: kycRecord, error: kycError } = await supabaseAdmin
      .from('kyc_records')
      .select('*')
      .eq('userId', userId)
      .single();

    if (kycError && kycError.code !== 'PGRST116') {
      console.error('[Submit AMLBot] KYC record fetch error:', kycError);
      return NextResponse.json({ error: 'Failed to fetch KYC record' }, { status: 500 });
    }

    // 3. Prepare applicant data
    const fullName =
      profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || 'Unknown';
    const lastName = nameParts.slice(1).join(' ') || 'Unknown';

    const applicantData: CreateApplicantRequest = {
      type: 'PERSON',
      external_id: userId,
      first_name: firstName,
      last_name: lastName,
      email: profile.email,
      phone: profile.mobile,
      residence_country: profile.country || 'US',
    };

    console.log('[Submit AMLBot] Applicant data prepared:', {
      external_id: applicantData.external_id,
      first_name: applicantData.first_name,
      last_name: applicantData.last_name,
    });

    // 4. Check if applicant already exists in AMLBot
    let applicant = await getApplicantByExternalId(userId);

    if (!applicant) {
      // Create new applicant
      console.log('[Submit AMLBot] Creating new applicant in AMLBot');
      applicant = await createApplicant(applicantData);
    } else {
      console.log('[Submit AMLBot] Using existing AMLBot applicant:', applicant.id);
    }

    // 5. Create verification request
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const callbackUrl = `${baseUrl}/api/webhooks/amlbot`;

    console.log('[Submit AMLBot] Creating verification with callback:', callbackUrl);

    const verification = await createVerification({
      applicant_id: applicant.id,
      types: ['document-verification', 'aml-screening'],
      callback_url: callbackUrl,
    });

    // 6. Update KYC record with AMLBot request ID
    if (kycRecord) {
      await supabaseAdmin
        .from('kyc_records')
        .update({
          amlbotRequestId: verification.id,
          status: 'under_review',
          updatedAt: new Date().toISOString(),
        })
        .eq('id', kycRecord.id);
    } else {
      // Create KYC record if it doesn't exist
      await supabaseAdmin.from('kyc_records').insert({
        userId: userId,
        status: 'under_review',
        amlbotRequestId: verification.id,
        notes: ['Submitted to AMLBot for verification'],
      });
    }

    console.log('[Submit AMLBot] ✅ Verification created:', verification.id);

    return NextResponse.json({
      success: true,
      applicantId: applicant.id,
      verificationId: verification.id,
      message: 'KYC submitted to AMLBot successfully',
    });
  } catch (error: any) {
    console.error('[Submit AMLBot] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit KYC to AMLBot' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/kyc/submit-amlbot
 *
 * Get AMLBot submission status for a user
 * Query params: ?userId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId query parameter is required' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { data: kycRecord, error } = await supabaseAdmin
      .from('kyc_records')
      .select('*')
      .eq('userId', userId)
      .single();

    if (error || !kycRecord) {
      return NextResponse.json({
        submitted: false,
        message: 'No KYC record found',
      });
    }

    return NextResponse.json({
      submitted: !!kycRecord.amlbotRequestId,
      amlbotRequestId: kycRecord.amlbotRequestId,
      status: kycRecord.status,
      riskScore: kycRecord.riskScore,
    });
  } catch (error: any) {
    console.error('[Submit AMLBot GET] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get AMLBot status' },
      { status: 500 }
    );
  }
}
