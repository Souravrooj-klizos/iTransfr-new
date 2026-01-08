/**
 * AMLBot KYT (Know Your Transaction) Service
 *
 * This service handles wallet address screening and monitoring
 * using the AMLBot KYT API (separate from document verification KYC).
 *
 * Features:
 * - Address risk scoring
 * - Continuous monitoring subscription
 * - Webhook handling for risk alerts
 * - Multi-network support (Ethereum, Solana, Tron, etc.)
 */

import crypto from 'crypto';
import { isMockModeEnabled, logMockWarning, getMockScreenResult } from './amlbot-kyt-mock';

// =====================================================
// CONFIGURATION
// =====================================================

const AMLBOT_KYT_API_URL = 'https://extrnlapiendpoint.silencatech.com';
const ACCESS_ID = process.env.AMLBOT_KYT_ACCESS_ID || '';
const ACCESS_KEY = process.env.AMLBOT_KYT_ACCESS_KEY || '';

// Risk thresholds
export const ALERT_THRESHOLD = 35; // Warning when risk exceeds 35%
export const CRITICAL_THRESHOLD = 47; // Critical when risk exceeds 47%

// Network mapping for AMLBot API
export const NETWORK_TO_ASSET: Record<string, string> = {
    ethereum: 'ETH',
    solana: 'SOL',
    tron: 'TRX',
    polygon: 'MATIC',
    stellar: 'XLM',
    bitcoin: 'BTC',
    bsc: 'BSC',
    arbitrum: 'ARB',
    base: 'BASE',
    optimism: 'OP',
};

const KYT_HEADERS = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Cache-Control': 'no-cache'
};

// =====================================================
// TYPES
// =====================================================

export interface KYTCheckResponse {
    result: boolean;
    balance?: number;
    amlFlow?: string;
    data?: {
        riskscore: number;
        signals: Record<string, number>;
        updated_at: number;
        address: string;
        blackListsConnections: boolean;
        hasBlackListFlag: boolean;
        pdfReport: string;
        network: string;
        status: number;
        counterparty?: {
            address: string;
            signals?: {
                in?: Record<string, number>;
                out?: Record<string, number>;
            };
        };
    };
    uid?: string;
    status?: string;
}

export interface KYTScreenResult {
    success: boolean;
    status?: 'pending' | 'success' | 'error';
    riskScore?: number;
    signals?: Record<string, number>;
    isBlacklisted?: boolean;
    uid?: string;
    error?: string;
    rawResponse?: KYTCheckResponse;
}

export interface KYTMonitoringResult {
    success: boolean;
    error?: string;
    rawResponse?: any;
}

export type RiskSeverity = 'clear' | 'warning' | 'critical' | 'blacklisted';

export type SupportedNetwork =
    | 'ethereum'
    | 'solana'
    | 'tron'
    | 'polygon'
    | 'bitcoin'
    | 'bsc'
    | 'arbitrum';

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function generateToken(hash: string): string {
    const tokenString = `${hash}:${ACCESS_KEY}:${ACCESS_ID}`;
    return crypto.createHash('md5').update(tokenString).digest('hex');
}

function generateMonitoringToken(nonce: string): string {
    const tokenString = `${nonce}:${ACCESS_KEY}:${ACCESS_ID}`;
    return crypto.createHash('md5').update(tokenString).digest('hex');
}

function generateUidToken(uid: string): string {
    const tokenString = `${uid}:${ACCESS_KEY}:${ACCESS_ID}`;
    return crypto.createHash('md5').update(tokenString).digest('hex');
}

/**
 * Validate KYT configuration
 */
export function validateKYTConfig(): { valid: boolean; missing: string[] } {
    const missing: string[] = [];
    if (!ACCESS_ID) missing.push('AMLBOT_KYT_ACCESS_ID');
    if (!ACCESS_KEY) missing.push('AMLBOT_KYT_ACCESS_KEY');
    return { valid: missing.length === 0, missing };
}

/**
 * Determine risk severity based on score and blacklist status
 */
export function determineRiskSeverity(riskScore: number, isBlacklisted: boolean = false): RiskSeverity {
    if (isBlacklisted) return 'blacklisted';
    if (riskScore >= CRITICAL_THRESHOLD) return 'critical';
    if (riskScore >= ALERT_THRESHOLD) return 'warning';
    return 'clear';
}

