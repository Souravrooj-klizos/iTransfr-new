/**
 * KYT Screen Address API
 *
 * POST /api/kyt/screen - Screen a wallet address for AML risk
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import {
    screenAddress,
    determineRiskSeverity,
    getTopRiskSignals,
    validateKYTConfig,
} from '@/lib/integrations/amlbot-kyt';

export async function POST(request: NextRequest) {
    try {
        // Validate KYT configuration
        const config = validateKYTConfig();
        if (!config.valid) {
            return NextResponse.json(
                { error: `KYT not configured. Missing: ${config.missing.join(', ')}` },
                { status: 503 }
            );
        }

        const supabase = createAdminClient();
        const body = await request.json();

        const { address, network, walletId } = body;

        // Validation
        if (!address) {
            return NextResponse.json({ error: 'Address is required' }, { status: 400 });
        }
        if (!network) {
            return NextResponse.json({ error: 'Network is required' }, { status: 400 });
        }

        console.log(`[KYT Screen API] Screening ${address} on ${network}`);

        // Perform screening
        const result = await screenAddress(address, network, 'fast');

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Screening failed', details: result.rawResponse },
                { status: 500 }
            );
        }

        // Handle pending state
        if (result.status === 'pending') {
            return NextResponse.json({
                success: true,
                status: 'pending',
                message: 'Screening in progress. Check back shortly.',
                uid: result.uid,
            });
        }

        // Calculate severity
        const severity = determineRiskSeverity(result.riskScore || 0, result.isBlacklisted);
        const topSignals = result.signals ? getTopRiskSignals(result.signals) : [];

        // Save screening to database
        const { data: screening, error: insertError } = await supabase
            .from('aml_screenings')
            .insert({
                wallet_id: walletId || null,
                address,
                network: network.toLowerCase(),
                risk_score: result.riskScore,
                risk_signals: result.signals || {},
                is_blacklisted: result.isBlacklisted || false,
                amlbot_uid: result.uid,
                amlbot_response: result.rawResponse,
                check_type: 'manual',
            })
            .select()
            .single();

        if (insertError) {
            console.error('[KYT Screen API] Error saving screening:', insertError);
            // Non-fatal - continue with response
        }

        // Update wallet if walletId provided
        if (walletId) {
            const { error: updateError } = await supabase
                .from('wallets')
                .update({
                    aml_risk_score: result.riskScore,
                    aml_status: severity,
                    aml_last_checked: new Date().toISOString(),
                    aml_last_signals: result.signals || null,
                })
                .eq('id', walletId);

            if (updateError) {
                console.error('[KYT Screen API] Error updating wallet:', updateError);
            }
        }

        console.log(`[KYT Screen API] ✅ Screening complete: ${severity} (${result.riskScore?.toFixed(1)}%)`);

        return NextResponse.json({
            success: true,
            status: 'success',
            riskScore: result.riskScore,
            severity,
            topSignals,
            signals: result.signals,
            isBlacklisted: result.isBlacklisted,
            uid: result.uid,
            screeningId: screening?.id,
        });
    } catch (error) {
        console.error('[KYT Screen API] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}
