import { getForms, getFormUrl } from '@/lib/integrations/amlbot';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/kyc/amlbot-forms
 *
 * Get list of available AMLBot forms
 * Use this to find the form_id needed for KYC verification
 */
export async function GET() {
  try {
    console.log('[AMLBot Forms] Fetching available forms...');

    const forms = await getForms();

    return NextResponse.json({
      success: true,
      forms,
      count: forms.length,
      hint: 'Use one of these form IDs to generate a KYC form URL for users',
    });
  } catch (error: any) {
    console.error('[AMLBot Forms] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch forms',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/kyc/amlbot-forms
 *
 * Generate a form URL for a user to complete KYC
 *
 * Request body:
 * {
 *   "formId": "form-id-from-get-request",
 *   "userId": "user-uuid",
 *   "redirectUrl": "https://your-app.com/kyc/complete" (optional)
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "formUrl": "https://kyc.amlbot.com/...",
 *   "verificationId": "...",
 *   "expiresAt": "..."
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { formId, userId, redirectUrl } = await request.json();

    if (!formId || !userId) {
      return NextResponse.json(
        {
          error: 'formId and userId are required',
        },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        {
          error: 'Server configuration error',
        },
        { status: 500 }
      );
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('client_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        {
          error: 'User profile not found',
        },
        { status: 404 }
      );
    }

    // Parse name
    const fullName =
      profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || 'User';
    const lastName = nameParts.slice(1).join(' ') || '';

    console.log('[AMLBot Forms] Generating form URL for user:', userId);

    // Get form URL from AMLBot
    const formUrlResult = await getFormUrl(formId, {
      external_applicant_id: userId,
      first_name: firstName,
      last_name: lastName || undefined,
      email: profile.email,
      phone: profile.mobile || undefined,
      redirect_url: redirectUrl,
    });

    // Update or create KYC record
    const { data: existingKyc } = await supabaseAdmin
      .from('kyc_records')
      .select('id')
      .eq('userId', userId)
      .single();

    if (existingKyc) {
      await supabaseAdmin
        .from('kyc_records')
        .update({
          amlbotRequestId: formUrlResult.verification_id,
          status: 'pending',
          updatedAt: new Date().toISOString(),
        })
        .eq('id', existingKyc.id);
    } else {
      await supabaseAdmin.from('kyc_records').insert({
        userId: userId,
        status: 'pending',
        amlbotRequestId: formUrlResult.verification_id,
        notes: ['KYC form URL generated'],
      });
    }

    return NextResponse.json({
      success: true,
      formUrl: formUrlResult.form_url,
      verificationId: formUrlResult.verification_id,
      applicantId: formUrlResult.applicant_id,
      expiresAt: formUrlResult.expires_at,
      message: 'Send this form URL to the user to complete KYC',
    });
  } catch (error: any) {
    console.error('[AMLBot Forms] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate form URL',
      },
      { status: 500 }
    );
  }
}
