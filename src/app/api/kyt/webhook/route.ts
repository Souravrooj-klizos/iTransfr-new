/**
 * KYT Webhook API
 *
 * POST /api/kyt/webhook - Receive monitoring updates from AMLBot
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseClient';
import {
    verifyWebhookSignature,
    parseWebhookPayload,
    determineRiskSeverity,
    ALERT_THRESHOLD,
    CRITICAL_THRESHOLD,
} from '@/lib/integrations/amlbot-kyt';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const headers = request.headers;

        // Get verification headers
        const check = headers.get('x-amlbot-check') || '';
        const tonce = headers.get('x-amlbot-tonce') || '';

        console.log('[KYT Webhook] Received webhook:', JSON.stringify(body).substring(0, 500));

        // Verify signature (optional in development)
        const isVerified = verifyWebhookSignature(body, check, tonce);
        if (!isVerified && process.env.NODE_ENV === 'production') {
            console.warn('[KYT Webhook] Invalid signature, rejecting');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        // Parse webhook payload
        const parsedData = parseWebhookPayload(body);

        if (!parsedData) {
            console.warn('[KYT Webhook] Failed to parse payload');
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        const { address, network, riskScore, previousRiskScore, signals, isBlacklisted, uid } = parsedData;

        console.log(
            `[KYT Webhook] Alert for ${address}: ${previousRiskScore?.toFixed(1) || 'N/A'}% → ${riskScore.toFixed(1)}%`
        );

        // Determine severity and alert type
        const severity = determineRiskSeverity(riskScore, isBlacklisted);
        let alertType = 'risk_increase';

        if (isBlacklisted) {
            alertType = 'blacklisted';
        } else if (riskScore >= CRITICAL_THRESHOLD) {
            alertType = 'threshold_exceeded';
        } else if (previousRiskScore && riskScore > previousRiskScore) {
            alertType = 'risk_increase';
        }

        // Only create alerts for significant changes
        const significantChange =
            isBlacklisted ||
            riskScore >= ALERT_THRESHOLD ||
            (previousRiskScore && riskScore - previousRiskScore >= 10);

        if (!significantChange) {
            console.log('[KYT Webhook] Change not significant, skipping alert creation');
            return NextResponse.json({ success: true, message: 'No alert needed' });
        }

        // Use Supabase server client
        const supabase = supabaseServer;

        // Find associated wallet
        const { data: wallet } = await supabase
            .from('wallets')
            .select('id')
            .eq('address', address)
            .eq('network', network.toLowerCase())
            .single();

        // Create alert
        const { data: alert, error: alertError } = await supabase
            .from('aml_alerts')
            .insert({
                wallet_id: wallet?.id || null,
                address,
                network: network.toLowerCase(),
                alert_type: alertType,
                previous_risk_score: previousRiskScore || null,
                new_risk_score: riskScore,
                risk_signals: signals,
                severity,
                amlbot_uid: uid,
                amlbot_payload: body,
                status: 'unread',
            })
            .select()
            .single();

        if (alertError) {
            console.error('[KYT Webhook] Error creating alert:', alertError);
            return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 });
        }

        // Update wallet with new risk score
        if (wallet) {
            await supabase
                .from('wallets')
                .update({
                    aml_risk_score: riskScore,
                    aml_status: severity,
                    aml_last_checked: new Date().toISOString(),
                    aml_last_signals: signals,
                })
                .eq('id', wallet.id);
        }

        // Save screening record
        await supabase.from('aml_screenings').insert({
            wallet_id: wallet?.id || null,
            address,
            network: network.toLowerCase(),
            risk_score: riskScore,
            risk_signals: signals,
            is_blacklisted: isBlacklisted,
            amlbot_uid: uid,
            amlbot_response: body,
            check_type: 'monitoring',
        });

        console.log(`[KYT Webhook] ✅ Alert created: ${alert.id} (${severity})`);

        return NextResponse.json({
            success: true,
            alertId: alert.id,
            severity,
            riskScore,
        });
    } catch (error) {
        console.error('[KYT Webhook] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}

// Allow GET for health check
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        endpoint: '/api/kyt/webhook',
        description: 'AMLBot KYT monitoring webhook receiver',
    });
}
