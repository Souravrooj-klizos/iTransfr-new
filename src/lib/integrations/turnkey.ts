/**
 * Turnkey API Client
 *
 * Turnkey for secure wallet management and key storage.
 * Creates multi-chain wallets (Ethereum, Solana, Tron).
 *
 * Uses official @turnkey/sdk-server package for proper authentication.
 *
 * Set TURNKEY_DEV_MODE=true in .env to use mock wallets for development.
 */

import { Turnkey } from '@turnkey/sdk-server';
import crypto from 'crypto';

// =====================================================
// CONFIGURATION
// =====================================================

// Development mode - uses mock addresses when Turnkey isn't configured
const DEV_MODE = process.env.TURNKEY_DEV_MODE === 'true';

function getOrganizationId(): string {
  const orgId = process.env.TURNKEY_ORGANIZATION_ID;
  if (!orgId) {
    throw new Error('TURNKEY_ORGANIZATION_ID environment variable is not set');
  }
  return orgId;
}

function getApiPublicKey(): string {
  const publicKey = process.env.TURNKEY_API_PUBLIC_KEY;
  if (!publicKey) {
    throw new Error('TURNKEY_API_PUBLIC_KEY environment variable is not set');
  }
  return publicKey;
}

function getApiPrivateKey(): string {
  const privateKey = process.env.TURNKEY_API_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('TURNKEY_API_PRIVATE_KEY environment variable is not set');
  }
  return privateKey;
}

export function validateTurnkeyConfig(): { valid: boolean; missing: string[]; devMode: boolean } {
  // In DEV_MODE, always return valid
  if (DEV_MODE) {
    return { valid: true, missing: [], devMode: true };
  }

  const missing: string[] = [];
  if (!process.env.TURNKEY_ORGANIZATION_ID) missing.push('TURNKEY_ORGANIZATION_ID');
  if (!process.env.TURNKEY_API_PUBLIC_KEY) missing.push('TURNKEY_API_PUBLIC_KEY');
  if (!process.env.TURNKEY_API_PRIVATE_KEY) missing.push('TURNKEY_API_PRIVATE_KEY');
  return { valid: missing.length === 0, missing, devMode: false };
}

// =====================================================
// TYPES
// =====================================================

export interface TurnkeyWallet {
  walletId: string;
  walletName: string;
  accounts: TurnkeyAccount[];
  createdAt: string;
}

export interface TurnkeyAccount {
  address: string;
  addressFormat: string;
  curve: string;
  path: string;
}

export interface CreateWalletRequest {
  walletName: string;
  userId: string;
}

// Supported chains per guidelines
export type SupportedChain = 'ethereum' | 'solana' | 'tron';

// Turnkey address formats
const ADDRESS_FORMATS = {
  ethereum: 'ADDRESS_FORMAT_ETHEREUM',
  solana: 'ADDRESS_FORMAT_SOLANA',
  tron: 'ADDRESS_FORMAT_TRON',
} as const;

// Curve types for each chain
const CURVE_TYPES = {
  ethereum: 'CURVE_SECP256K1',
  solana: 'CURVE_ED25519',
  tron: 'CURVE_SECP256K1',
} as const;

// Path formats for HD wallet derivation
const PATH_FORMATS = {
  ethereum: "m/44'/60'/0'/0/0",
  solana: "m/44'/501'/0'/0'",
  tron: "m/44'/195'/0'/0/0",
} as const;

export const CHAIN_CONFIG: Record<
  SupportedChain,
  { curve: string; pathFormat: string; addressFormat: string }
> = {
  ethereum: {
    curve: CURVE_TYPES.ethereum,
    pathFormat: PATH_FORMATS.ethereum,
    addressFormat: ADDRESS_FORMATS.ethereum,
  },
  solana: {
    curve: CURVE_TYPES.solana,
    pathFormat: PATH_FORMATS.solana,
    addressFormat: ADDRESS_FORMATS.solana,
  },
  tron: {
    curve: CURVE_TYPES.tron,
    pathFormat: PATH_FORMATS.tron,
    addressFormat: ADDRESS_FORMATS.tron,
  },
};

// =====================================================
// TURNKEY SDK CLIENT
// =====================================================

let turnkeyClient: Turnkey | null = null;

