/**
 * GET /api/transactions/list
 *
 * Get paginated transactions for the authenticated user.
 */

import { supabaseAdmin } from '@/lib/supabaseClient';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();

    // Get authenticated user from session
    const {
      data: { user },
    } = await createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      }
    ).auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - No session found' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    const offset = (page - 1) * limit;

    // Build query - ALWAYS filter by authenticated user's ID for security
    let query = supabaseAdmin
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('userId', user.id); // Always filter by authenticated user

    // Filter by type
    if (type && type !== 'all') {
      query = query.eq('type', type);
    }

    // Filter by status
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Order by created date descending
    query = query.order('"createdAt"', { ascending: false }).range(offset, offset + limit - 1);

    const { data: transactions, count, error } = await query;

    if (error) {
      console.error('[Transactions API] Error:', error);
      return NextResponse.json({
        success: true,
        data: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      });
    }

    // Format transactions for frontend
    const formattedTransactions = (transactions || []).map(tx => {
      // Get recipient from multiple sources (priority order)
      const recipientName =
        tx.recipientName ||  // Direct field on transaction
        tx.metadata?.recipientName ||  // From transaction metadata
        (tx.type === 'deposit' ? 'Self (Deposit)' : 'N/A');

      return {
        id: tx.id,
        date: formatDate(tx.createdAt),
        time: formatTime(tx.createdAt),
        recipient: recipientName,
        transactionType: mapTransactionType(tx.type),
        paymentMethod: mapPaymentMethod(tx.type, tx.metadata),
        status: mapStatus(tx.status),
        amount: formatAmount(tx.amount, tx.currency),
        fromAmount: tx.amountFrom ? `From: ${formatAmount(tx.amountFrom, tx.currency)}` : undefined,
        currency: tx.currency,
        currencyTo: tx.currencyTo,
        type: tx.type,
        rawStatus: tx.status,
        referenceNumber: tx.referenceNumber,
        createdAt: tx.createdAt,
      };
    });

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: formattedTransactions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error: any) {
    console.error('[Transactions API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

function formatAmount(amount: number, currency: string): string {
  if (!amount) return '0';

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return `${formatted} ${currency || ''}`.trim();
}

function mapTransactionType(type: string): 'Deposit' | 'Withdrawal' | 'Bank Payment' {
  switch (type?.toLowerCase()) {
    case 'deposit':
      return 'Deposit';
    case 'withdrawal':
    case 'swap':
      return 'Withdrawal';
    case 'payout':
      return 'Bank Payment';
    default:
      return 'Deposit';
  }
}

function mapPaymentMethod(type: string, metadata?: any): 'Crypto' | 'Fedwire' | 'SWIFT' {
  if (type === 'deposit' && metadata?.source === 'crypto') {
    return 'Crypto';
  }
  if (metadata?.paymentMethod === 'swift') {
    return 'SWIFT';
  }
  return 'Fedwire';
}

function mapStatus(status: string): 'Completed' | 'Processing' | 'Failed' | 'Pending' {
  switch (status?.toUpperCase()) {
    case 'COMPLETED':
    case 'PAYOUT_COMPLETED':
    case 'SWAP_COMPLETED':
    case 'DEPOSIT_RECEIVED':
      return 'Completed';
    case 'FAILED':
    case 'CANCELLED':
      return 'Failed';
    case 'PENDING':
    case 'DEPOSIT_REQUESTED':
      return 'Pending';
    default:
      return 'Processing';
  }
}
