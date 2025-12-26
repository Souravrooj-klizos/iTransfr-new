// =====================================================
// SUPPORTED CURRENCIES AND BLOCKCHAINS
// =====================================================
// As per guidelines (Dec 9, 2025):
// - Only stablecoins: USDT, USDC, USDG
// - Only chains: Tron, Solana, Ethereum
// - Banking: SSB (not Fortress)
// =====================================================

export type SupportedCurrency = 'USDT' | 'USDC' | 'USDG';
export type SupportedChain = 'TRON' | 'SOLANA' | 'ETHEREUM';

// Supported stablecoins
export const SUPPORTED_CURRENCIES: SupportedCurrency[] = ['USDT', 'USDC', 'USDG'];

// Supported blockchain networks
export const SUPPORTED_CHAINS: SupportedChain[] = ['TRON', 'SOLANA', 'ETHEREUM'];

// Token standards per chain
export const CHAIN_TOKEN_STANDARDS: Record<SupportedChain, string> = {
  TRON: 'TRC-20',
  SOLANA: 'SPL',
  ETHEREUM: 'ERC-20',
};

// Chain configuration
export const CHAIN_CONFIG: Record<
  SupportedChain,
  {
    name: string;
    standard: string;
    nativeCurrency: string;
    explorerUrl: string;
    avgConfirmationTime: string;
    avgFee: string;
  }
> = {
  TRON: {
    name: 'Tron Network',
    standard: 'TRC-20',
    nativeCurrency: 'TRX',
    explorerUrl: 'https://tronscan.org',
    avgConfirmationTime: '3 seconds',
    avgFee: '~$1-2',
  },
  SOLANA: {
    name: 'Solana Network',
    standard: 'SPL',
    nativeCurrency: 'SOL',
    explorerUrl: 'https://solscan.io',
    avgConfirmationTime: '~400ms',
    avgFee: '~$0.00025',
  },
  ETHEREUM: {
    name: 'Ethereum Network',
    standard: 'ERC-20',
    nativeCurrency: 'ETH',
    explorerUrl: 'https://etherscan.io',
    avgConfirmationTime: '~12 seconds',
    avgFee: '~$5-50 (variable)',
  },
};

// Currency configuration
export const CURRENCY_CONFIG: Record<
  SupportedCurrency,
  {
    name: string;
    fullName: string;
    issuer: string;
    supportedChains: SupportedChain[];
    decimals: number;
  }
> = {
  USDT: {
    name: 'USDT',
    fullName: 'Tether USD',
    issuer: 'Tether',
    supportedChains: ['TRON', 'SOLANA', 'ETHEREUM'],
    decimals: 6,
  },
  USDC: {
    name: 'USDC',
    fullName: 'USD Coin',
    issuer: 'Circle',
    supportedChains: ['SOLANA', 'ETHEREUM'],
    decimals: 6,
  },
  USDG: {
    name: 'USDG',
    fullName: 'Infinitus USD',
    issuer: 'Infinitus/Partner',
    supportedChains: ['ETHEREUM'], // Need to confirm actual chains
    decimals: 6,
  },
};

// Fiat currencies for payout
export const SUPPORTED_FIAT_CURRENCIES = ['USD', 'MXN', 'COP', 'INR', 'BRL'];

// Countries supported for payout
export const SUPPORTED_PAYOUT_COUNTRIES: Record<
  string,
  {
    currency: string;
    paymentRails: string[];
  }
> = {
  MX: { currency: 'MXN', paymentRails: ['SPEI'] },
  CO: { currency: 'COP', paymentRails: ['ACH', 'PSE'] },
  IN: { currency: 'INR', paymentRails: ['IMPS', 'NEFT', 'UPI'] },
  BR: { currency: 'BRL', paymentRails: ['PIX', 'TED'] },
  US: { currency: 'USD', paymentRails: ['ACH', 'WIRE'] },
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Check if a currency is supported
 */
export function isSupportedCurrency(currency: string): currency is SupportedCurrency {
  return SUPPORTED_CURRENCIES.includes(currency as SupportedCurrency);
}

/**
 * Check if a chain is supported
 */
export function isSupportedChain(chain: string): chain is SupportedChain {
  return SUPPORTED_CHAINS.includes(chain as SupportedChain);
}

/**
 * Get chains that support a specific currency
 */
export function getChainsForCurrency(currency: SupportedCurrency): SupportedChain[] {
  return CURRENCY_CONFIG[currency]?.supportedChains || [];
}

/**
 * Validate currency and chain combination
 */
export function isValidCurrencyChainPair(currency: string, chain: string): boolean {
  if (!isSupportedCurrency(currency) || !isSupportedChain(chain)) {
    return false;
  }
  return CURRENCY_CONFIG[currency].supportedChains.includes(chain);
}

/**
 * Get deposit address format hint
 */
export function getAddressFormatHint(chain: SupportedChain): string {
  switch (chain) {
    case 'TRON':
      return 'Starts with T (34 characters)';
    case 'SOLANA':
      return 'Base58 format (32-44 characters)';
    case 'ETHEREUM':
      return 'Starts with 0x (42 characters)';
    default:
      return '';
  }
}

/**
 * Validate blockchain address format
 */
export function isValidAddress(address: string, chain: SupportedChain): boolean {
  switch (chain) {
    case 'TRON':
      return /^T[A-Za-z1-9]{33}$/.test(address);
    case 'SOLANA':
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
    case 'ETHEREUM':
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    default:
      return false;
  }
}
