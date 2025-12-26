/**
 * GET /api/wallets/deposit-address
 *
 * Get deposit address for a specific currency and chain.
 * Uses Turnkey integration to fetch the wallet address.
 */

import {
  createUserWallet,
  getWalletAddress,
  validateTurnkeyConfig,
} from '@/lib/integrations/turnkey';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const currency = searchParams.get('currency');
    const chain = searchParams.get('chain'); // e.g., 'tron', 'ethereum', 'solana'

    if (!currency || !chain) {
      return NextResponse.json({ error: 'Currency and chain are required' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Check Turnkey Config (skip in DEV_MODE)
    const { valid, missing, devMode } = validateTurnkeyConfig();
    if (!valid) {
      console.error('[Deposit Address] Missing Turnkey config:', missing);
      return NextResponse.json(
        { error: `Server config error: Missing ${missing.join(', ')}` },
        { status: 500 }
      );
    }
    if (devMode) {
      console.log('[Deposit Address] Using DEV MODE - mock wallets will be used');
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

    // 1. Check if user already has a wallet record in our DB
    const { data: walletRecord, error: dbError } = await supabaseAdmin
      .from('wallets')
      .select('turnkeyWalletId')
      .eq('userId', user.id)
      .eq('currency', currency)
      .single();

    let turnkeyWalletId = walletRecord?.turnkeyWalletId;

    // 2. If no wallet record, check if they have ANY wallet to get the ID
    if (!turnkeyWalletId) {
      const { data: anyWallet } = await supabaseAdmin
        .from('wallets')
        .select('turnkeyWalletId')
        .eq('userId', user.id)
        .limit(1)
        .single();

      turnkeyWalletId = anyWallet?.turnkeyWalletId;
    }

    // 3. If still no wallet, create one in Turnkey
    if (!turnkeyWalletId) {
      try {
        const newWallet = await createUserWallet(user.id);
        turnkeyWalletId = newWallet.walletId;

        // Save wallet record
        await supabaseAdmin.from('wallets').insert({
          userId: user.id,
          currency: currency,
          chain: chain,
          balance: 0,
          turnkeyWalletId: turnkeyWalletId,
          address: newWallet.addresses[chain as keyof typeof newWallet.addresses] || '',
          status: 'active',
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        });
      } catch (err: any) {
        console.error('[Deposit Address] Failed to create wallet:', err);
        return NextResponse.json({ error: 'Failed to generate wallet' }, { status: 500 });
      }
    }

    // 4. Get address from Turnkey
    const address = await getWalletAddress(turnkeyWalletId, chain as any);

    if (!address) {
      return NextResponse.json({ error: `No address found for chain: ${chain}` }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        currency,
        chain,
        address,
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${address}`,
      },
    });
  } catch (error: any) {
    console.error('[Deposit Address] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get deposit address' },
      { status: 500 }
    );
  }
}
