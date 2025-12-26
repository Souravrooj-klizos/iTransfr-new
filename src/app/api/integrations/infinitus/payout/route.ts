import {
  cancelPayout,
  createPayout,
  getPayoutStatus,
  InfinitusPayoutRequest,
  listPayouts,
  validateRecipient,
} from '@/lib/integrations/infinitus';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/integrations/infinitus/payout
 *
 * Create a new payout to a recipient's bank account
 *
 * Body:
 * {
 *   "amount": 17900,
 *   "currency": "MXN",
 *   "recipient": {
 *     "name": "Priya Sharma",
 *     "email": "priya@example.com",
 *     "bankName": "BBVA Mexico",
 *     "bankCode": "012",
 *     "accountNumber": "012180001234567890",
 *     "country": "MX",
 *     "currency": "MXN"
 *   },
 *   "transactionId": "optional-uuid",
 *   "reference": "PAY-123456"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency, recipient, transactionId, reference } = body;

    // Validation
    if (!amount || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Valid amount is required',
        },
        { status: 400 }
      );
    }

    if (!recipient) {
      return NextResponse.json(
        {
          success: false,
          error: 'Recipient details are required',
        },
        { status: 400 }
      );
    }

    // Validate recipient
    const validation = validateRecipient(recipient);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid recipient data',
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    console.log('[Infinitus Payout] Creating payout:', {
      amount,
      currency,
      recipientName: recipient.name,
      country: recipient.country,
    });

    // Create payout with Infinitus
    const payoutRequest: InfinitusPayoutRequest = {
      amount,
      currency: currency || recipient.currency,
      recipient,
      reference: reference || `PAY-${Date.now()}`,
      description: `Payout to ${recipient.name}`,
      metadata: transactionId ? { transactionId } : undefined,
    };

    const payout = await createPayout(payoutRequest);

    // Save to our database if transactionId provided
    if (transactionId && supabaseAdmin) {
      try {
        // Update payout_requests table
        const { error: dbError } = await supabaseAdmin.from('payout_requests').insert({
          transactionId: transactionId,
          recipientName: recipient.name,
          recipientAccount: recipient.accountNumber,
          recipientBank: recipient.bankName,
          recipientBankCode: recipient.bankCode,
          recipientCountry: recipient.country,
          amount: amount,
          currency: currency || recipient.currency,
          infinitusRequestId: payout.id,
          infinitusTrackingNumber: payout.trackingNumber,
          status: payout.status.toLowerCase(),
          createdAt: new Date().toISOString(),
        });

        if (dbError) {
          console.error('[Infinitus Payout] Database error:', dbError);
        }

        // Update transaction status
        await supabaseAdmin
          .from('transactions')
          .update({
            status: 'PAYOUT_IN_PROGRESS',
            metadata: {
              infinitusPayoutId: payout.id,
              payoutInitiatedAt: new Date().toISOString(),
            },
          })
          .eq('id', transactionId);
      } catch (dbError) {
        console.error('[Infinitus Payout] Database error:', dbError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payout created successfully',
      payout: {
        id: payout.id,
        status: payout.status,
        amount: payout.amount,
        currency: payout.currency,
        recipientName: payout.recipient.name,
        recipientCountry: payout.recipient.country,
        trackingNumber: payout.trackingNumber,
        createdAt: payout.createdAt,
      },
      ...(transactionId && { transactionId }),
    });
  } catch (error: any) {
    console.error('[Infinitus Payout] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create payout',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/integrations/infinitus/payout?id=payoutId
 * GET /api/integrations/infinitus/payout (list all)
 *
 * Get payout status or list payouts
 */
export async function GET(request: NextRequest) {
  try {
    const payoutId = request.nextUrl.searchParams.get('id');
    const status = request.nextUrl.searchParams.get('status');
    const limit = request.nextUrl.searchParams.get('limit');

    if (payoutId) {
      // Get specific payout
      const payout = await getPayoutStatus(payoutId);

      return NextResponse.json({
        success: true,
        payout: {
          id: payout.id,
          status: payout.status,
          amount: payout.amount,
          currency: payout.currency,
          recipientName: payout.recipient.name,
          recipientCountry: payout.recipient.country,
          trackingNumber: payout.trackingNumber,
          createdAt: payout.createdAt,
          completedAt: payout.completedAt,
          errorMessage: payout.errorMessage,
        },
      });
    } else {
      // List payouts
      const payouts = await listPayouts({
        status: status || undefined,
        limit: limit ? parseInt(limit) : 20,
      });

      return NextResponse.json({
        success: true,
        payouts: payouts.map(p => ({
          id: p.id,
          status: p.status,
          amount: p.amount,
          currency: p.currency,
          recipientName: p.recipient.name,
          createdAt: p.createdAt,
        })),
        count: payouts.length,
      });
    }
  } catch (error: any) {
    console.error('[Infinitus Payout] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get payout',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/integrations/infinitus/payout?id=payoutId
 *
 * Cancel a pending payout
 */
export async function DELETE(request: NextRequest) {
  try {
    const payoutId = request.nextUrl.searchParams.get('id');

    if (!payoutId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payout ID is required',
        },
        { status: 400 }
      );
    }

    const payout = await cancelPayout(payoutId);

    return NextResponse.json({
      success: true,
      message: 'Payout cancelled',
      payout: {
        id: payout.id,
        status: payout.status,
      },
    });
  } catch (error: any) {
    console.error('[Infinitus Payout Cancel] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to cancel payout',
      },
      { status: 500 }
    );
  }
}