/**
 * Get top risk signals sorted by value
 */
export function getTopRiskSignals(
    signals: Record<string, number>,
    limit: number = 5
): Array<{ name: string; value: number }> {
    return Object.entries(signals)
        .filter(([_, value]) => value > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([name, value]) => ({ name, value: value * 100 }));
}

/**
 * Convert network name to AMLBot asset code
 */
export function networkToAsset(network: string): string {
    return NETWORK_TO_ASSET[network.toLowerCase()] || network.toUpperCase();
}

// =====================================================
// API FUNCTIONS
// =====================================================

/**
 * Screen a wallet address for AML risk
 * @param address - Wallet address to screen
 * @param network - Blockchain network (ethereum, solana, tron, etc.)
 * @param flow - Screening flow type (fast, advanced, instant)
 */
export async function screenAddress(
    address: string,
    network: string,
    flow: 'fast' | 'advanced' | 'instant' = 'fast'
): Promise<KYTScreenResult> {
    const config = validateKYTConfig();

    // Handle mock mode
    if (isMockModeEnabled()) {
        logMockWarning('Screening Address');
        const mockResult = getMockScreenResult(address);
        return {
            success: mockResult.success,
            status: 'success',
            riskScore: mockResult.riskScore,
            signals: mockResult.signals,
            isBlacklisted: mockResult.isBlacklisted,
            uid: mockResult.uid,
            rawResponse: { result: true, uid: mockResult.uid, data: { riskscore: mockResult.riskScore / 100 } } as any
        };
    }

    if (!config.valid) {
        console.error('[KYT] Configuration missing:', config.missing);
        return { success: false, error: `KYT credentials not configured: ${config.missing.join(', ')}` };
    }

    const asset = networkToAsset(network);
    const token = generateToken(address);

    try {
        const params = new URLSearchParams({
            accessId: ACCESS_ID,
            hash: address,
            asset: asset,
            token: token,
            flow: flow,
            locale: 'en_US',
        });

        console.log(`[KYT] Screening address: ${address} on ${network} (asset: ${asset})`);

        const response = await fetch(AMLBOT_KYT_API_URL, {
            method: 'POST',
            headers: KYT_HEADERS,
            body: params.toString(),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[KYT] API error ${response.status}: ${errorText}`);
            return { success: false, error: `API error: ${response.status}`, rawResponse: { errorText } as any };
        }

        const data: KYTCheckResponse = await response.json();
        // Handle successful result
        if (!data.result) {
            return { success: false, error: 'KYT check failed', rawResponse: data };
        }

        // Handle pending status (result not ready yet)
        if (data.status === 'pending' && data.uid) {
            return {
                success: true,
                status: 'pending',
                uid: data.uid,
                rawResponse: data,
            };
        }

        if (data.data) {
            // Safely parse riskScore, defaulting to 0 if missing/invalid
            const rawScore = data.data.riskscore;
            const riskScore = (typeof rawScore === 'number') ? rawScore * 100 : 0;

            // Ensure UID is captured (try root, then data.uid just in case)
            const uid = data.uid || (data.data as any).uid;

            if (!uid) {
                console.warn('[KYT] Warning: UID missing in response:', JSON.stringify(data));
            }

            return {
                success: true,
                status: 'success',
                riskScore,
                signals: data.data.signals || {},
                isBlacklisted: data.data.hasBlackListFlag || data.data.blackListsConnections || false,
                uid: uid,
                rawResponse: data,
            };
        }

        return { success: false, error: 'Unexpected response format', rawResponse: data };
    } catch (error) {
        console.error('[KYT] Screen address error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Recheck a previously screened address by UID
 * @param uid - The UID from previous screening
 */
export async function recheckAddress(uid: string): Promise<KYTScreenResult> {
    const config = validateKYTConfig();

    // Handle mock mode
    if (isMockModeEnabled()) {
        logMockWarning('Rechecking UID');
        // Just return a standard mock success for recheck
        return {
            success: true,
            status: 'success',
            riskScore: 10.5,
            signals: { exchange: 5.0 },
            isBlacklisted: false,
            uid: uid,
            rawResponse: { result: true, uid: uid, data: { riskscore: 0.105 } } as any
        };
    }

    if (!config.valid) {
        return { success: false, error: 'KYT credentials not configured' };
    }

    const token = generateUidToken(uid);

    try {
        const params = new URLSearchParams({
            accessId: ACCESS_ID,
            uid: uid,
            token: token,
        });

        console.log(`[KYT] Rechecking UID: ${uid}`);

        const response = await fetch(`${AMLBOT_KYT_API_URL}/recheck`, {
            method: 'POST',
            headers: KYT_HEADERS,
            body: params.toString(),
        });

        if (!response.ok) {
            return { success: false, error: `API error: ${response.status}` };
        }

        const data = await response.json();

        if (!data.result) {
            return { success: false, error: 'Recheck failed', rawResponse: data };
        }

        if (data.status === 'pending') {
            return { success: true, status: 'pending', rawResponse: data };
        }

        if (data.data) {
            return {
                success: true,
                status: 'success',
                riskScore: data.data.riskscore * 100,
                signals: data.data.signals,
                isBlacklisted: data.data.hasBlackListFlag || data.data.blackListsConnections,
                rawResponse: data,
            };
        }

        return { success: false, error: 'Unexpected response format', rawResponse: data };
    } catch (error) {
        console.error('[KYT] Recheck error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Subscribe an address to continuous monitoring
 * @param uid - The UID from screening
 */
export async function subscribeToMonitoring(uid: string): Promise<KYTMonitoringResult> {
    const config = validateKYTConfig();

    // Handle mock mode
    if (isMockModeEnabled()) {
        logMockWarning('Subscribing to Monitoring');
        return { success: true, rawResponse: { result: true, uid } };
    }

    if (!config.valid) {
        return { success: false, error: 'KYT credentials not configured' };
    }

    const nonce = Date.now().toString();
    const token = generateMonitoringToken(nonce);

    try {
        const params = new URLSearchParams({
            accessId: ACCESS_ID,
            uid: uid,
            nonce: nonce,
            token: token,
        });

        console.log(`[KYT] Subscribing to monitoring for UID: ${uid}`);

        const response = await fetch(`${AMLBOT_KYT_API_URL}/monitoring/subscribe`, {
            method: 'POST',
            headers: KYT_HEADERS,
            body: params.toString(),
        });

        if (!response.ok) {
            return { success: false, error: `API error: ${response.status}` };
        }

        const data = await response.json();

        if (!data.result) {
            return { success: false, error: 'Failed to subscribe to monitoring', rawResponse: data };
        }

        console.log(`[KYT] Successfully subscribed UID ${uid} to monitoring`);
        return { success: true, rawResponse: data };
    } catch (error) {
        console.error('[KYT] Subscribe to monitoring error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Unsubscribe an address from monitoring
 * @param uid - The monitoring UID
 */
export async function unsubscribeFromMonitoring(uid: string): Promise<KYTMonitoringResult> {
    const config = validateKYTConfig();

    // Handle mock mode
    if (isMockModeEnabled()) {
        logMockWarning('Unsubscribing from Monitoring');
        return { success: true, rawResponse: { result: true, uid } };
    }

    if (!config.valid) {
        return { success: false, error: 'KYT credentials not configured' };
    }

    const nonce = Date.now().toString();
    const token = generateMonitoringToken(nonce);

    try {
        const params = new URLSearchParams({
            accessId: ACCESS_ID,
            uid: uid,
            nonce: nonce,
            token: token,
        });

        console.log(`[KYT] Unsubscribing from monitoring for UID: ${uid}`);

        const response = await fetch(`${AMLBOT_KYT_API_URL}/monitoring/unsubscribe`, {
            method: 'POST',
            headers: KYT_HEADERS,
            body: params.toString(),
        });

        if (!response.ok) {
            return { success: false, error: `API error: ${response.status}` };
        }

        const data = await response.json();

        if (!data.result) {
            return { success: false, error: 'Failed to unsubscribe from monitoring', rawResponse: data };
        }

        console.log(`[KYT] Successfully unsubscribed UID ${uid} from monitoring`);
        return { success: true, rawResponse: data };
    } catch (error) {
        console.error('[KYT] Unsubscribe from monitoring error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Set webhook URL for monitoring notifications
 * @param webhookUrl - The URL to receive monitoring updates
 */
export async function setWebhookUrl(webhookUrl: string): Promise<{
    success: boolean;
    webhookUrl?: string;
    error?: string;
}> {
    const config = validateKYTConfig();

    // Handle mock mode
    if (isMockModeEnabled()) {
        logMockWarning('Setting Webhook URL');
        return { success: true, webhookUrl };
    }

    if (!config.valid) {
        return { success: false, error: 'KYT credentials not configured' };
    }

    const nonce = Date.now().toString();
    const token = generateMonitoringToken(nonce);

    try {
        const params = new URLSearchParams({
            accessId: ACCESS_ID,
            url: webhookUrl,
            nonce: nonce,
            token: token,
        });

        console.log(`[KYT] Setting webhook URL to: ${webhookUrl}`);

        const response = await fetch(`${AMLBOT_KYT_API_URL}/setwebhook`, {
            method: 'POST',
            headers: KYT_HEADERS,
            body: params.toString(),
        });

        if (!response.ok) {
            return { success: false, error: `API error: ${response.status}` };
        }

        const data = await response.json();

        if (!data.result) {
            return { success: false, error: 'Failed to set webhook URL' };
        }

        console.log(`[KYT] Webhook URL set successfully`);
        return { success: true, webhookUrl: data.webhookUrl };
    } catch (error) {
        console.error('[KYT] Set webhook error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Verify webhook signature from AMLBot
 * @param payload - The webhook payload
 * @param check - The HMAC check value
 * @param tonce - The timestamp from webhook
 */
export function verifyWebhookSignature(payload: any, check: string, tonce: string): boolean {
    if (!ACCESS_KEY) return false;

    // Verify timestamp is within 5 second window
    const currentTime = Math.floor(Date.now() / 1000);
    const webhookTime = parseInt(tonce, 10);
    if (Math.abs(currentTime - webhookTime) > 5) {
        console.warn('[KYT Webhook] Timestamp outside 5 second window');
        return false;
    }

    // Verify HMAC signature
    const dataToSign = JSON.stringify({ tonce, payload });
    const expectedCheck = crypto.createHmac('sha256', ACCESS_KEY).update(dataToSign).digest('hex');

    return check === expectedCheck;
}

/**
 * Parse webhook payload and extract relevant data
 */
export function parseWebhookPayload(payload: any): {
    address: string;
    network: string;
    riskScore: number;
    previousRiskScore?: number;
    signals: Record<string, number>;
    isBlacklisted: boolean;
    uid: string;
} | null {
    try {
        if (!payload || !payload.data) {
            return null;
        }

        const data = payload.data;
        return {
            address: data.address || '',
            network: data.network || '',
            riskScore: (data.riskscore || 0) * 100,
            previousRiskScore: data.previous_riskscore ? data.previous_riskscore * 100 : undefined,
            signals: data.signals || {},
            isBlacklisted: data.hasBlackListFlag || data.blackListsConnections || false,
            uid: payload.uid || '',
        };
    } catch (error) {
        console.error('[KYT] Error parsing webhook payload:', error);
        return null;
    }
}

// =====================================================
// CONVENIENCE FUNCTIONS
// =====================================================

/**
 * Screen address and optionally enable monitoring
 * One-stop function for wallet onboarding
 */
export async function screenAndMonitor(
    address: string,
    network: string,
    enableMonitoring: boolean = true
): Promise<{
    success: boolean;
    riskScore?: number;
    severity?: RiskSeverity;
    signals?: Record<string, number>;
    isBlacklisted?: boolean;
    monitoringEnabled?: boolean;
    uid?: string;
    error?: string;
}> {
    // First, screen the address
    const screenResult = await screenAddress(address, network, 'fast');

    if (!screenResult.success) {
        return { success: false, error: screenResult.error };
    }

    // If pending, we can't enable monitoring yet
    if (screenResult.status === 'pending') {
        return {
            success: true,
            uid: screenResult.uid,
            error: 'Screening in progress, monitoring will need to be enabled after screening completes',
        };
    }

    const severity = determineRiskSeverity(screenResult.riskScore || 0, screenResult.isBlacklisted);

    // Enable monitoring if requested and we have a UID
    let monitoringEnabled = false;
    if (enableMonitoring && screenResult.uid) {
        const monitorResult = await subscribeToMonitoring(screenResult.uid);
        monitoringEnabled = monitorResult.success;
    }

    return {
        success: true,
        riskScore: screenResult.riskScore,
        severity,
        signals: screenResult.signals,
        isBlacklisted: screenResult.isBlacklisted,
        monitoringEnabled,
        uid: screenResult.uid,
    };
}
