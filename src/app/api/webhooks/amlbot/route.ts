import {
  mapVerificationResultToKycStatus,
  verifyWebhookSignature,
  type AMLBotWebhookPayload,
} from '@/lib/integrations/amlbot';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/webhooks/amlbot
 *
 * Webhook endpoint to receive AMLBot verification callbacks
 *
 * AMLBot will send POST requests to this endpoint when:
 * - verification.completed - Verification finished
 * - verification.failed - Verification failed
 * - verification.updated - Verification status updated
 *
 * Request body (from AMLBot):
 * {
 *   "event": "verification.completed",
 *   "data": {
 *     "verification_id": "xxx",
 *     "applicant_id": "xxx",
 *     "status": "completed",
 *     "result": "approved" | "declined" | "review_needed",
 *     "risk_score": 0-100
 *   },
 *   "timestamp": "2024-01-15T10:00:00Z"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();

    // Verify webhook signature if secret is configured
    const signature = request.headers.get('x-amlbot-signature') || '';
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error('[AMLBot Webhook] ❌ Invalid signature');
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    // Parse the payload
    const payload: AMLBotWebhookPayload = JSON.parse(rawBody);

    console.log('[AMLBot Webhook] Received event:', payload.event);
    console.log('[AMLBot Webhook] Verification ID:', payload.data.verification_id);
    console.log('[AMLBot Webhook] Status:', payload.data.status);
    console.log('[AMLBot Webhook] Result:', payload.data.result);

    if (!supabaseAdmin) {
      console.error('[AMLBot Webhook] Server configuration error');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Find KYC record by AMLBot verification ID
    const { data: kycRecord, error: findError } = await supabaseAdmin
      .from('kyc_records')
      .select('*')
      .eq('amlbotRequestId', payload.data.verification_id)
      .single();

    if (findError || !kycRecord) {
      console.error(
        '[AMLBot Webhook] KYC record not found for verification:',
        payload.data.verification_id
      );
      // Return 200 to acknowledge receipt even if we can't find the record
      // This prevents AMLBot from retrying
      return NextResponse.json({
        received: true,
        processed: false,
        message: 'KYC record not found',
      });
    }

    console.log('[AMLBot Webhook] Found KYC record:', kycRecord.id);

    // Handle different events
    switch (payload.event) {
      case 'verification.completed':
      case 'verification.updated': {
        // Map AMLBot result to our KYC status
        const newStatus = mapVerificationResultToKycStatus(payload.data.result);

        // Update KYC record
        const { error: updateError } = await supabaseAdmin
          .from('kyc_records')
          .update({
            status: newStatus,
            riskScore: payload.data.risk_score,
            notes: [
              ...(kycRecord.notes || []),
              `AMLBot ${payload.event}: ${payload.data.result || payload.data.status} (Risk: ${payload.data.risk_score || 'N/A'})`,
            ],
            updatedAt: new Date().toISOString(),
          })
          .eq('id', kycRecord.id);

        if (updateError) {
          console.error('[AMLBot Webhook] Failed to update KYC record:', updateError);
          throw updateError;
        }

        // If approved, also update client profile status
        if (newStatus === 'approved') {
          await supabaseAdmin
            .from('client_profiles')
            .update({ status: 'active' })
            .eq('id', kycRecord.userId);

          console.log('[AMLBot Webhook] ✅ Client profile activated');
        }

        console.log(`[AMLBot Webhook] ✅ KYC status updated to: ${newStatus}`);
        break;
      }

      case 'verification.failed': {
        // Mark as rejected on failure
        await supabaseAdmin
          .from('kyc_records')
          .update({
            status: 'rejected',
            notes: [
              ...(kycRecord.notes || []),
              `AMLBot verification failed: ${payload.data.status}`,
            ],
            updatedAt: new Date().toISOString(),
          })
          .eq('id', kycRecord.id);

        console.log('[AMLBot Webhook] ❌ KYC marked as rejected due to verification failure');
        break;
      }

      default:
        console.log('[AMLBot Webhook] Unknown event type:', payload.event);
    }

    return NextResponse.json({
      received: true,
      processed: true,
      verification_id: payload.data.verification_id,
    });
  } catch (error: any) {
    console.error('[AMLBot Webhook] Error processing webhook:', error);

    // Return 200 to acknowledge receipt
    // AMLBot might retry on 5xx errors
    return NextResponse.json({
      received: true,
      processed: false,
      error: error.message,
    });
  }
}

/**
 * GET /api/webhooks/amlbot
 *
 * Health check endpoint for webhook
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'AMLBot webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}
