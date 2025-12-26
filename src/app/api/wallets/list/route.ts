/**
 * GET /api/wallets/list
 *
 * Get all wallets for the authenticated user.
 * Returns wallet balances for display on dashboard and balance pages.
 */

import { supabaseAdmin } from '@/lib/supabaseClient';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const cookieStore = await cookies();
    // Get user from session
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

    const targetUserId = userId || user.id;

    // Get wallets from database
    const { data: wallets, error } = await supabaseAdmin
      .from('wallets')
      .select('*')
      .eq('userId', targetUserId);

    if (error) {
      console.error('[Wallets API] Error:', error);
      // Return empty array if no wallets found
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // Format wallets for frontend
    const formattedWallets = (wallets || []).map(wallet => ({
      id: wallet.id,
      currency: wallet.currency,
      chain: wallet.chain,
      address: wallet.address,
      balance: wallet.balance || 0,
      formattedBalance: formatBalance(wallet.balance || 0, wallet.currency),
      network: getNetworkName(wallet.chain),
      networkType: getNetworkType(wallet.chain),
      status: wallet.status,
    }));

    return NextResponse.json({
      success: true,
      data: formattedWallets,
    });
  } catch (error: any) {
    console.error('[Wallets API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch wallets' },
      { status: 500 }
    );
  }
}

function formatBalance(balance: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(balance);
}

function getNetworkName(chain: string): string {
  const networks: Record<string, string> = {
    tron: 'Tron Network',
    ethereum: 'Ethereum Network',
    solana: 'Solana Network',
  };
  return networks[chain?.toLowerCase()] || chain;
}

function getNetworkType(chain: string): string {
  const types: Record<string, string> = {
    tron: 'TRC-20',
    ethereum: 'ERC-20',
    solana: 'SPL',
  };
  return types[chain?.toLowerCase()] || '';
}
