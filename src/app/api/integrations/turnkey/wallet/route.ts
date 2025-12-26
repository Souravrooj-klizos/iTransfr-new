import { createWallet, getWallet, listWallets } from '@/lib/integrations/turnkey';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/integrations/turnkey/wallet
 *
 * Create a new wallet for a user
 *
 * Body:
 * {
 *   "userId": "user-uuid",
 *   "userName": "John Doe",
 *   "currency": "USDT" // optional, for our database
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userName, currency = 'USDT' } = body;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'userId is required',
        },
        { status: 400 }
      );
    }

    console.log('[Turnkey Wallet] Creating wallet for user:', userId);

    // Create wallet with Turnkey
    const walletName = userName
      ? `${userName}-${userId.slice(0, 8)}`
      : `wallet-${userId.slice(0, 8)}`;

    const wallet = await createWallet({ walletName, userId });

    // Save to our database
    if (supabaseAdmin) {
      const { error: dbError } = await supabaseAdmin.from('wallets').upsert(
        {
          userId: userId,
          currency: currency,
          balance: 0,
          turnkeyWalletId: wallet.walletId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          onConflict: 'userId,currency',
        }
      );

      if (dbError) {
        console.error('[Turnkey Wallet] Database error:', dbError);
      } else {
        console.log('[Turnkey Wallet] Saved to database');
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Wallet created successfully',
      wallet: {
        id: wallet.walletId,
        name: wallet.walletName,
        accounts: wallet.accounts.map(a => ({
          address: a.address,
          format: a.addressFormat,
        })),
        createdAt: wallet.createdAt,
      },
    });
  } catch (error: any) {
    console.error('[Turnkey Wallet] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create wallet',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/integrations/turnkey/wallet?id=walletId
 * GET /api/integrations/turnkey/wallet (list all)
 *
 * Get wallet details or list all wallets
 */
export async function GET(request: NextRequest) {
  try {
    const walletId = request.nextUrl.searchParams.get('id');

    if (walletId) {
      // Get specific wallet
      const wallet = await getWallet(walletId);

      return NextResponse.json({
        success: true,
        wallet: {
          id: wallet.walletId,
          name: wallet.walletName,
          accounts: wallet.accounts,
          createdAt: wallet.createdAt,
        },
      });
    } else {
      // List all wallets
      const wallets = await listWallets();

      return NextResponse.json({
        success: true,
        wallets: wallets.map(w => ({
          id: w.walletId,
          name: w.walletName,
          accountCount: w.accounts?.length || 0,
        })),
        count: wallets.length,
      });
    }
  } catch (error: any) {
    console.error('[Turnkey Wallet] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get wallet',
      },
      { status: 500 }
    );
  }
}
