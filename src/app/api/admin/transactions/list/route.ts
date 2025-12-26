/**
 * GET/POST /api/admin/transactions/list
 *
 * Admin endpoint to list all transactions with filtering and pagination.
 */

import { supabaseAdmin } from '@/lib/supabaseClient';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');

    const offset = (page - 1) * limit;

    // Build query with joins
    let query = supabaseAdmin
      .from('transactions')
      .select(
        '*, client_profiles!userId(first_name, last_name, company_name), payout_requests!transactionId(recipientName, recipientBank, recipientAccount, recipientCountry)',
        { count: 'exact' }
      );

    // Apply filters
    if (type && type !== 'all') {
      query = query.eq('type', type);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (userId) {
      query = query.eq('userId', userId);
    }

    // Order and paginate
    query = query.order('"createdAt"', { ascending: false }).range(offset, offset + limit - 1);

    const { data: transactions, count, error } = await query;

    if (error) {
      console.error('[Admin Transactions API] Error:', error);
      return NextResponse.json({
        success: true,
        data: [],
        transactions: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      });
    }

    // Format transactions for admin view
    const formattedTransactions = (transactions || []).map(tx => {
      const profile = tx.client_profiles as any;
      const fullName = profile
        ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
        : 'Unknown';

      // Get recipient from multiple sources (priority order)
      // Note: recipientName column doesn't exist on transactions table, so check metadata first
      const payoutRequest = tx.payout_requests?.[0] as any;
      const recipientName =
        tx.metadata?.recipientName ||  // From transaction metadata (primary source)
        payoutRequest?.recipientName ||  // From payout_requests table
        (tx.type === 'deposit' ? 'Self (Deposit)' : 'N/A');

      return {
        id: tx.id,
        date: formatDate(tx.createdAt),
        time: formatTime(tx.createdAt),
        clientName: fullName || 'Unknown',
        clientEmail: '', // Email column does not exist in client_profiles
        companyName: profile?.company_name || '',
        recipient: recipientName,
        transactionType: mapTransactionType(tx.type),
        paymentMethod: mapPaymentMethod(tx.type, tx.metadata),
        status: mapStatus(tx.status),
        rawStatus: tx.status,
        amount: formatAmount(tx.amount, tx.currency),
        fromAmount: tx.amountFrom ? `From: ${formatAmount(tx.amountFrom, tx.currency)}` : undefined,
        currency: tx.currency,
        currencyTo: tx.currencyTo,
        exchangeRate: tx.exchangeRate,
        type: tx.type,
        referenceNumber: tx.referenceNumber,
        metadata: tx.metadata,
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt,
        // Actions available based on status
        availableActions: getAvailableActions(tx.type, tx.status),
      };
    });

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: formattedTransactions,
      transactions: formattedTransactions, // Legacy support
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error: any) {
    console.error('[Admin Transactions API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

function getAvailableActions(type: string, status: string): string[] {
  const actions: string[] = [];
  const safeType = type?.toLowerCase()?.trim();
  const safeStatus = status?.toUpperCase()?.trim();

  switch (safeStatus) {
    case 'DEPOSIT_REQUESTED':
    case 'PENDING':
      // If explicit deposit status OR type is deposit
      if (safeType === 'deposit' || safeStatus === 'DEPOSIT_REQUESTED') {
        actions.push('mark_received');
      }
      break;
    case 'DEPOSIT_RECEIVED':
      actions.push('execute_swap');
      break;
    case 'PAYOUT_PENDING':
      actions.push('send_payout');
      actions.push('mark_complete');
      break;
    case 'SWAP_COMPLETED':
      actions.push('send_payout');
      break;
  }

  return actions;
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
    case 'PAYOUT_PENDING':
      return 'Pending';
    default:
      return 'Processing';
  }
}
