/**
 * Turnkey Transaction Signing Service
 *
 * Handles transaction signing for all supported networks:
 * - Ethereum (EVM)
 * - Solana (SVM)
 * - Tron
 *
 * This module extends the base Turnkey integration with signing capabilities.
 */

import { Turnkey } from '@turnkey/sdk-server';

// =====================================================
// CONFIGURATION
// =====================================================

const DEV_MODE = process.env.TURNKEY_DEV_MODE === 'true';

type NetworkType = 'Tron' | 'Solana' | 'Ethereum';

interface NetworkConfig {
    curve: 'CURVE_SECP256K1' | 'CURVE_ED25519';
    addressFormat: string;
    path: string;
    transactionType: string;
}

const NETWORK_CONFIGS: Record<NetworkType, NetworkConfig> = {
    Tron: {
        curve: 'CURVE_SECP256K1',
        addressFormat: 'ADDRESS_FORMAT_TRON',
        path: "m/44'/195'/0'/0/0",
        transactionType: 'TRANSACTION_TYPE_TRON',
    },
    Solana: {
        curve: 'CURVE_ED25519',
        addressFormat: 'ADDRESS_FORMAT_SOLANA',
        path: "m/44'/501'/0'/0'",
        transactionType: 'TRANSACTION_TYPE_SOLANA',
    },
    Ethereum: {
        curve: 'CURVE_SECP256K1',
        addressFormat: 'ADDRESS_FORMAT_ETHEREUM',
        path: "m/44'/60'/0'/0/0",
        transactionType: 'TRANSACTION_TYPE_ETHEREUM',
    },
};

// =====================================================
// TYPES
// =====================================================

export interface SignTransactionResult {
    signedTransaction: string;
    signature: string;
}

export interface CreateWalletResult {
    walletId: string;
    address: string;
    network: NetworkType;
}

// =====================================================
// TURNKEY CLIENT
// =====================================================

let turnkeyClient: Turnkey | null = null;

function getOrganizationId(): string {
    const orgId = process.env.TURNKEY_ORGANIZATION_ID;
    if (!orgId) throw new Error('TURNKEY_ORGANIZATION_ID not configured');
    return orgId;
}

function getApiPublicKey(): string {
    const key = process.env.TURNKEY_API_PUBLIC_KEY;
    if (!key) throw new Error('TURNKEY_API_PUBLIC_KEY not configured');
    return key;
}

function getApiPrivateKey(): string {
    const key = process.env.TURNKEY_API_PRIVATE_KEY;
    if (!key) throw new Error('TURNKEY_API_PRIVATE_KEY not configured');
    return key;
}

function getTurnkeyClient(): Turnkey {
    if (!turnkeyClient) {
        const orgId = getOrganizationId();
        const publicKey = getApiPublicKey();
        const privateKey = getApiPrivateKey();

        turnkeyClient = new Turnkey({
            apiBaseUrl: process.env.TURNKEY_BASE_URL || 'https://api.turnkey.com',
            apiPublicKey: publicKey,
            apiPrivateKey: privateKey,
            defaultOrganizationId: orgId,
        });
    }
    return turnkeyClient;
}

export function isTurnkeyConfigured(): boolean {
    try {
        getOrganizationId();
        getApiPublicKey();
        getApiPrivateKey();
        return true;
    } catch {
        return DEV_MODE; // In dev mode, we're "configured" with mocks
    }
}

export function getTurnkeyOrganizationId(): string {
    return getOrganizationId();
}

export function getNetworkConfig(network: NetworkType): NetworkConfig {
    return NETWORK_CONFIGS[network];
}

export function getSupportedNetworks(): NetworkType[] {
    return Object.keys(NETWORK_CONFIGS) as NetworkType[];
}

export function isValidNetwork(network: string): network is NetworkType {
    return network in NETWORK_CONFIGS;
}

// =====================================================
// WALLET CREATION
// =====================================================

/**
 * Create a master wallet for a specific network
 */
export async function createMasterWallet(
    walletName: string,
    network: NetworkType
): Promise<CreateWalletResult> {
    const config = NETWORK_CONFIGS[network];

    if (!config) {
        throw new Error(`Unsupported network: ${network}. Supported: ${getSupportedNetworks().join(', ')}`);
    }

    // Dev mode - return mock wallet
    if (DEV_MODE) {
        console.log(`[Turnkey] 🔧 DEV MODE: Creating mock ${network} wallet`);
        const mockAddress = generateMockAddress(network);
        return {
            walletId: `mock-${network.toLowerCase()}-${Date.now()}`,
            address: mockAddress,
            network,
        };
    }

    console.log(`[Turnkey] Creating ${network} wallet: ${walletName}`);

    const client = getTurnkeyClient();

    try {
        const response = await client.apiClient().createWallet({
            walletName: walletName,
            accounts: [
                {
                    curve: config.curve,
                    pathFormat: 'PATH_FORMAT_BIP32',
                    path: config.path,
                    addressFormat: config.addressFormat as any,
                },
            ],
            mnemonicLength: 12,
        });

        const result = response.activity?.result?.createWalletResult;

        if (!result?.walletId || !result?.addresses?.[0]) {
            console.error('[Turnkey] Unexpected response:', JSON.stringify(response, null, 2));
            throw new Error('Failed to create wallet: Invalid response from Turnkey');
        }

        console.log(`[Turnkey] ✅ Wallet created: ${result.walletId}`);

        return {
            walletId: result.walletId,
            address: result.addresses[0],
            network,
        };
    } catch (error) {
        console.error('[Turnkey] Error creating wallet:', error);
        throw error;
    }
}