function getClient(): Turnkey {
  if (!turnkeyClient) {
    turnkeyClient = new Turnkey({
      apiBaseUrl: process.env.TURNKEY_BASE_URL || 'https://api.turnkey.com',
      apiPublicKey: getApiPublicKey(),
      apiPrivateKey: getApiPrivateKey(),
      defaultOrganizationId: getOrganizationId(),
    });
  }
  return turnkeyClient;
}

// =====================================================
// MOCK FUNCTIONS FOR DEVELOPMENT
// =====================================================

function generateMockAddress(chain: SupportedChain, userId: string): string {
  const hash = crypto.createHash('sha256').update(`${userId}-${chain}`).digest('hex');

  switch (chain) {
    case 'ethereum':
      return `0x${hash.substring(0, 40)}`;
    case 'solana':
      // Solana addresses are base58, but for mock we'll use a simplified version
      return `${hash.substring(0, 44)}`;
    case 'tron':
      return `T${hash.substring(0, 33)}`;
    default:
      return `0x${hash.substring(0, 40)}`;
  }
}

function createMockWallet(request: CreateWalletRequest): TurnkeyWallet {
  const walletId = `mock-wallet-${crypto.randomUUID()}`;
  const accounts: TurnkeyAccount[] = Object.entries(CHAIN_CONFIG).map(([chain, config]) => ({
    address: generateMockAddress(chain as SupportedChain, request.userId),
    addressFormat: config.addressFormat,
    curve: config.curve,
    path: config.pathFormat,
  }));

  return {
    walletId,
    walletName: request.walletName,
    accounts,
    createdAt: new Date().toISOString(),
  };
}

// =====================================================
// API FUNCTIONS
// =====================================================

/**
 * Create a new wallet with addresses for all supported chains
 * Per guidelines: Support Ethereum, Solana, and Tron for USDT/USDC/USDG
 */
export async function createWallet(request: CreateWalletRequest): Promise<TurnkeyWallet> {
  console.log(`[Turnkey] Creating wallet for user: ${request.userId}`);

  // Development mode - return mock wallet
  if (DEV_MODE) {
    console.log('[Turnkey] 🔧 DEV MODE: Creating mock wallet');
    return createMockWallet(request);
  }

  const client = getClient();
  const apiClient = client.apiClient();

  // Create wallet with accounts for all supported chains
  // Using explicit path format as required by Turnkey SDK
  const accounts = Object.entries(CHAIN_CONFIG).map(([, config]) => ({
    curve: config.curve as 'CURVE_SECP256K1' | 'CURVE_ED25519',
    pathFormat: 'PATH_FORMAT_BIP32' as const,
    path: config.pathFormat,
    addressFormat: config.addressFormat as
      | 'ADDRESS_FORMAT_ETHEREUM'
      | 'ADDRESS_FORMAT_SOLANA'
      | 'ADDRESS_FORMAT_TRON',
  }));

  try {
    const response = await apiClient.createWallet({
      walletName: request.walletName,
      accounts,
    });

    const walletId = response.walletId;

    if (!walletId) {
      throw new Error('Failed to create wallet: No wallet ID returned');
    }

    console.log(`[Turnkey] ✅ Wallet created: ${walletId}`);

    // Get wallet details with addresses
    return getWallet(walletId);
  } catch (error: any) {
    console.error('[Turnkey] Error creating wallet:', error?.message || error);
    throw error;
  }
}

/**
 * Get wallet by ID
 */
