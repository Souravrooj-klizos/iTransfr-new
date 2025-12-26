import {
  createVerification,
  getApplicant,
  getVerification,
  type AMLBotApplicant,
  type AMLBotVerification,
} from '@/lib/integrations/amlbot';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/kyc/[id]/amlbot
 *
 * Get AMLBot verification status for a KYC record
 *
 * Response:
 * {
 *   "kycRecord": { ... },
 *   "amlbot": {
 *     "applicant": { ... },
 *     "verification": { ... }
 *   }
 * }
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    console.log('[Admin AMLBot] Fetching status for KYC record:', id);

    // Fetch KYC record
    const { data: kycRecord, error: kycError } = await supabaseAdmin
      .from('kyc_records')
      .select('*')
      .eq('id', id)
      .single();

    if (kycError || !kycRecord) {
      return NextResponse.json({ error: 'KYC record not found' }, { status: 404 });
    }

    let amlbotData: {
      applicant: AMLBotApplicant | null;
      verification: AMLBotVerification | null;
    } = {
      applicant: null,
      verification: null,
    };

    // Only fetch AMLBot data if we have a request ID
    if (kycRecord.amlbotRequestId && process.env.AML_BOT_API_KEY) {
      try {
        // Fetch verification from AMLBot
        const verification = await getVerification(kycRecord.amlbotRequestId);
        amlbotData.verification = verification;

        // Fetch applicant details
        if (verification.applicant_id) {
          const applicant = await getApplicant(verification.applicant_id);
          amlbotData.applicant = applicant;
        }
      } catch (amlbotError: any) {
        console.error('[Admin AMLBot] Error fetching from AMLBot:', amlbotError.message);
        // Continue with null amlbot data
      }
    }

    return NextResponse.json({
      kycRecord,
      amlbot: amlbotData,
      hasAmlbotIntegration: !!process.env.AML_BOT_API_KEY,
    });
  } catch (error: any) {
    console.error('[Admin AMLBot GET] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch AMLBot status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/kyc/[id]/amlbot
 *
 * Admin action to trigger AMLBot verification or re-verification
 *
 * Request body:
 * {
 *   "action": "verify" | "reverify"
 * }
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { action } = await request.json();

    if (!['verify', 'reverify'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use "verify" or "reverify"' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (!process.env.AML_BOT_API_KEY) {
      return NextResponse.json({ error: 'AMLBot API key not configured' }, { status: 500 });
    }

    console.log(`[Admin AMLBot] Action: ${action} for KYC record:`, id);

    // Fetch KYC record with user details
    const { data: kycRecord, error: kycError } = await supabaseAdmin
      .from('kyc_records')
      .select(
        `
        *,
        client_profiles:userId (
          id,
          full_name,
          first_name,
          last_name,
          email,
          mobile,
          country
        )
      `
      )
      .eq('id', id)
      .single();

    if (kycError || !kycRecord) {
      return NextResponse.json({ error: 'KYC record not found' }, { status: 404 });
    }

    const profile = kycRecord.client_profiles;
    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // For reverification, we need an existing applicant
    if (action === 'reverify' && !kycRecord.amlbotRequestId) {
      return NextResponse.json(
        { error: 'No previous AMLBot submission found. Use "verify" instead.' },
        { status: 400 }
      );
    }

    // Get the applicant ID from the previous verification
    let applicantId: string;

    if (kycRecord.amlbotRequestId) {
      try {
        const prevVerification = await getVerification(kycRecord.amlbotRequestId);
        applicantId = prevVerification.applicant_id;
      } catch {
        return NextResponse.json(
          { error: 'Previous verification not found in AMLBot' },
          { status: 404 }
        );
      }
    } else {
      // Need to create new applicant - redirect to submit-amlbot endpoint
      return NextResponse.json(
        {
          error: 'No AMLBot applicant exists. Use /api/kyc/submit-amlbot instead.',
          redirect: '/api/kyc/submit-amlbot',
        },
        { status: 400 }
      );
    }

    // Create new verification
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verification = await createVerification({
      applicant_id: applicantId,
      types: ['document-verification', 'aml-screening'],
      callback_url: `${baseUrl}/api/webhooks/amlbot`,
    });

    // Update KYC record
    await supabaseAdmin
      .from('kyc_records')
      .update({
        amlbotRequestId: verification.id,
        status: 'under_review',
        notes: [
          ...(kycRecord.notes || []),
          `Admin triggered ${action} - New verification: ${verification.id}`,
        ],
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id);

    console.log(`[Admin AMLBot] ✅ ${action} triggered, verification:`, verification.id);

    return NextResponse.json({
      success: true,
      action,
      verificationId: verification.id,
      message: `AMLBot ${action} triggered successfully`,
    });
  } catch (error: any) {
    console.error('[Admin AMLBot POST] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to trigger AMLBot action' },
      { status: 500 }
    );
  }
}
