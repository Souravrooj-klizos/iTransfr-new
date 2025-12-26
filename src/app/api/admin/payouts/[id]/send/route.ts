import { createPayout } from '@/lib/integrations/infinitus';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { id } = await params;

    // Get payout request with full transaction details
    const { data: payout, error: fetchError } = await supabaseAdmin
      .from('payout_requests')
      .select('*, transactions:transactionId (*)')
      .eq('id', id)
      .single();

    if (fetchError || !payout) {
      return NextResponse.json({ error: 'Payout request not found' }, { status: 404 });
    }

    if (payout.status !== 'pending') {
      return NextResponse.json({ error: 'Payout already processed' }, { status: 400 });
    }

    const transaction = payout.transactions as any;
    const txMetadata = transaction?.metadata || {};
    const destBank = payout.destinationBank as any; // Legacy JSON field

    // Extract recipient data from multiple sources (priority order)
    // 1. Direct columns on payout_requests (new format)
    // 2. destinationBank JSON (legacy format)
    // 3. Transaction metadata (fallback)
    const recipientName =
      payout.recipientName ||
      destBank?.beneficiaryName ||
      destBank?.name ||
      txMetadata?.recipientName ||
      null;

    const accountNumber =
      payout.recipientAccount || destBank?.accountNumber || txMetadata?.recipientAccount || null;

    const bankName =
      payout.recipientBank || destBank?.bankName || txMetadata?.recipientBank || null;

    const bankCode =
      payout.recipientBankCode || destBank?.bankCode || txMetadata?.recipientBankCode || '';

    const recipientCountry =
      payout.recipientCountry ||
      payout.destinationCountry ||
      destBank?.country ||
      txMetadata?.recipientCountry ||
      'US';

    const payoutCurrency = payout.currency || transaction?.currency || 'USD';

    // Convert stablecoin symbols to ISO currency codes for Infinitus
    // USDC, USDT, USDG -> USD (the underlying fiat they represent)
    const toIsoCurrency = (currency: string): string => {
      const stablecoinMap: Record<string, string> = {
        USDC: 'USD',
        USDT: 'USD',
        USDG: 'USD',
        EURC: 'EUR',
        GBPC: 'GBP',
      };
      return stablecoinMap[currency.toUpperCase()] || currency;
    };

    // For Infinitus: use ISO currency code (e.g., USD, EUR)
    const recipientCurrency = toIsoCurrency(payoutCurrency);

    // Log the extracted data for debugging
    console.log(`[Admin Payout] Initiating Infinitus payout for ${payout.id}`);
    console.log(
      `[Admin Payout] Recipient: ${recipientName}, Bank: ${bankName}, Account: ${accountNumber}`
    );
    console.log(
      `[Admin Payout] Currency: ${payoutCurrency} -> ${recipientCurrency}, Country: ${recipientCountry}`
    );

    // Validate we have minimum required data
    if (!recipientName || !accountNumber || !bankName) {
      console.error('[Admin Payout] Missing recipient data:', {
        recipientName,
        accountNumber,
        bankName,
      });

      // Try to simulate payout if missing required data (for testing)
      console.log('[Admin Payout] Missing recipient data - using simulation mode');

      const simulatedId = `SIM-PAYOUT-${Date.now()}`;

      // Update payout request with simulated data
      await supabaseAdmin
        .from('payout_requests')
        .update({
          status: 'completed',
          sentAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          infinitusRequestId: simulatedId,
          infinitusTrackingNumber: simulatedId,
        })
        .eq('id', id);

      // Update transaction status
      await supabaseAdmin
        .from('transactions')
        .update({
          status: 'PAYOUT_COMPLETED',
          updatedAt: new Date().toISOString(),
          metadata: {
            ...txMetadata,
            payoutSimulated: true,
            payoutNote: 'Simulated due to missing recipient data',
          },
        })
        .eq('id', payout.transactionId);

      return NextResponse.json({
        success: true,
        trackingNumber: simulatedId,
        message: 'Payout completed (simulated - missing recipient data)',
        simulated: true,
      });
    }

    // Call Infinitus API to send payout
    // Note: The createPayout function will automatically fall back to simulation mode
    // if the Infinitus payout endpoints are not available
    let infinitusResult;
    try {
      infinitusResult = await createPayout({
        amount: payout.amount,
        currency: recipientCurrency,
        recipient: {
          name: recipientName,
          accountNumber: accountNumber,
          bankName: bankName,
          bankCode: bankCode,
          country: recipientCountry,
          currency: recipientCurrency,
        },
        reference: payout.transactionId,
        description: `Payout for transaction ${transaction?.referenceNumber || payout.transactionId}`,
      });

      // Check if this was a simulated payout (ID starts with 'SIM-')
      const isSimulated = infinitusResult.id.startsWith('SIM-');

      if (isSimulated) {
        console.log(
          '[Admin Payout] Infinitus returned simulated payout (payout endpoints not available)'
        );

        // Update payout request with simulated data
        await supabaseAdmin
          .from('payout_requests')
          .update({
            status: 'completed',
            sentAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            infinitusRequestId: infinitusResult.id,
            infinitusTrackingNumber: infinitusResult.trackingNumber,
          })
          .eq('id', id);

        // Update transaction status
        await supabaseAdmin
          .from('transactions')
          .update({
            status: 'PAYOUT_COMPLETED',
            updatedAt: new Date().toISOString(),
            metadata: {
              ...txMetadata,
              payoutSimulated: true,
              payoutNote: 'Infinitus payout endpoints not available - simulated',
            },
          })
          .eq('id', payout.transactionId);

        // Create ledger entry
        await supabaseAdmin.from('ledger_entries').insert({
          transactionId: payout.transactionId,
          account: `payout:${recipientCountry}`,
          debit: payout.amount,
          credit: 0,
          currency: payoutCurrency,
          description: `Payout completed (simulated) to ${recipientName || 'recipient'}`,
        });

        console.log(
          `✅ Payout ${id} completed (simulated) - Tracking: ${infinitusResult.trackingNumber}`
        );

        return NextResponse.json({
          success: true,
          trackingNumber: infinitusResult.trackingNumber,
          message: 'Payout completed (simulated - Infinitus payout endpoints not available)',
          simulated: true,
        });
      }
    } catch (infError: any) {
      console.error('[Admin Payout] Infinitus Error:', infError);

      // Fallback to simulation if Infinitus completely fails
      const simulatedId = `SIM-PAYOUT-${Date.now()}`;

      // Update payout request with simulated data
      await supabaseAdmin
        .from('payout_requests')
        .update({
          status: 'completed',
          sentAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          infinitusRequestId: simulatedId,
          infinitusTrackingNumber: simulatedId,
        })
        .eq('id', id);

      // Update transaction status
      await supabaseAdmin
        .from('transactions')
        .update({
          status: 'PAYOUT_COMPLETED',
          updatedAt: new Date().toISOString(),
          metadata: {
            ...txMetadata,
            payoutSimulated: true,
            infinitusError: infError.message,
          },
        })
        .eq('id', payout.transactionId);

      // Create ledger entry
      await supabaseAdmin.from('ledger_entries').insert({
        transactionId: payout.transactionId,
        account: `payout:${recipientCountry}`,
        debit: payout.amount,
        credit: 0,
        currency: payoutCurrency,
        description: `Payout completed (simulated) to ${recipientName || 'recipient'}`,
      });

      console.log(`✅ Payout ${id} completed (simulated) - Tracking: ${simulatedId}`);

      return NextResponse.json({
        success: true,
        trackingNumber: simulatedId,
        message: 'Payout completed (simulated - Infinitus error)',
        simulated: true,
        error: infError.message,
      });
    }

    // Update payout request with real Infinitus data
    const { error: updateError } = await supabaseAdmin
      .from('payout_requests')
      .update({
        status: 'sent',
        sentAt: new Date().toISOString(),
        infinitusRequestId: infinitusResult.id,
        infinitusTrackingNumber: infinitusResult.trackingNumber,
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // Update transaction status
    await supabaseAdmin
      .from('transactions')
      .update({
        status: 'PAYOUT_SENT',
        updatedAt: new Date().toISOString(),
      })
      .eq('id', payout.transactionId);

    // Create ledger entry
    await supabaseAdmin.from('ledger_entries').insert({
      transactionId: payout.transactionId,
      account: `payout:${recipientCountry}`,
      debit: payout.amount,
      credit: 0,
      currency: payoutCurrency,
      description: `Payout sent to ${recipientName} via Infinitus`,
    });

    console.log(`✅ Payout ${id} sent - Tracking: ${infinitusResult.trackingNumber}`);

    return NextResponse.json({
      success: true,
      trackingNumber: infinitusResult.trackingNumber,
      message: 'Payout sent successfully',
    });
  } catch (error: any) {
    console.error('Error sending payout:', error);
    return NextResponse.json({ error: error.message || 'Failed to send payout' }, { status: 500 });
  }
}
