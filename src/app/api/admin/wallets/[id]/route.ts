/**
 * Wallet Detail API
 *
 * GET /api/admin/wallets/[id] - Get wallet details
 * PATCH /api/admin/wallets/[id] - Update wallet
 * DELETE /api/admin/wallets/[id] - Delete/deactivate wallet
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getWalletInfo } from '@/lib/integrations/turnkey-signing';

interface RouteContext {
    params: Promise<{ id: string }>;
}

// =====================================================
// GET - Get wallet details
// =====================================================

export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;
        const supabase = createAdminClient();
        console.log(id);
        // Get wallet with linked clients
        const { data: wallet, error } = await supabase
            .from('wallets')
            .select(`
        *,
        client_wallet_links (
          client_id,
          is_primary,
          linked_at,
          notes
        )
      `)
            .eq('id', id)
            .single();

        if (error || !wallet) {
            return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
        }

        // Get recent screenings
        const { data: screenings } = await supabase
            .from('aml_screenings')
            .select('*')
            .eq('wallet_id', id)
            .order('created_at', { ascending: false })
            .limit(10);

        // Get recent alerts
        const { data: alerts } = await supabase
            .from('aml_alerts')
            .select('*')
            .eq('wallet_id', id)
            .order('created_at', { ascending: false })
            .limit(10);

        // Get Turnkey wallet info if available
        let turnkeyInfo = null;
        if (wallet.turnkeyWalletId) {
            try {
                turnkeyInfo = await getWalletInfo(wallet.turnkeyWalletId);
            } catch (e) {
                console.error('[Wallet API] Error fetching Turnkey info:', e);
            }
        }

        return NextResponse.json({
            wallet: {
                ...wallet,
                turnkeyInfo,
            },
            screenings: screenings || [],
            alerts: alerts || [],
        });
    } catch (error) {
        console.error('[Wallet API] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}

// =====================================================
// PATCH - Update wallet
// =====================================================

export async function PATCH(request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;
        const supabase = createAdminClient();
        const body = await request.json();

        const allowedUpdates = [
            'label',
            'status',
            'aml_alert_threshold',
            'aml_critical_threshold',
        ];

        // Filter to only allowed fields
        const updates: Record<string, any> = {};
        for (const key of allowedUpdates) {
            if (body[key] !== undefined) {
                updates[key] = body[key];
            }
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }

        const { data: wallet, error } = await supabase
            .from('wallets')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[Wallet API] Error updating wallet:', error);
            return NextResponse.json({ error: 'Failed to update wallet' }, { status: 500 });
        }

        return NextResponse.json({ wallet });
    } catch (error) {
        console.error('[Wallet API] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}

// =====================================================
// DELETE - Deactivate wallet (soft delete)
// =====================================================

export async function DELETE(request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;
        const supabase = createAdminClient();

        // Soft delete - set status to inactive
        const { data: wallet, error } = await supabase
            .from('wallets')
            .update({
                status: 'inactive',
                deletion_status: 'pending',
                deletion_requested_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[Wallet API] Error deactivating wallet:', error);
            return NextResponse.json({ error: 'Failed to deactivate wallet' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Wallet deactivated and pending deletion approval',
            wallet,
        });
    } catch (error) {
        console.error('[Wallet API] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}
