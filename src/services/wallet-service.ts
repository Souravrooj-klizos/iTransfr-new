import { createAdminClient } from '@/lib/supabase/server';
import { createMasterWallet } from '@/lib/integrations/turnkey-signing';
import { screenAndMonitor } from '@/lib/integrations/amlbot-kyt';

type Network = 'ethereum' | 'solana' | 'tron';

interface CreateClientWalletParams {
    clientId: string;
    network: string; // 'ethereum', 'solana', 'tron'
    label?: string;
    isPrimary?: boolean;
    enableKytMonitoring?: boolean;
}

export async function createClientWallet({
    clientId,
    network,
    label,
    isPrimary = true,
    enableKytMonitoring = true,
}: CreateClientWalletParams) {
    const supabase = createAdminClient();

    // 1. Get client details for naming
    const { data: client, error: clientError } = await supabase
        .from('client_profiles')
        .select('id, company_name, first_name, last_name')
        .eq('id', clientId)
        .single();

    if (clientError || !client) {
        throw new Error(`Client not found: ${clientId}`);
    }

    // 2. Validate/Normalize network
    const networkLower = (network || 'solana').toLowerCase() as Network;
    const networkMap: Record<string, 'Ethereum' | 'Solana' | 'Tron'> = {
        ethereum: 'Ethereum',
        solana: 'Solana',
        tron: 'Tron',
    };

    const turnkeyNetwork = networkMap[networkLower];
    if (!turnkeyNetwork) {
        throw new Error(`Invalid network: ${network}. Supported: ${Object.keys(networkMap).join(', ')}`);
    }

    // 3. Generate Wallet Name
    const clientName = client.company_name || `${client.first_name} ${client.last_name}`;
    const walletName = label || `${clientName} - ${turnkeyNetwork}`;

    console.log(`[WalletService] Creating ${turnkeyNetwork} wallet for client ${clientId}`);

    // 4. Create Wallet via Turnkey
    // Note: createMasterWallet creates a wallet in Turnkey. For clients, we effectively treat them as sub-wallets 
    // or use the same mechanism but label them differently in our DB.
    const turnkeyResult = await createMasterWallet(walletName, turnkeyNetwork);

    console.log(`[WalletService] Turnkey wallet created: ${turnkeyResult.walletId}`);

    const currencyMap: Record<string, string> = {
        ethereum: 'ETH',
        solana: 'SOL',
        tron: 'TRX',
    };
    const currencySymbol = currencyMap[networkLower] || 'MULTI';

    // 5. Insert Wallet into Database
    const { data: wallet, error: insertError } = await supabase
        .from('wallets')
        .insert({
            userId: clientId,
            currency: currencySymbol,
            network: networkLower,
            address: turnkeyResult.address,
            wallet_type: 'client',
            label: walletName,
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
        console.error('[WalletService] Error inserting wallet:', insertError);
        throw new Error(`Failed to save wallet to database: ${insertError.message}`);
    }

    // 6. Create Client-Wallet Link
    const { error: linkError } = await supabase.from('client_wallet_links').insert({
        client_id: clientId,
        wallet_id: wallet.id,
        is_primary: isPrimary,
    });

    if (linkError) {
        console.error('[WalletService] Error creating wallet link:', linkError);
        // Don't throw here, the wallet is created. Just log it.
    }

    // 7. Perform KYT Screening
    let kytResult = null;
    if (enableKytMonitoring) {
        try {
            console.log(`[WalletService] Running KYT screening for ${turnkeyResult.address}`);
            kytResult = await screenAndMonitor(turnkeyResult.address, networkLower, true);

            if (kytResult.success && kytResult.riskScore !== undefined) {
                // Update wallet with risk info
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

                // Log screening
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
            console.error('[WalletService] KYT error:', kytError);
            // Non-blocking
        }
    }

    return {
        wallet: {
            ...wallet,
            turnkeyInfo: turnkeyResult,
        },
        kyt: kytResult,
    };
}