export async function getWallet(walletId: string): Promise<TurnkeyWallet> {
  console.log(`[Turnkey] Getting wallet: ${walletId}`);

  // Development mode - return mock wallet
  if (DEV_MODE) {
    console.log('[Turnkey] 🔧 DEV MODE: Getting mock wallet');
    const mockUserId = walletId.replace('mock-wallet-', '');
    return createMockWallet({ walletName: `mock-${walletId}`, userId: mockUserId });
  }

  const client = getClient();
  const apiClient = client.apiClient();

  try {
    const response = await apiClient.getWallet({
      walletId,
    });

    // Get wallet accounts with addresses
    const accountsResponse = await apiClient.getWalletAccounts({
      walletId,
    });

    const accounts: TurnkeyAccount[] = (accountsResponse.accounts || []).map(acc => ({
      address: acc.address || '',
      addressFormat: acc.addressFormat || '',
      curve: acc.curve || '',
      path: acc.path || '',
    }));

    return {
      walletId: response.wallet?.walletId || walletId,
      walletName: response.wallet?.walletName || '',
      accounts,
      createdAt: response.wallet?.createdAt?.seconds
        ? new Date(parseInt(response.wallet.createdAt.seconds) * 1000).toISOString()
        : new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('[Turnkey] Error getting wallet:', error?.message || error);
    throw error;
  }
}

/**
 * List all wallets in organization
 */
export async function listWallets(): Promise<TurnkeyWallet[]> {
  console.log('[Turnkey] Listing wallets');

  // Development mode - return empty list
  if (DEV_MODE) {
    console.log('[Turnkey] 🔧 DEV MODE: Returning empty wallet list');
    return [];
  }

  const client = getClient();
  const apiClient = client.apiClient();

  try {
    const response = await apiClient.getWallets({});

    const wallets: TurnkeyWallet[] = (response.wallets || []).map(w => ({
      walletId: w.walletId || '',
      walletName: w.walletName || '',
      accounts: [],
      createdAt: w.createdAt?.seconds
        ? new Date(parseInt(w.createdAt.seconds) * 1000).toISOString()
        : new Date().toISOString(),
    }));

    console.log(`[Turnkey] Found ${wallets.length} wallets`);
    return wallets;
  } catch (error: any) {
    console.error('[Turnkey] Error listing wallets:', error?.message || error);
    throw error;
  }
}

/**
 * Get wallet address for a specific chain
 */
export async function getWalletAddress(
  walletId: string,
  chain: SupportedChain
): Promise<string | null> {
  const wallet = await getWallet(walletId);
  const chainConfig = CHAIN_CONFIG[chain];

  const account = wallet.accounts.find(acc => acc.addressFormat === chainConfig.addressFormat);

  return account?.address || null;
}

/**
 * Test API connection
 */
export async function testConnection(): Promise<{
  connected: boolean;
  organizationId?: string;
  walletCount?: number;
  error?: string;
  devMode?: boolean;
}> {
  try {
    console.log('[Turnkey] Testing connection...');

    // Development mode
    if (DEV_MODE) {
      console.log('[Turnkey] 🔧 DEV MODE enabled - using mock wallets');
      return {
        connected: true,
        organizationId: 'dev-mode',
        walletCount: 0,
        devMode: true,
      };
    }

    console.log('[Turnkey] Organization ID:', getOrganizationId().substring(0, 8) + '...');

    // Try to list wallets to verify connection
    const wallets = await listWallets();

    console.log('[Turnkey] ✅ Connection successful');
    return {
      connected: true,
      organizationId: getOrganizationId(),
      walletCount: wallets.length,
    };
  } catch (error: any) {
    const message = error?.message || 'Unknown error';
    console.error('[Turnkey] ❌ Connection failed:', message);
    return { connected: false, error: message };
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Create wallet for new user and return all addresses
 */
export async function createUserWallet(userId: string): Promise<{
  walletId: string;
  addresses: Record<SupportedChain, string>;
}> {
  const wallet = await createWallet({
    walletName: `user-${userId}-wallet`,
    userId,
  });

  const addresses: Record<SupportedChain, string> = {
    ethereum: '',
    solana: '',
    tron: '',
  };

  // Map addresses from wallet accounts
  for (const [chain, config] of Object.entries(CHAIN_CONFIG)) {
    const account = wallet.accounts.find(acc => acc.addressFormat === config.addressFormat);
    if (account) {
      addresses[chain as SupportedChain] = account.address;
    }
  }

  return {
    walletId: wallet.walletId,
    addresses,
  };
}

/**
 * Get or create wallet for user
 * Returns existing wallet or creates new one
 */
export async function getOrCreateUserWallet(
  userId: string,
  existingWalletId?: string
): Promise<{
  walletId: string;
  addresses: Record<SupportedChain, string>;
  isNew: boolean;
}> {
  if (existingWalletId) {
    try {
      const wallet = await getWallet(existingWalletId);
      const addresses: Record<SupportedChain, string> = {
        ethereum: '',
        solana: '',
        tron: '',
      };

      for (const [chain, config] of Object.entries(CHAIN_CONFIG)) {
        const account = wallet.accounts.find(acc => acc.addressFormat === config.addressFormat);
        if (account) {
          addresses[chain as SupportedChain] = account.address;
        }
      }

      return {
        walletId: wallet.walletId,
        addresses,
        isNew: false,
      };
    } catch (error) {
      console.log('[Turnkey] Existing wallet not found, creating new one');
    }
  }

  const newWallet = await createUserWallet(userId);
  return {
    ...newWallet,
    isNew: true,
  };
}
