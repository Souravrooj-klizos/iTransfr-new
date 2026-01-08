/**
 * Mock AMLBot KYT responses for testing
 * USE ONLY WHEN AMLBOT API IS BLOCKED BY CLOUDFLARE
 * 
 * To enable: Set p in .env.local
 */

interface MockScreenResult {
    success: boolean;
    riskScore: number;
    severity: 'clear' | 'low' | 'medium' | 'high' | 'critical';
    signals: Record<string, number>;
    isBlacklisted: boolean;
    uid: string;
}

const MOCK_RESPONSES: Record<string, MockScreenResult> = {
    // Clean address (low risk)
    'DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy': {
        success: true,
        riskScore: 8.5,
        severity: 'low',
        signals: { exchange: 5.2, defi: 3.3 },
        isBlacklisted: false,
        uid: 'mock-uid-clean-solana'
    },

    // Medium risk address
    '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb': {
        success: true,
        riskScore: 28.7,
        severity: 'medium',
        signals: { gambling: 15.2, mixer: 13.5 },
        isBlacklisted: false,
        uid: 'mock-uid-medium-eth'
    },

    // High risk address
    'TGzz8gjYiYRqpfmDwnLxfgPuLVNmpCswVp': {
        success: true,
        riskScore: 42.1,
        severity: 'high',
        signals: { darkweb: 25.0, sanctions: 17.1 },
        isBlacklisted: false,
        uid: 'mock-uid-high-tron'
    },

    // Blacklisted address
    'BLACKLISTED_TEST_ADDRESS': {
        success: true,
        riskScore: 95.0,
        severity: 'critical',
        signals: {
            sanctions: 50.0,
            darkweb: 30.0,
            ransomware: 15.0
        },
        isBlacklisted: true,
        uid: 'mock-uid-blacklisted'
    }
};

export function getMockScreenResult(address: string): MockScreenResult {
    // Check if exact address match exists
    if (MOCK_RESPONSES[address]) {
        return MOCK_RESPONSES[address];
    }

    // Default: safe address
    return {
        success: true,
        riskScore: Math.random() * 20, // Random 0-20% (low risk)
        severity: 'low',
        signals: {
            exchange: Math.random() * 10,
            defi: Math.random() * 5
        },
        isBlacklisted: false,
        uid: `mock-uid-${Date.now()}`
    };
}

export function isMockModeEnabled(): boolean {
    return process.env.AMLBOT_MOCK_MODE === 'true';
}

export function logMockWarning(action: string): void {
    console.warn(`
┌─────────────────────────────────────────────┐
│  ⚠️  AMLBOT MOCK MODE ACTIVE                │
│                                             │
│  Action: ${action.padEnd(36)} │
│  Reason: Cloudflare 403 blocking API       │
│  Status: Using mock responses              │
│                                             │
│  This is FOR TESTING ONLY!                 │
│  Contact AMLBot to whitelist your IP       │
└─────────────────────────────────────────────┘
    `);
}