function generateMockAddress(network: NetworkType): string {
    const randomHex = () => Math.random().toString(16).substring(2, 10);

    switch (network) {
        case 'Ethereum':
            return `0x${randomHex()}${randomHex()}${randomHex()}${randomHex()}${randomHex()}`;
        case 'Solana':
            return `${randomHex()}${randomHex()}${randomHex()}${randomHex()}${randomHex()}`.substring(0, 44);
        case 'Tron':
            return `T${randomHex()}${randomHex()}${randomHex()}${randomHex()}`.substring(0, 34);
        default:
            return `0x${randomHex()}${randomHex()}${randomHex()}${randomHex()}${randomHex()}`;
    }
}

// =====================================================
// TRANSACTION SIGNING
// =====================================================

/**
 * Sign a transaction using Turnkey
 */
export async function signTransaction(
    walletAddress: string,
    unsignedTransaction: string,
    network: NetworkType,
    txId?: string
): Promise<SignTransactionResult> {
    const config = NETWORK_CONFIGS[network];

    if (!config) {
        throw new Error(`Unsupported network: ${network}`);
    }

    // Dev mode - return mock signature
    if (DEV_MODE) {
        console.log(`[Turnkey] 🔧 DEV MODE: Mock signing ${network} transaction`);
        const mockSignature = `mock-sig-${Date.now()}-${Math.random().toString(16).substring(2)}`;
        return {
            signedTransaction: unsignedTransaction,
            signature: mockSignature,
        };
    }

    console.log(`[Turnkey] Signing ${network} transaction for wallet: ${walletAddress}`);

    const client = getTurnkeyClient();

    try {
        // Tron uses signRawPayload for transaction hash signing
        if (network === 'Tron' && txId) {
            console.log(`[Turnkey] Using signRawPayload for Tron transaction hash: ${txId}`);

            const response = await client.apiClient().signRawPayload({
                signWith: walletAddress,
                payload: txId, // txId is the SHA256 hash of raw_data (already hex encoded)
                encoding: 'PAYLOAD_ENCODING_HEXADECIMAL',
                hashFunction: 'HASH_FUNCTION_NO_OP', // txId is already hashed
            });

            const result = response.activity?.result?.signRawPayloadResult;

            if (!result?.r || !result?.s || result?.v === undefined) {
                console.error('[Turnkey] Unexpected signRawPayload response:', JSON.stringify(response, null, 2));
                throw new Error('Failed to sign transaction: Invalid response from Turnkey');
            }

            // Tron signature format: r (32 bytes) + s (32 bytes) + v (1 byte)
            const r = result.r.padStart(64, '0');
            const s = result.s.padStart(64, '0');
            let vValue = parseInt(result.v, 16);
            if (vValue < 27) {
                vValue += 27; // Convert 0/1 to 27/28
            }
            const v = vValue.toString(16).padStart(2, '0');

            const signature = r + s + v;

            console.log(`[Turnkey] Tron signature generated: r=${r.substring(0, 8)}..., s=${s.substring(0, 8)}..., v=${v}`);

            return {
                signedTransaction: signature,
                signature: signature,
            };
        }

        // Solana - convert base64 to hex for Turnkey
        let transactionPayload = unsignedTransaction;

        if (network === 'Solana') {
            try {
                const txBuffer = Buffer.from(unsignedTransaction, 'base64');
                transactionPayload = txBuffer.toString('hex');
                console.log(`[Turnkey] Converted Solana transaction from base64 to hex (${transactionPayload.length} chars)`);
            } catch (e) {
                console.error('[Turnkey] Failed to convert Solana transaction encoding:', e);
                throw new Error('Invalid Solana transaction format');
            }
        }

        // Standard transaction signing for Solana and Ethereum
        const response = await client.apiClient().signTransaction({
            signWith: walletAddress,
            unsignedTransaction: transactionPayload,
            type: config.transactionType as any,
        });

        const result = response.activity?.result?.signTransactionResult;

        if (!result?.signedTransaction) {
            console.error('[Turnkey] Unexpected sign response:', JSON.stringify(response, null, 2));
            throw new Error('Failed to sign transaction: Invalid response from Turnkey');
        }

        console.log(`[Turnkey] Transaction signed successfully`);

        // Solana - convert signed transaction back from hex to base64
        let signedTx = result.signedTransaction;
        if (network === 'Solana') {
            try {
                const signedBuffer = Buffer.from(result.signedTransaction, 'hex');
                signedTx = signedBuffer.toString('base64');
                console.log(`[Turnkey] Converted signed Solana transaction from hex to base64`);
            } catch (e) {
                console.error('[Turnkey] Failed to convert signed Solana transaction:', e);
                throw new Error('Failed to decode signed Solana transaction');
            }
        }

        return {
            signedTransaction: signedTx,
            signature: signedTx,
        };
    } catch (error) {
        console.error('[Turnkey] Error signing transaction:', error);
        throw error;
    }
}

