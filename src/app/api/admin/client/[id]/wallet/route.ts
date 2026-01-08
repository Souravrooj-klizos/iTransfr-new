/**
 * Client Wallet API
 *
 * GET /api/admin/client/[id]/wallet - Get client's wallets
 * POST /api/admin/client/[id]/wallet - Create wallet for client
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getWalletInfo } from '@/lib/integrations/turnkey-signing';
import { screenAndMonitor } from '@/lib/integrations/amlbot-kyt';

interface RouteContext {
    params: Promise<{ id: string }>;
}

// =====================================================
// GET - Get client's wallets
// =====================================================

export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const { id: clientId } = await context.params;
        const supabase = createAdminClient();

        // Get wallets linked to this client
        const { data: links, error: linksError } = await supabase
            .from('client_wallet_links')
            .select(`
        *,
        wallets (*)
      `)
            .eq('client_id', clientId);

        if (linksError) {
            console.error('[Client Wallet API] Error fetching wallet links:', linksError);
            return NextResponse.json({ error: 'Failed to fetch wallets' }, { status: 500 });
        }

        // Also get wallets directly linked via userId
        const { data: directWallets, error: directError } = await supabase
            .from('wallets')
            .select('*')
            .eq('userId', clientId);

        if (directError) {
            console.error('[Client Wallet API] Error fetching direct wallets:', directError);
        }

        // Combine and deduplicate
        const linkedWallets = links?.map(link => ({
            ...link.wallets,
            linkInfo: {
                isPrimary: link.is_primary,
                linkedAt: link.linked_at,
                notes: link.notes,
            },
        })) || [];

        const allWallets = [...linkedWallets];

        // Add direct wallets that aren't already in linked wallets
        if (directWallets) {
            for (const wallet of directWallets) {
                if (!allWallets.find(w => w.id === wallet.id)) {
                    allWallets.push(wallet);
                }
            }
        }

        return NextResponse.json({
            wallets: allWallets,
            count: allWallets.length,
        });
    } catch (error) {
        console.error('[Client Wallet API] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}

// =====================================================
// POST - Create wallet for client
// =====================================================

import { createClientWallet } from '@/services/wallet-service';

export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const { id: clientId } = await context.params;
        const body = await request.json();

        const {
            network,
            label,
            enableKytMonitoring = true,
            isPrimary = true,
        } = body;

        const result = await createClientWallet({
            clientId,
            network,
            label,
            isPrimary,
            enableKytMonitoring,
        });

        console.log(`[Client Wallet API] ✅ Wallet created for client ${clientId}: ${result.wallet.id}`);

        return NextResponse.json(
            {
                success: true,
                wallet: {
                    ...result.wallet,
                    turnkeyWalletId: result.wallet.turnkeyInfo.walletId,
                },
                kyt: result.kyt,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('[Client Wallet API] Error:', error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        const status = message.includes('Client not found') ? 404 :
            message.includes('Invalid network') ? 400 : 500;

        return NextResponse.json(
            { error: message },
            { status }
        );
    }
}
