/**
 * KYT Alert Detail API
 *
 * GET /api/kyt/alerts/[id] - Get alert details
 * PATCH /api/kyt/alerts/[id] - Update alert status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

interface RouteContext {
    params: Promise<{ id: string }>;
}

// =====================================================
// GET - Get alert details
// =====================================================

export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;
        const supabase = createAdminClient();

        const { data: alert, error } = await supabase
            .from('aml_alerts')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !alert) {
            return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
        }

        // Get associated wallet info
        let wallet = null;
        if (alert.wallet_id) {
            const { data: walletData } = await supabase
                .from('wallets')
                .select('id, address, network, label, wallet_type')
                .eq('id', alert.wallet_id)
                .single();
            wallet = walletData;
        }

        return NextResponse.json({
            alert,
            wallet,
        });
    } catch (error) {
        console.error('[KYT Alert API] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}

// =====================================================
// PATCH - Update alert status
// =====================================================

export async function PATCH(request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;
        const supabase = createAdminClient();
        const body = await request.json();

        const { status, notes, reviewedBy } = body;

        // Validate status
        const validStatuses = ['unread', 'reviewed', 'resolved', 'dismissed'];
        if (status && !validStatuses.includes(status)) {
            return NextResponse.json(
                { error: `Invalid status. Supported: ${validStatuses.join(', ')}` },
                { status: 400 }
            );
        }

        // Build update object
        const updates: Record<string, any> = {};

        if (status) {
            updates.status = status;

            // If marking as reviewed/resolved/dismissed, set review timestamp
            if (status !== 'unread') {
                updates.reviewed_at = new Date().toISOString();
                if (reviewedBy) {
                    updates.reviewed_by = reviewedBy;
                }
            }
        }

        if (notes !== undefined) {
            updates.notes = notes;
        }

        const { data: alert, error } = await supabase
            .from('aml_alerts')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[KYT Alert API] Error updating alert:', error);
            return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 });
        }

        console.log(`[KYT Alert API] Alert ${id} updated: status=${status}`);

        return NextResponse.json({
            success: true,
            alert,
        });
    } catch (error) {
        console.error('[KYT Alert API] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}
