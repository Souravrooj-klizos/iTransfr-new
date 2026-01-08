/**
 * KYT Alerts API
 *
 * GET /api/kyt/alerts - List all KYT alerts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = createAdminClient();

        // Get query parameters for filtering
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status'); // unread, reviewed, resolved, dismissed
        const severity = searchParams.get('severity'); // low, medium, high, critical
        const walletId = searchParams.get('walletId');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        // Build query
        let query = supabase
            .from('aml_alerts')
            .select('*', { count: 'exact' });

        // Apply filters
        if (status) {
            query = query.eq('status', status);
        }
        if (severity) {
            query = query.eq('severity', severity);
        }
        if (walletId) {
            query = query.eq('wallet_id', walletId);
        }

        // Order and paginate
        query = query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        const { data: alerts, error, count } = await query;

        if (error) {
            console.error('[KYT Alerts API] Error fetching alerts:', error);
            return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
        }

        // Get unread count
        const { count: unreadCount } = await supabase
            .from('aml_alerts')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'unread');

        return NextResponse.json({
            alerts: alerts || [],
            total: count || 0,
            unreadCount: unreadCount || 0,
            limit,
            offset,
        });
    } catch (error) {
        console.error('[KYT Alerts API] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}