// =====================================================
// WALLET INFO
// =====================================================

/**
 * Get wallet information by ID
 */
export async function getWalletInfo(walletId: string): Promise<{ walletId: string; walletName: string }> {
    if (DEV_MODE) {
        return { walletId, walletName: `mock-wallet-${walletId}` };
    }

    const client = getTurnkeyClient();

    try {
        const response = await client.apiClient().getWallet({
            walletId: walletId,
        });

        return {
            walletId: response.wallet?.walletId || walletId,
            walletName: response.wallet?.walletName || '',
        };
    } catch (error) {
        console.error('[Turnkey] Error getting wallet info:', error);
        throw error;
    }
}

/**
 * Get all wallets from Turnkey organization
 */
export async function listTurnkeyWallets(): Promise<Array<{ walletId: string; walletName: string }>> {
    if (DEV_MODE) {
        return [];
    }

    const client = getTurnkeyClient();

    try {
        const response = await client.apiClient().getWallets({});

        return (response.wallets || []).map(w => ({
            walletId: w.walletId || '',
            walletName: w.walletName || '',
        }));
    } catch (error) {
        console.error('[Turnkey] Error listing wallets:', error);
        throw error;
    }
}

// =====================================================
// POLICIES
// =====================================================

export type TurnkeyPolicyEffect = 'EFFECT_ALLOW' | 'EFFECT_DENY';

export interface TurnkeyPolicyParams {
    policyName: string;
    effect: TurnkeyPolicyEffect;
    consensus: string;
    condition: string;
    notes?: string;
}

/**
 * Create a policy in Turnkey
 */
export async function createTurnkeyPolicy(params: TurnkeyPolicyParams): Promise<{
    policyId: string;
    success: boolean;
}> {
    if (DEV_MODE) {
        console.log(`[Turnkey] 🔧 DEV MODE: Mock creating policy: ${params.policyName}`);
        return { policyId: `mock-policy-${Date.now()}`, success: true };
    }

    const client = getTurnkeyClient();

    console.log(`[Turnkey] Creating policy: ${params.policyName}`);

    try {
        const response = await client.apiClient().createPolicy({
            policyName: params.policyName,
            effect: params.effect,
            consensus: params.consensus,
            condition: params.condition,
            notes: params.notes,
        });

        const result = response.activity?.result?.createPolicyResult;

        if (!result?.policyId) {
            console.error('[Turnkey] Unexpected policy creation response:', JSON.stringify(response, null, 2));
            throw new Error('Failed to create policy: Invalid response from Turnkey');
        }

        console.log(`[Turnkey] ✅ Policy created: ${result.policyId}`);

        return {
            policyId: result.policyId,
            success: true,
        };
    } catch (error) {
        console.error('[Turnkey] Error creating policy:', error);
        throw error;
    }
}

/**
 * Delete a policy from Turnkey
 */
export async function deleteTurnkeyPolicy(policyId: string): Promise<boolean> {
    if (DEV_MODE) {
        console.log(`[Turnkey] 🔧 DEV MODE: Mock deleting policy: ${policyId}`);
        return true;
    }

    const client = getTurnkeyClient();

    console.log(`[Turnkey] Deleting policy: ${policyId}`);

    try {
        await client.apiClient().deletePolicy({
            policyId: policyId,
        });

        console.log(`[Turnkey] ✅ Policy deleted: ${policyId}`);
        return true;
    } catch (error) {
        console.error('[Turnkey] Error deleting policy:', error);
        throw error;
    }
}

/**
 * Get all policies from Turnkey
 */
export async function getTurnkeyPolicies(): Promise<Array<{ policyId: string; policyName: string }>> {
    if (DEV_MODE) {
        return [];
    }

    const client = getTurnkeyClient();

    try {
        const response = await client.apiClient().getPolicies({
            organizationId: getOrganizationId(),
        });

        return (response.policies || []).map(p => ({
            policyId: p.policyId,
            policyName: p.policyName,
        }));
    } catch (error) {
        console.error('[Turnkey] Error getting policies:', error);
        throw error;
    }
}
