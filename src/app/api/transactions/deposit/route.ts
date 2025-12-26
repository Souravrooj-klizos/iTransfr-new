import { canUserTransact, screenTransaction } from '@/lib/integrations/aml-check';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/transactions/deposit
 *
 * Create a new deposit request
 * - Checks user KYC status
 * - Runs AML transaction screening
 * - Creates transaction record
 * - Returns bank details for deposit
 *
 * Request body:
 * {
 *   "amount": 1000,
 *   "currency": "USD"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { amount, currency, chain, source } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }

    if (!currency) {
      return NextResponse.json({ error: 'Currency is required' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Get authenticated user
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.log('[Deposit] Creating deposit for user:', user.id);
    console.log('[Deposit] Amount:', amount, currency);

    // 1. Check if user can transact (KYC approved)
    const canTransact = await canUserTransact(user.id);
    if (!canTransact.allowed) {
      return NextResponse.json(
        {
          error: canTransact.reason || 'Cannot process transaction',
          kycRequired: true,
        },
        { status: 403 }
      );
    }

    // 2. Generate transaction reference
    const reference = `DEP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // 3. Create preliminary transaction record
    const { data: transaction, error: txError } = await supabaseAdmin
      .from('transactions')
      .insert({
        userId: user.id,
        type: 'deposit',
        amount,
        currency: currency,
        status: 'DEPOSIT_REQUESTED',
        referenceNumber: reference,
        metadata: {
          source: source || 'crypto',
          chain: chain || null,
          notes: ['Deposit request created'],
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (txError || !transaction) {
      console.error('[Deposit] Failed to create transaction:', txError);
      return NextResponse.json(
        {
          error: 'Failed to create deposit request',
          details: (txError as any).message || txError,
          hint: (txError as any).details || (txError as any).hint,
        },
        { status: 500 }
      );
    }

    console.log('[Deposit] Transaction created:', transaction.id);

    // 4. Run AML screening
    const amlResult = await screenTransaction({
      transactionId: transaction.id,
      userId: user.id,
      amount,
      currency,
      transactionType: 'deposit',
    });

    // 5. Update transaction with AML result
    if (!amlResult.passed) {
      // Block the transaction
      const currentNotes = transaction.metadata?.notes || [];
      await supabaseAdmin
        .from('transactions')
        .update({
          status: 'FAILED',
          metadata: {
            ...transaction.metadata,
            notes: [
              ...currentNotes,
              `AML Check Failed: ${amlResult.reason}`,
              `Risk Score: ${amlResult.riskScore}`,
            ],
          },
          updatedAt: new Date().toISOString(),
        })
        .eq('id', transaction.id);

      console.log('[Deposit] ❌ Transaction blocked by AML check');

      return NextResponse.json(
        {
          success: false,
          error: 'Transaction cannot be processed at this time',
          message: 'Please contact support for assistance',
          transactionId: transaction.id,
          reference,
        },
        { status: 403 }
      );
    }

    // 6. AML passed - update transaction and return bank details
    const currentNotes = transaction.metadata?.notes || [];
    await supabaseAdmin
      .from('transactions')
      .update({
        metadata: {
          ...transaction.metadata,
          notes: [
            ...currentNotes,
            `AML Check Passed - Risk Score: ${amlResult.riskScore} (${amlResult.riskLevel})`,
          ],
        },
        updatedAt: new Date().toISOString(),
      })
      .eq('id', transaction.id);

    console.log('[Deposit] ✅ Deposit request approved');

    // 7. Return success with bank details
    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      reference,
      status: 'DEPOSIT_REQUESTED',
      amount,
      currency,
      amlCheck: {
        passed: true,
        riskScore: amlResult.riskScore,
        riskLevel: amlResult.riskLevel,
      },
      bankDetails: {
        bankName: 'Chase Bank',
        accountNumber: '1234567890',
        routingNumber: '021000021',
        accountName: 'iTransfer Inc.',
        swiftCode: 'CHASUS33',
        reference: reference,
        instructions: `Please include reference "${reference}" in your transfer memo`,
      },
      message: 'Deposit request created. Please transfer funds using the bank details provided.',
    });
  } catch (error: any) {
    console.error('[Deposit] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create deposit' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/transactions/deposit
 *
 * Get user's deposit transactions
 */
export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Get authenticated user
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Fetch user's deposit transactions
    const { data: deposits, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('userId', user.id)
      .eq('type', 'deposit')
      .order('createdAt', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      deposits: deposits || [],
      count: deposits?.length || 0,
    });
  } catch (error: any) {
    console.error('[Deposit GET] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch deposits' },
      { status: 500 }
    );
  }
}
