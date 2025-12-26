/**
 * Bitso API Client
 *
 * Bitso API for currency conversions (FX swaps)
 * Documentation: https://docs.bitso.com
 *
 * Refactored to use Axios with HMAC-SHA256 authentication.
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import crypto from 'crypto';

// =====================================================
// CONFIGURATION
// =====================================================

const BITSO_BASE_URL = process.env.BITSO_API_URL || 'https://api.bitso.com/v3';

function getApiKey(): string {
  const apiKey = process.env.BITSO_API_KEY;
  if (!apiKey) {
    throw new Error('BITSO_API_KEY environment variable is not set');
  }
  return apiKey;
}

function getApiSecret(): string {
  const apiSecret = process.env.BITSO_API_SECRET;
  if (!apiSecret) {
    throw new Error('BITSO_API_SECRET environment variable is not set');
  }
  return apiSecret;
}

// =====================================================
// TYPES
// =====================================================

export interface BitsoQuote {
  id: string;
  from_amount: string;
  from_currency: string;
  to_amount: string;
  to_currency: string;
  rate: string;
  plain_rate: string;
  rate_currency: string;
  expires: number;
  created: number;
  book: string;
  padding: string;
  estimated_slippage: {
    value: string;
    level: string;
    message: string;
  };
}

export interface BitsoConversion {
  id: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  from_amount: string;
  from_currency: string;
  to_amount: string;
  to_currency: string;
  rate: string;
  created: number;
  executed_at?: number;
}

export interface BitsoBalance {
  currency: string;
  available: string;
  locked: string;
  total: string;
}

interface BitsoApiResponse<T> {
  success: boolean;
  payload: T;
  error?: {
    code: string;
    message: string;
  };
}

// =====================================================
// AXIOS CLIENT WITH HMAC AUTHENTICATION
// =====================================================

/**
 * Create HMAC-SHA256 signature for Bitso API
 */
function createSignature(nonce: string, method: string, path: string, body: string = ''): string {
  const message = nonce + method.toUpperCase() + path + body;
  return crypto.createHmac('sha256', getApiSecret()).update(message).digest('hex');
}

/**
 * Create Bitso Axios instance with auth interceptor
 */
function createBitsoClient(): AxiosInstance {
  const client = axios.create({
    baseURL: BITSO_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add HMAC authentication interceptor
  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const nonce = Date.now().toString();
    const method = config.method?.toUpperCase() || 'GET';
    const url = new URL(config.url || '', config.baseURL);
    const path = url.pathname + url.search;
    const body = config.data ? JSON.stringify(config.data) : '';

    const signature = createSignature(nonce, method, path, body);
    config.headers.Authorization = `Bitso ${getApiKey()}:${nonce}:${signature}`;

    console.log(`[Bitso] ${method} ${path}`);
    return config;
  });

  // Response interceptor
  client.interceptors.response.use(
    response => {
      console.log(`[Bitso] Response ${response.status}:`, response.config.url);
      return response;
    },
    (error: AxiosError) => {
      const status = error.response?.status;
      const data = error.response?.data as any;
      console.error(`[Bitso] Error ${status}:`, data?.error?.message || error.message);
      throw error;
    }
  );

  return client;
}

// Lazy-initialized client
let bitsoClient: AxiosInstance | null = null;

function getClient(): AxiosInstance {
  if (!bitsoClient) {
    bitsoClient = createBitsoClient();
  }
  return bitsoClient;
}

// =====================================================
// API FUNCTIONS
// =====================================================

/**
 * Request a conversion quote
 * Quote is valid for 30 seconds
 */
