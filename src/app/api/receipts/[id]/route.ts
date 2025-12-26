/**
 * API Route: Generate Receipt (HTML-based)
 *
 * GET /api/receipts/[id]
 *
 * Returns an HTML receipt that can be printed to PDF by the browser.
 */

import {
  DepositReceiptData,
  generateDepositReceiptHTML,
  generatePayoutReceiptHTML,
  PayoutReceiptData,
} from '@/lib/pdf/receipts';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: transactionId } = await params;

    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Fetch transaction details
    const { data: transaction, error: txError } = await supabaseAdmin
      .from('transactions')
      .select('*, client_profiles!userId(first_name, last_name)')
      .eq('id', transactionId)
      .single();

    if (txError || !transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const profile = transaction.client_profiles as any;
    const clientName = profile
      ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
      : 'Unknown';

    // Format date
    const date = new Date(transaction.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Map status
    const status = mapStatus(transaction.status);

    let html: string;

    if (transaction.type === 'deposit') {
      // Generate Deposit Receipt
      const depositData: DepositReceiptData = {
        referenceNumber: transaction.referenceNumber || transactionId,
        date,
        status,
        amount: transaction.amount,
        currency: transaction.currency,
        chain: transaction.metadata?.chain,
        walletAddress: transaction.metadata?.depositAddress,
        clientName,
        transactionHash: transaction.metadata?.txHash,
      };

      html = generateDepositReceiptHTML(depositData);
    } else if (transaction.type === 'payout') {
      // Get payout request details
      const { data: payoutRequest } = await supabaseAdmin
        .from('payout_requests')
        .select('*')
        .eq('transactionId', transactionId)
        .single();

      const payoutData: PayoutReceiptData = {
        referenceNumber: transaction.referenceNumber || transactionId,
        date,
        status,
        amount: transaction.amount,
        currency: transaction.currency,
        recipientName:
          payoutRequest?.recipientName || payoutRequest?.destinationBank?.beneficiaryName || 'N/A',
        recipientBank:
          payoutRequest?.recipientBank || payoutRequest?.destinationBank?.bankName || 'N/A',
        recipientAccount:
          payoutRequest?.recipientAccount || payoutRequest?.destinationBank?.accountNumber || 'N/A',
        recipientCountry: payoutRequest?.recipientCountry || payoutRequest?.destinationCountry,
        clientName,
        exchangeRate: transaction.exchangeRate
          ? `1 ${transaction.currencyFrom} = ${transaction.exchangeRate} ${transaction.currencyTo}`
          : undefined,
        fees: transaction.metadata?.fees,
      };

      html = generatePayoutReceiptHTML(payoutData);
    } else {
      return NextResponse.json(
        { error: 'Receipt not available for this transaction type' },
        { status: 400 }
      );
    }

    // Return HTML (user can print to PDF from browser)
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error: any) {
    console.error('[Receipt API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate receipt' },
      { status: 500 }
    );
  }
}

function mapStatus(status: string): 'Completed' | 'Pending' | 'Processing' {
  const upper = status?.toUpperCase();
  if (upper?.includes('COMPLETED') || upper?.includes('RECEIVED')) {
    return 'Completed';
  }
  if (upper?.includes('PENDING') || upper?.includes('REQUESTED')) {
    return 'Pending';
  }
  return 'Processing';
}
