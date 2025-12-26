import { canUserTransact, screenTransaction } from '@/lib/integrations/aml-check';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/transactions/payout
 *
 * Create a new payout request (send money to recipient)
 * - Checks user KYC status
 * - Runs AML transaction screening (with destination country)
 * - Creates transaction and payout request records
 *
 * Request body:
 * {
 *   "amount": 83250,
 *   "currency": "INR",
 *   "recipient": {
 *     "name": "Priya Sharma",
 *     "accountNumber": "123456789012",
 *     "bankName": "State Bank of India",
 *     "ifscCode": "SBIN0001234",
 *     "country": "IN"
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const {
      amount,
      sourceCurrency,
      destinationCurrency,
      recipientName,
      accountNumber,
      bankName,
      bankCode,
      country,
      accountType,
    } = await request.json();

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }

    if (!sourceCurrency) {
      return NextResponse.json({ error: 'Source Currency is required' }, { status: 400 });
    }

    if (!recipientName || !accountNumber || !bankName) {
      return NextResponse.json(
        { error: 'Recipient bank details are required (Name, Account, Bank)' },
        { status: 400 }
      );
    }

    // Construct recipient object for internal usage/logs
    const recipient = {
      name: recipientName,
      accountNumber,
      bankName,
      bankCode,
      country,
      accountType,
    };

    const currency = sourceCurrency; // Spending currency (USDC/USDT)

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

    console.log('[Payout] Creating payout for user:', user.id);
    console.log('[Payout] Amount:', amount, currency);
    console.log('[Payout] Destination:', recipient.country);

    // 1. Check if user can transact
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

    // 2. Check user has sufficient balance and deduct
    // Query specifically for the requested currency
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('*')
      .eq('userId', user.id)
      .eq('currency', currency) // Match exact currency requested
      .single();

    console.log('[Payout] Wallet lookup:', { currency, wallet: wallet?.id, balance: wallet?.balance, error: walletError?.message });

    // If wallet doesn't exist or balance too low
    if (walletError || !wallet || wallet.balance < amount) {
      const availableBalance = wallet?.balance || 0;
      console.log(`[Payout] Insufficient funds: requested ${amount}, available ${availableBalance}`);
      return NextResponse.json({
        error: `Insufficient funds. Available ${currency} balance: $${availableBalance.toFixed(2)}`
      }, { status: 400 });
    }

    // Deduct balance
    const { error: updateError } = await supabaseAdmin
      .from('wallets')
      .update({ balance: wallet.balance - amount })
      .eq('id', wallet.id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update wallet balance' }, { status: 500 });
    }

    // 3. Generate transaction reference
    const reference = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // 4. Create transaction record with recipient details
    // Note: recipientName and currencyTo don't exist in DB schema, store in metadata only
    const { data: transaction, error: txError } = await supabaseAdmin
      .from('transactions')
      .insert({
        userId: user.id,
        type: 'payout',
        amount,
        currency: currency,
        status: 'PAYOUT_PENDING',
        referenceNumber: reference,
        // Store all recipient details in metadata since transaction table doesn't have these columns
        metadata: {
          notes: ['Payout request created'],
          // Store full recipient details for Infinitus payout and display
          recipientName: recipient.name,
          recipientAccount: recipient.accountNumber,
          recipientBank: recipient.bankName,
          recipientBankCode: recipient.bankCode,
          recipientCountry: recipient.country || 'US',
          accountType: recipient.accountType || 'checking',
          transferType: recipient.country === 'US' ? 'domestic' : 'international',
          destinationCurrency: destinationCurrency || currency,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (txError || !transaction) {
      console.error('[Payout] Failed to create transaction:', txError);

      // IMPORTANT: Refund the balance since transaction failed
      console.log('[Payout] Refunding balance due to transaction failure');
      await supabaseAdmin
        .from('wallets')
        .update({ balance: wallet.balance }) // Restore original balance
        .eq('id', wallet.id);

      return NextResponse.json({ error: 'Failed to create payout request' }, { status: 500 });
    }

    console.log('[Payout] Transaction created:', transaction.id);

    // 4b. Create ledger entries
    await supabaseAdmin.from('ledger_entries').insert([
      {
        transactionId: transaction.id,
        account: 'user_wallet',
        debit: amount,
        credit: 0,
        currency,
        description: 'Payout request debit',
      },
      {
        transactionId: transaction.id,
        account: 'payout_liability',
        debit: 0,
        credit: amount,
        currency,
        description: 'Payout pending liability',
      },
    ]);

    // 5. Run AML screening with destination country
    const amlResult = await screenTransaction({
      transactionId: transaction.id,
      userId: user.id,
      amount,
      currency,
      transactionType: 'payout',
      destinationCountry: recipient.country,
    });

    // 6. Handle AML result
    if (!amlResult.passed) {
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

      console.log('[Payout] ❌ Transaction blocked by AML check');

      return NextResponse.json(
        {
          success: false,
          error: 'Payout cannot be processed at this time',
          message: 'Please contact support for assistance',
          transactionId: transaction.id,
          reference,
        },
        { status: 403 }
      );
    }

    // 7. AML passed - Create payout request record
    const { data: payoutRequest, error: payoutError } = await supabaseAdmin
      .from('payout_requests')
      .insert({
        transactionId: transaction.id,
        // Use correct column names that admin/transactions/[id]/update expects
        recipientName: recipient.name,
        recipientAccount: recipient.accountNumber,
        recipientBank: recipient.bankName,
        recipientBankCode: recipient.bankCode || '',
        recipientCountry: recipient.country || 'US',
        amount,
        currency,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (payoutError) {
      console.error('[Payout] Failed to create payout request:', payoutError);
    }

    // Update transaction notes
    const currentNotes = transaction.metadata?.notes || [];
    await supabaseAdmin
      .from('transactions')
      .update({
        metadata: {
          ...transaction.metadata,
          notes: [
            ...currentNotes,
            `AML Check Passed - Risk Score: ${amlResult.riskScore} (${amlResult.riskLevel})`,
            'Payout request submitted for processing',
          ],
        },
        updatedAt: new Date().toISOString(),
      })
      .eq('id', transaction.id);

    console.log('[Payout] ✅ Payout request created');

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      payoutRequestId: payoutRequest?.id,
      reference,
      status: 'PAYOUT_PENDING',
      amount,
      currency,
      recipient: {
        name: recipient.name,
        bankName: recipient.bankName,
        country: recipient.country,
      },
      amlCheck: {
        passed: true,
        riskScore: amlResult.riskScore,
        riskLevel: amlResult.riskLevel,
      },
      message: 'Payout request submitted. Admin will process your request shortly.',
    });
  } catch (error: any) {
    console.error('[Payout] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payout' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/transactions/payout
 *
 * Get user's payout transactions
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

    // Fetch user's payout transactions with payout request details
    const { data: payouts, error } = await supabaseAdmin
      .from('transactions')
      .select(
        `
        *,
        payout_requests (*)
      `
      )
      .eq('userId', user.id)
      .eq('type', 'payout')
      .order('createdAt', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      payouts: payouts || [],
      count: payouts?.length || 0,
    });
  } catch (error: any) {
    console.error('[Payout GET] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payouts' },
      { status: 500 }
    );
  }
}