export async function requestQuote(
  fromCurrency: string,
  toCurrency: string,
  amount: number,
  type: 'spend' | 'receive' = 'spend'
): Promise<BitsoQuote> {
  console.log(`[Bitso] Requesting quote: ${amount} ${fromCurrency} -> ${toCurrency}`);

  // Bitso uses POST /currency_conversions to request a quote
  const body: Record<string, any> = {
    from_currency: fromCurrency.toLowerCase(),
    to_currency: toCurrency.toLowerCase(),
  };

  if (type === 'spend') {
    body.spend_amount = amount.toString();
  } else {
    body.receive_amount = amount.toString();
  }

  const response = await getClient().post<BitsoApiResponse<BitsoQuote>>(
    '/currency_conversions',
    body
  );

  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to get quote');
  }

  console.log(
    `[Bitso] Quote received: ${response.data.payload.id}, rate: ${response.data.payload.rate}`
  );
  return response.data.payload;
}

/**
 * Execute a conversion quote
 * Must be called within 30 seconds of receiving quote
 */
export async function executeQuote(quoteId: string): Promise<BitsoConversion> {
  console.log(`[Bitso] Executing quote: ${quoteId}`);

  // Bitso uses PUT /currency_conversions/{quote_id} to execute
  const response = await getClient().put<BitsoApiResponse<BitsoConversion>>(
    `/currency_conversions/${quoteId}`
  );

  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to execute conversion');
  }

  console.log(`[Bitso] Conversion executed: ${response.data.payload.id}`);
  return response.data.payload;
}

/**
 * Get conversion status
 */
export async function getConversionStatus(conversionId: string): Promise<BitsoConversion> {
  console.log(`[Bitso] Getting conversion status: ${conversionId}`);

  const response = await getClient().get<BitsoApiResponse<BitsoConversion>>(
    `/currency_conversions/${conversionId}`
  );

  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to get conversion status');
  }

  return response.data.payload;
}

/**
 * Get account balances
 */
export async function getBalances(): Promise<BitsoBalance[]> {
  console.log('[Bitso] Getting balances');

  const response =
    await getClient().get<BitsoApiResponse<{ balances: BitsoBalance[] }>>('/balance');

  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to get balances');
  }

  // Balance response has a nested 'balances' array
  return response.data.payload.balances || (response.data.payload as unknown as BitsoBalance[]);
}

/**
 * Get available trading books (currency pairs)
 */
export async function getAvailableBooks(): Promise<any[]> {
  console.log('[Bitso] Getting available books');

  const response = await getClient().get<BitsoApiResponse<any[]>>('/available_books');

  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to get available books');
  }

  return response.data.payload;
}

/**
 * Test API connection
 */
export async function testConnection(): Promise<{
  connected: boolean;
  balances?: BitsoBalance[];
  error?: string;
}> {
  try {
    console.log('[Bitso] Testing connection...');
    const balances = await getBalances();
    console.log('[Bitso] ✅ Connection successful');
    return { connected: true, balances };
  } catch (error: any) {
    const message = axios.isAxiosError(error)
      ? error.response?.data?.error?.message || error.message
      : error.message;
    console.error('[Bitso] ❌ Connection failed:', message);
    return { connected: false, error: message };
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Get exchange rate between two currencies
 */
export async function getExchangeRate(
  fromCurrency: string,
  toCurrency: string,
  amount: number = 1000
): Promise<{
  rate: string;
  fromAmount: string;
  toAmount: string;
  quoteId: string;
  expiresAt: Date;
}> {
  const quote = await requestQuote(fromCurrency, toCurrency, amount, 'spend');

  return {
    rate: quote.rate,
    fromAmount: quote.from_amount,
    toAmount: quote.to_amount,
    quoteId: quote.id,
    expiresAt: new Date(quote.expires * 1000),
  };
}

/**
 * Execute a full swap (get quote + execute)
 */
export async function executeSwap(
  fromCurrency: string,
  toCurrency: string,
  amount: number
): Promise<{
  quote: BitsoQuote;
  conversion: BitsoConversion;
}> {
  // Step 1: Get quote
  const quote = await requestQuote(fromCurrency, toCurrency, amount, 'spend');

  // Step 2: Execute immediately (within 30 seconds)
  const conversion = await executeQuote(quote.id);

  return { quote, conversion };
}
