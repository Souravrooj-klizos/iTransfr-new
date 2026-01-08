/**
 * KYT Monitoring API
 *
 * POST /api/kyt/monitor - Enable monitoring for a wallet
 * DELETE /api/kyt/monitor - Disable monitoring for a wallet
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import {
    screenAddress,
    subscribeToMonitoring,
    unsubscribeFromMonitoring,
    determineRiskSeverity,
    validateKYTConfig,
} from '@/lib/integrations/amlbot-kyt';

// =====================================================
// POST - Enable monitoring
// =====================================================

export async function POST(request: NextRequest) {
    try {
        const config = validateKYTConfig();
        if (!config.valid) {
            return NextResponse.json(
                { error: `KYT not configured. Missing: ${config.missing.join(', ')}` },
                { status: 503 }
            );
        }

        const supabase = createAdminClient();
        const body = await request.json();

        const { walletId, address, network } = body;

        // Validation
        if (!walletId) {
            return NextResponse.json({ error: 'walletId is required' }, { status: 400 });
        }
        if (!address) {
            return NextResponse.json({ error: 'address is required' }, { status: 400 });
        }
        if (!network) {
            return NextResponse.json({ error: 'network is required' }, { status: 400 });
        }

        console.log(`[KYT Monitor API] Enabling monitoring for ${address} on ${network}`);

        // Check if wallet exists
        const { data: wallet, error: walletError } = await supabase
            .from('wallets')
            .select('*')
            .eq('id', walletId)
            .single();

        if (walletError || !wallet) {
            return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
        }

        // If wallet already has monitoring UID, use it
        let uid = wallet.aml_monitoring_uid;

        // If no UID, perform initial screening first
        if (!uid) {
            console.log(`[KYT Monitor API] No existing UID, performing initial screening`);
            const screenResult = await screenAddress(address, network, 'fast');

            if (!screenResult.success) {
                return NextResponse.json(
                    { error: screenResult.error || 'Initial screening failed' },
                    { status: 500 }
                );
            }

            if (screenResult.status === 'pending') {
                return NextResponse.json({
                    success: false,
                    error: 'Screening in progress. Try again in a few seconds.',
                    uid: screenResult.uid,
                });
            }

            uid = screenResult.uid;

            // Update wallet with screening results
            const severity = determineRiskSeverity(screenResult.riskScore || 0, screenResult.isBlacklisted);
            await supabase
                .from('wallets')
                .update({
                    aml_risk_score: screenResult.riskScore,
                    aml_status: severity,
                    aml_last_checked: new Date().toISOString(),
                    aml_last_signals: screenResult.signals || null,
                })
                .eq('id', walletId);

            // Save screening record
            await supabase.from('aml_screenings').insert({
                wallet_id: walletId,
                address,
                network: network.toLowerCase(),
                risk_score: screenResult.riskScore,
                risk_signals: screenResult.signals || {},
                is_blacklisted: screenResult.isBlacklisted || false,
                amlbot_uid: uid,
                amlbot_response: screenResult.rawResponse,
                check_type: 'manual',
            });
        }

        if (!uid) {
            return NextResponse.json(
                { error: 'Failed to get screening UID for monitoring' },
                { status: 500 }
            );
        }

        // Subscribe to monitoring
        const monitorResult = await subscribeToMonitoring(uid);

        if (!monitorResult.success) {
            return NextResponse.json(
                { error: monitorResult.error || 'Failed to enable monitoring' },
                { status: 500 }
            );
        }

        // Update wallet with monitoring status
        const { error: updateError } = await supabase
            .from('wallets')
            .update({
                aml_monitoring_enabled: true,
                aml_monitoring_uid: uid,
            })
            .eq('id', walletId);

        if (updateError) {
            console.error('[KYT Monitor API] Error updating wallet:', updateError);
        }

        console.log(`[KYT Monitor API] ✅ Monitoring enabled for wallet ${walletId}`);

        return NextResponse.json({
            success: true,
            message: 'Monitoring enabled successfully',
            walletId,
            uid,
            riskScore: wallet.aml_risk_score,
        });
    } catch (error) {
        console.error('[KYT Monitor API] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}

// =====================================================
// DELETE - Disable monitoring
// =====================================================

export async function DELETE(request: NextRequest) {
    try {
        const supabase = createAdminClient();
        const { searchParams } = new URL(request.url);
        const walletId = searchParams.get('walletId');

        if (!walletId) {
            return NextResponse.json({ error: 'walletId is required' }, { status: 400 });
        }

        // Get wallet
        const { data: wallet, error: walletError } = await supabase
            .from('wallets')
            .select('*')
            .eq('id', walletId)
            .single();

        if (walletError || !wallet) {
            return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
        }

        if (!wallet.aml_monitoring_uid) {
            return NextResponse.json({ error: 'Wallet is not being monitored' }, { status: 400 });
        }

        console.log(`[KYT Monitor API] Disabling monitoring for wallet ${walletId}`);

        // Unsubscribe from monitoring
        const unsubResult = await unsubscribeFromMonitoring(wallet.aml_monitoring_uid);

        if (!unsubResult.success) {
            console.error('[KYT Monitor API] Failed to unsubscribe:', unsubResult.error);
            // Continue anyway to update local state
        }

        // Update wallet
        const { error: updateError } = await supabase
            .from('wallets')
            .update({
                aml_monitoring_enabled: false,
            })
            .eq('id', walletId);

        if (updateError) {
            console.error('[KYT Monitor API] Error updating wallet:', updateError);
        }

        console.log(`[KYT Monitor API] ✅ Monitoring disabled for wallet ${walletId}`);

        return NextResponse.json({
            success: true,
            message: 'Monitoring disabled successfully',
            walletId,
        });
    } catch (error) {
        console.error('[KYT Monitor API] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}
