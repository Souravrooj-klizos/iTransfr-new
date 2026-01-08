/**
 * Wallet Management API
 *
 * GET /api/admin/wallets - List all wallets
 * POST /api/admin/wallets - Create a new wallet
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import {
    createMasterWallet,
    getSupportedNetworks,
    isValidNetwork,
} from '@/lib/integrations/turnkey-signing';
import { screenAndMonitor } from '@/lib/integrations/amlbot-kyt';

// =====================================================
// GET - List all wallets
// =====================================================

export async function GET(request: NextRequest) {
    try {
        const supabase = createAdminClient();

        // Get query parameters for filtering
        const { searchParams } = new URL(request.url);
        const walletType = searchParams.get('type'); // master, client, client_external
        const network = searchParams.get('network'); // ethereum, solana, tron
        const status = searchParams.get('status'); // active, inactive, suspended
        const clientId = searchParams.get('clientId');

        // Build query
        let query = supabase.from('wallets').select(`
      *,
      client_wallet_links (
        client_id,
        is_primary,
        linked_at
      )
    `);

        // Apply filters
        if (walletType) {
            query = query.eq('wallet_type', walletType);
        }
        if (network) {
            query = query.eq('network', network.toLowerCase());
        }
        if (status) {
            query = query.eq('status', status);
        }
        if (clientId) {
            query = query.eq('client_wallet_links.client_id', clientId);
        }

        // Order by creation date
        query = query.order('createdAt', { ascending: false });

        const { data: wallets, error } = await query;

        if (error) {
            console.error('[Wallets API] Error fetching wallets:', error);
            return NextResponse.json({ error: 'Failed to fetch wallets' }, { status: 500 });
        }

        // Get supported networks for reference
        const supportedNetworks = getSupportedNetworks();

        return NextResponse.json({
            wallets: wallets || [],
            count: wallets?.length || 0,
            supportedNetworks,
        });
    } catch (error) {
        console.error('[Wallets API] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}

// =====================================================
// POST - Create a new wallet
// =====================================================

export async function POST(request: NextRequest) {
    try {
        const supabase = createAdminClient();
        const body = await request.json();

        const {
            name,
            label,
            network,
            walletType = 'master',
            clientId,
            enableKytMonitoring = true,
        } = body;

        // Validation
        if (!name) {
            return NextResponse.json({ error: 'Wallet name is required' }, { status: 400 });
        }

        if (!network) {
            return NextResponse.json({ error: 'Network is required' }, { status: 400 });
        }

        // Validate network - convert to proper case for Turnkey
        const networkLower = network.toLowerCase();
        const networkMap: Record<string, 'Ethereum' | 'Solana' | 'Tron'> = {
            ethereum: 'Ethereum',
            solana: 'Solana',
            tron: 'Tron',
        };

        const turnkeyNetwork = networkMap[networkLower];
        if (!turnkeyNetwork) {
            return NextResponse.json(
                { error: `Invalid network. Supported: ${Object.keys(networkMap).join(', ')}` },
                { status: 400 }
            );
        }

        // Validate wallet type
        const validWalletTypes = ['master', 'client', 'client_external'];
        if (!validWalletTypes.includes(walletType)) {
            return NextResponse.json(
                { error: `Invalid wallet type. Supported: ${validWalletTypes.join(', ')}` },
                { status: 400 }
            );
        }

        // If client wallet, validate clientId
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        if (clientId && !uuidRegex.test(clientId)) {
            // If it's the placeholder from docs/testing, treat as null for master wallets
            if (clientId === 'uuid-here' && walletType === 'master') {
                // Do nothing, let it be null later
            } else {
                return NextResponse.json({ error: 'Invalid clientId format. Must be a valid UUID.' }, { status: 400 });
            }
        }

        if ((walletType === 'client' || walletType === 'client_external') && (!clientId || !uuidRegex.test(clientId))) {
            return NextResponse.json({ error: 'Valid clientId is required for client wallets' }, { status: 400 });
        }

        // Prepare final clientId (null if invalid/placeholder and allowed)
        const finalClientId = (clientId && uuidRegex.test(clientId)) ? clientId : null;

        console.log(`[Wallets API] Creating ${walletType} wallet on ${turnkeyNetwork}`);

        // Create wallet via Turnkey
        const turnkeyResult = await createMasterWallet(name, turnkeyNetwork);

        console.log(`[Wallets API] Turnkey wallet created: ${turnkeyResult.walletId}`);

        // Insert wallet into database
        const { data: wallet, error: insertError } = await supabase
            .from('wallets')
            .insert({
                userId: finalClientId, // Use validated UUID or null
                currency: 'MULTI', // Multi-currency wallet
                network: networkLower,
                address: turnkeyResult.address,
                wallet_type: walletType,
                label: label || name,
                turnkeyWalletId: turnkeyResult.walletId,
                status: 'active',
                balance: 0,
                usdc_balance: 0,
                usdt_balance: 0,
                native_balance: 0,
                aml_status: 'not_checked',
                aml_monitoring_enabled: false,
            })
            .select()
            .single();

        if (insertError) {
            console.error('[Wallets API] Error inserting wallet:', insertError);
            return NextResponse.json({ error: 'Failed to save wallet to database' }, { status: 500 });
        }

        // If client wallet, create link
        if (finalClientId && wallet) {
            const { error: linkError } = await supabase.from('client_wallet_links').insert({
                client_id: finalClientId,
                wallet_id: wallet.id,
                is_primary: true,
            });

            if (linkError) {
                console.error('[Wallets API] Error creating wallet link:', linkError);
                // Non-fatal error, wallet was still created
            }
        }

        // Perform KYT screening if enabled
        let kytResult = null;
        if (enableKytMonitoring && wallet) {
            try {
                console.log(`[Wallets API] Running KYT screening for ${turnkeyResult.address}`);
                kytResult = await screenAndMonitor(turnkeyResult.address, networkLower, true);

                // Update wallet with KYT results
                if (kytResult.success && kytResult.riskScore !== undefined) {
                    await supabase
                        .from('wallets')
                        .update({
                            aml_risk_score: kytResult.riskScore,
                            aml_status: kytResult.severity || 'clear',
                            aml_monitoring_enabled: kytResult.monitoringEnabled || false,
                            aml_monitoring_uid: kytResult.uid || null,
                            aml_last_checked: new Date().toISOString(),
                        })
                        .eq('id', wallet.id);

                    // Insert screening record
                    await supabase.from('aml_screenings').insert({
                        wallet_id: wallet.id,
                        address: turnkeyResult.address,
                        network: networkLower,
                        risk_score: kytResult.riskScore,
                        risk_signals: kytResult.signals || {},
                        is_blacklisted: kytResult.isBlacklisted || false,
                        amlbot_uid: kytResult.uid,
                        check_type: 'onboarding',
                    });
                }
            } catch (kytError) {
                console.error('[Wallets API] KYT screening error:', kytError);
                // Non-fatal error, wallet was still created
            }
        }

        console.log(`[Wallets API] ✅ Wallet created successfully: ${wallet?.id}`);

        return NextResponse.json(
            {
                success: true,
                wallet: {
                    ...wallet,
                    turnkeyWalletId: turnkeyResult.walletId,
                },
                kyt: kytResult,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('[Wallets API] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}
