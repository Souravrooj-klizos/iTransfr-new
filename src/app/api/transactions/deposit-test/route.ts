import { canUserTransact, screenTransaction } from '@/lib/integrations/aml-check';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/transactions/deposit-test
 *
 * TEST ENDPOINT - For Postman testing without auth cookies
 *
 * ⚠️ DEVELOPMENT ONLY - Remove in production!
 *
 * Request body:
 * {
 *   "userId": "user-uuid",
 *   "amount": 1000,
 *   "currency": "USD"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'This endpoint is disabled in production' },
        { status: 403 }
      );
    }

    const { userId, amount, currency } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required for testing' }, { status: 400 });
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }

    if (!currency) {
      return NextResponse.json({ error: 'Currency is required' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    console.log('[Deposit Test] Creating deposit for user:', userId);
    console.log('[Deposit Test] Amount:', amount, currency);

    // 1. Check if user exists
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('client_profiles')
      .select('id, status, first_name, last_name')
      .eq('id', userId)
      .single();

    if (!profile) {
      return NextResponse.json(
        {
          error: 'User not found',
          hint: 'Check the userId is correct',
          dbError: profileError?.message,
        },
        { status: 404 }
      );
    }

    const userName = `${profile.first_name} ${profile.last_name}`;
    console.log('[Deposit Test] User found:', userName);

    // 2. Check if user can transact (KYC approved)
    const canTransact = await canUserTransact(userId);
    console.log('[Deposit Test] Can transact:', canTransact);

    if (!canTransact.allowed) {
      return NextResponse.json(
        {
          error: canTransact.reason || 'Cannot process transaction',
          kycRequired: true,
          userStatus: profile.status,
          hint: 'User KYC must be approved before making transactions',
        },
        { status: 403 }
      );
    }

    // 3. Generate transaction reference
    const reference = `DEP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // 4. Create transaction record
    const { data: transaction, error: txError } = await supabaseAdmin
      .from('transactions')
      .insert({
        userId: userId,
        type: 'deposit',
        amount,
        currency: currency,
        status: 'DEPOSIT_REQUESTED',
        referenceNumber: reference,
        metadata: { notes: ['Deposit request created (test endpoint)'] },
      })
      .select()
      .single();

    if (txError || !transaction) {
      console.error('[Deposit Test] Failed to create transaction:', txError);
      return NextResponse.json(
        { error: 'Failed to create deposit request', details: txError?.message },
        { status: 500 }
      );
    }

    console.log('[Deposit Test] Transaction created:', transaction.id);

    // 5. Run AML screening
    const amlResult = await screenTransaction({
      transactionId: transaction.id,
      userId: userId,
      amount,
      currency,
      transactionType: 'deposit',
    });

    console.log('[Deposit Test] AML Result:', amlResult);

    // 6. Update transaction with AML result
    if (!amlResult.passed) {
      const existingNotes = transaction.metadata?.notes || [];
      await supabaseAdmin
        .from('transactions')
        .update({
          status: 'FAILED',
          metadata: {
            ...transaction.metadata,
            notes: [
              ...existingNotes,
              `AML Check Failed: ${amlResult.reason}`,
              `Risk Score: ${amlResult.riskScore}`,
            ],
          },
        })
        .eq('id', transaction.id);

      console.log('[Deposit Test] ❌ Transaction blocked by AML check');

      return NextResponse.json(
        {
          success: false,
          error: 'Transaction blocked by AML check',
          reason: amlResult.reason,
          transactionId: transaction.id,
          reference,
          amlCheck: amlResult,
        },
        { status: 403 }
      );
    }

    // 7. AML passed - update transaction
    const existingNotes2 = transaction.metadata?.notes || [];
    await supabaseAdmin
      .from('transactions')
      .update({
        metadata: {
          ...transaction.metadata,
          notes: [
            ...existingNotes2,
            `AML Check Passed - Risk Score: ${amlResult.riskScore} (${amlResult.riskLevel})`,
          ],
        },
      })
      .eq('id', transaction.id);

    console.log('[Deposit Test] ✅ Deposit request approved');

    return NextResponse.json({
      success: true,
      message: 'Deposit request created successfully',
      transactionId: transaction.id,
      reference,
      status: 'DEPOSIT_REQUESTED',
      amount,
      currency,
      user: {
        id: profile.id,
        name: userName,
        status: profile.status,
      },
      amlCheck: {
        passed: amlResult.passed,
        riskScore: amlResult.riskScore,
        riskLevel: amlResult.riskLevel,
        checkId: amlResult.checkId,
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
    });
  } catch (error: any) {
    console.error('[Deposit Test] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create deposit' },
      { status: 500 }
    );
  }
}
