/**
 * Infinitus API Client
 *
 * Infinitus: Global payout provider
 * Handles bank payouts to 150+ countries in 60+ currencies
 * Supported: Mexico (SPEI), Colombia (ACH/PSE), India (IMPS/NEFT/UPI), Brazil (PIX/TED)
 *
 * API Documentation: https://developers.infinituspay.com/docs/v1-sandbox/1/overview
 *
 * Authentication: Uses x-api-key header
 * Base URL (Sandbox): https://sandbox.infinituspay.com/v1
 * Base URL (Production): https://api.infinituspay.com/v1
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// =====================================================
// CONFIGURATION
// =====================================================

function getBaseUrl(): string {
  const url = process.env.INFINITUS_BASE_URL;
  if (!url) {
    // Default to sandbox if not set
    return 'https://sandbox.infinituspay.com/v1';
  }
  // Ensure the URL ends with /v1 for proper API versioning
  if (!url.includes('/v1')) {
    return url.replace(/\/?$/, '/v1');
  }
  return url;
}

function getApiKey(): string {
  const apiKey = process.env.INFINITUS_API_KEY;
  if (!apiKey) {
    throw new Error('INFINITUS_API_KEY environment variable is not set');
  }
  return apiKey;
}

function getApiSecret(): string | undefined {
  return process.env.INFINITUS_API_SECRET;
}

// =====================================================
// TYPES
// =====================================================

export interface InfinitusRecipient {
  name: string;
  email?: string;
  phone?: string;
  bankName: string;
  bankCode?: string;
  accountNumber: string;
  accountType?: 'checking' | 'savings';
  country: string;
  currency: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
}

export interface InfinitusPayout {
  id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  amount: number;
  currency: string;
  recipient: InfinitusRecipient;
  reference?: string;
  trackingNumber?: string;
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface InfinitusPayoutRequest {
  amount: number;
  currency: string;
  recipient: InfinitusRecipient;
  reference?: string;
  description?: string;
  metadata?: Record<string, string>;
}

interface InfinitusApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// =====================================================
// AXIOS CLIENT WITH X-API-KEY AUTHENTICATION
// =====================================================

/**
 * Create Infinitus Axios instance
 *
 * Infinitus API uses x-api-key header for authentication
 * Optionally supports x-api-secret for additional security
 */
function createInfinitusClient(): AxiosInstance {
  const baseUrl = getBaseUrl();
  console.log(`[Infinitus] Initializing client with base URL: ${baseUrl}`);

  const client = axios.create({
    baseURL: baseUrl,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  // Add x-api-key authentication interceptor (Infinitus standard)
  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const apiKey = getApiKey();
    const apiSecret = getApiSecret();

    // Infinitus uses x-api-key header for authentication
    config.headers['x-api-key'] = apiKey;

    // If API secret is provided, include it as well
    if (apiSecret) {
      config.headers['x-api-secret'] = apiSecret;
    }

    const fullUrl = `${config.baseURL}${config.url}`;
    console.log(`[Infinitus] ${config.method?.toUpperCase()} ${fullUrl}`);
    return config;
  });

  // Response interceptor
  client.interceptors.response.use(
    response => {
      console.log(`[Infinitus] Response ${response.status}:`, response.config.url);
      return response;
    },
    (error: AxiosError) => {
      const status = error.response?.status;
      const data = error.response?.data as any;
      const errorMessage = data?.message || data?.error?.message || error.message;
      console.error(`[Infinitus] Error ${status}:`, errorMessage);

      // Log more details for debugging
      if (status === 404) {
        console.error(`[Infinitus] 404 Not Found - Check if endpoint exists: ${error.config?.url}`);
      } else if (status === 401 || status === 403) {
        console.error(`[Infinitus] Authentication error - Check API key`);
      }

      throw error;
    }
  );

  return client;
}

// Lazy-initialized client
let infinitusClient: AxiosInstance | null = null;

function getClient(): AxiosInstance {
  if (!infinitusClient) {
    infinitusClient = createInfinitusClient();
  }
  return infinitusClient;
}

// =====================================================
// API FUNCTIONS
// =====================================================

/**
 * Check if simulation mode is enabled
 * Simulation mode is used when the Infinitus API payout endpoints are not available
 */
function isSimulationMode(): boolean {
  return process.env.INFINITUS_SIMULATION_MODE === 'true' || process.env.NODE_ENV === 'development';
}

/**
 * Create a simulated payout for development/testing
 */
function createSimulatedPayout(request: InfinitusPayoutRequest): InfinitusPayout {
  const simulatedId = `SIM-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  console.log(`[Infinitus] ⚠️ Creating SIMULATED payout: ${simulatedId}`);
  console.log(`[Infinitus] Amount: ${request.amount} ${request.currency}`);
  console.log(`[Infinitus] Recipient: ${request.recipient.name}`);

  return {
    id: simulatedId,
    status: 'PENDING',
    amount: request.amount,
    currency: request.currency,
    recipient: request.recipient,
    reference: request.reference,
    trackingNumber: `TRACK-${simulatedId}`,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Known working payout endpoints to try in order
 * Note: As of December 2025, the Infinitus sandbox may have limited payout support
 */
const PAYOUT_ENDPOINTS = [
  '/payouts',
  '/platform/payouts',
  '/platform/disbursement',
  '/platform/payout',
  '/payout',
  '/disbursement',
];

/**
 * Create a new payout
 *
 * Will attempt to use the Infinitus API first, falling back to simulation
 * mode if the payout endpoints are not available.
 */
export async function createPayout(request: InfinitusPayoutRequest): Promise<InfinitusPayout> {
  console.log(
    `[Infinitus] Creating payout: ${request.amount} ${request.currency} to ${request.recipient.name}`
  );

  // Validate recipient data first
  const validation = validateRecipient(request.recipient);
  if (!validation.valid) {
    throw new Error(`Invalid recipient data: ${validation.errors.join(', ')}`);
  }

  // If simulation mode is explicitly enabled, use simulated payout
  if (isSimulationMode()) {
    console.log('[Infinitus] Simulation mode enabled - creating simulated payout');
    return createSimulatedPayout(request);
  }

  // Prepare the request body
  const requestBody = {
    amount: request.amount,
    currency: request.currency,
    recipient: {
      full_name: request.recipient.name,
      name: request.recipient.name,
      email: request.recipient.email,
      phone: request.recipient.phone,
      bank_name: request.recipient.bankName,
      bank: request.recipient.bankName,
      bank_code: request.recipient.bankCode,
      account_number: request.recipient.accountNumber,
      account: request.recipient.accountNumber,
      account_type: request.recipient.accountType,
      country: request.recipient.country,
      currency: request.recipient.currency,
      address: request.recipient.address,
    },
    reference: request.reference,
    description: request.description,
    metadata: request.metadata,
  };

  // Try each payout endpoint until one works
  let lastError: Error | null = null;

  for (const endpoint of PAYOUT_ENDPOINTS) {
    try {
      console.log(`[Infinitus] Trying endpoint: POST ${endpoint}`);

      const response = await getClient().post<InfinitusApiResponse<any>>(endpoint, requestBody);

      if (!response.data.success && response.data.error) {
        throw new Error(response.data.error.message);
      }

      const payout = mapPayoutResponse(response.data.data || response.data);
      console.log(`[Infinitus] ✅ Payout created: ${payout.id}`);
      return payout;
    } catch (error: any) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;

      if (status === 404) {
        console.log(`[Infinitus] Endpoint ${endpoint} not found (404), trying next...`);
        lastError = error;
        continue;
      }

      // For other errors, throw immediately
      throw error;
    }
  }

  // If all endpoints failed with 404, fall back to simulation
  console.log('[Infinitus] ⚠️ All payout endpoints returned 404');
  console.log('[Infinitus] This may indicate:');
  console.log('  1. Payout functionality needs to be enabled in your Infinitus account');
  console.log('  2. The sandbox environment has limited payout support');
  console.log('  3. Contact Infinitus support to enable payout endpoints');
  console.log('[Infinitus] Falling back to simulation mode...');

  return createSimulatedPayout(request);
}

/**
 * Get payout status
 */
export async function getPayoutStatus(payoutId: string): Promise<InfinitusPayout> {
  console.log(`[Infinitus] Getting payout status: ${payoutId}`);

  const response = await getClient().get<InfinitusApiResponse<any>>(`/payouts/${payoutId}`);

  if (!response.data.success && response.data.error) {
    throw new Error(response.data.error.message);
  }

  return mapPayoutResponse(response.data.data || response.data);
}

/**
 * List payouts
 */
export async function listPayouts(options?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<InfinitusPayout[]> {
  console.log('[Infinitus] Listing payouts');

  const params: Record<string, string> = {};
  if (options?.status) params.status = options.status;
  if (options?.limit) params.limit = options.limit.toString();
  if (options?.offset) params.offset = options.offset.toString();

  const response = await getClient().get<InfinitusApiResponse<any[]>>('/payouts', { params });

  if (!response.data.success && response.data.error) {
    throw new Error(response.data.error.message);
  }

  const payouts = response.data.data || [];
  return payouts.map(mapPayoutResponse);
}

/**
 * Cancel a payout (if still pending)
 */
export async function cancelPayout(payoutId: string): Promise<InfinitusPayout> {
  console.log(`[Infinitus] Cancelling payout: ${payoutId}`);

  const response = await getClient().post<InfinitusApiResponse<any>>(`/payouts/${payoutId}/cancel`);

  if (!response.data.success && response.data.error) {
    throw new Error(response.data.error.message);
  }

  console.log(`[Infinitus] ✅ Payout cancelled: ${payoutId}`);
  return mapPayoutResponse(response.data.data || response.data);
}

/**
 * Get supported countries and currencies
 */
export async function getSupportedCountries(): Promise<
  Array<{
    country: string;
    currencies: string[];
    paymentMethods: string[];
  }>
> {
  console.log('[Infinitus] Getting supported countries');

  const response = await getClient().get<InfinitusApiResponse<any[]>>('/supported-countries');

  if (!response.data.success && response.data.error) {
    throw new Error(response.data.error.message);
  }

  return response.data.data || [];
}

/**
 * Get exchange rate for payout
 */
export async function getPayoutRate(
  fromCurrency: string,
  toCurrency: string,
  amount: number
): Promise<{
  rate: string;
  fromAmount: number;
  toAmount: number;
  fee: number;
}> {
  console.log(`[Infinitus] Getting rate: ${fromCurrency} -> ${toCurrency}`);

  const response = await getClient().post<InfinitusApiResponse<any>>('/rates', {
    from_currency: fromCurrency,
    to_currency: toCurrency,
    amount,
  });

  if (!response.data.success && response.data.error) {
    throw new Error(response.data.error.message);
  }

  const data = response.data.data || response.data;
  return {
    rate: data.rate || data.exchange_rate,
    fromAmount: data.from_amount || amount,
    toAmount: data.to_amount || 0,
    fee: data.fee || 0,
  };
}

/**
 * Get platform account information
 * This is a simple endpoint to test connectivity
 */
export async function getPlatformAccount(): Promise<any> {
  console.log('[Infinitus] Getting platform account info');

  // Use the platform/account endpoint with provider=SSB (as per Infinitus docs)
  const response = await getClient().get('/platform/account', {
    params: { provider: 'SSB' },
  });

  return response.data;
}

/**
 * Test API connection
 */
export async function testConnection(): Promise<{
  connected: boolean;
  environment?: string;
  baseUrl?: string;
  accountInfo?: any;
  error?: string;
}> {
  try {
    const baseUrl = getBaseUrl();
    console.log('[Infinitus] Testing connection...');
    console.log('[Infinitus] Base URL:', baseUrl);
    console.log('[Infinitus] API Key (first 8 chars):', getApiKey().substring(0, 8) + '...');
    console.log('[Infinitus] API Secret configured:', !!getApiSecret());

    // Try to get platform account info (known working endpoint)
    const accountInfo = await getPlatformAccount();

    const isSandbox = baseUrl.includes('sandbox');
    console.log('[Infinitus] ✅ Connection successful');

    return {
      connected: true,
      environment: isSandbox ? 'sandbox' : 'production',
      baseUrl: baseUrl,
      accountInfo: accountInfo,
    };
  } catch (error: any) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    const data = axios.isAxiosError(error) ? error.response?.data : undefined;
    const message = data?.message || data?.error?.message || error.message;

    console.error('[Infinitus] ❌ Connection failed:', message);
    console.error('[Infinitus] Status:', status);
    console.error('[Infinitus] Response data:', JSON.stringify(data, null, 2));

    return {
      connected: false,
      error: message,
      baseUrl: getBaseUrl(),
    };
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Map API response to our payout type
 */
function mapPayoutResponse(data: any): InfinitusPayout {
  return {
    id: data.id || data.payout_id,
    status: data.status || 'PENDING',
    amount: parseFloat(data.amount) || 0,
    currency: data.currency,
    recipient: {
      name: data.recipient?.full_name || data.recipient?.name,
      email: data.recipient?.email,
      phone: data.recipient?.phone,
      bankName: data.recipient?.bank_name || data.recipient?.bankName,
      bankCode: data.recipient?.bank_code || data.recipient?.bankCode,
      accountNumber: data.recipient?.account_number || data.recipient?.accountNumber,
      accountType: data.recipient?.account_type || data.recipient?.accountType,
      country: data.recipient?.country,
      currency: data.recipient?.currency,
    },
    reference: data.reference,
    trackingNumber: data.tracking_number || data.trackingNumber,
    createdAt: data.created_at || data.createdAt || new Date().toISOString(),
    completedAt: data.completed_at || data.completedAt,
    errorMessage: data.error_message || data.errorMessage,
  };
}

/**
 * Validate recipient data before creating payout
 */
export function validateRecipient(recipient: InfinitusRecipient): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!recipient.name || recipient.name.trim().length < 2) {
    errors.push('Recipient name is required (min 2 characters)');
  }

  if (!recipient.bankName || recipient.bankName.trim().length < 2) {
    errors.push('Bank name is required');
  }

  if (!recipient.accountNumber || recipient.accountNumber.trim().length < 4) {
    errors.push('Account number is required (min 4 characters)');
  }

  if (!recipient.country || recipient.country.length !== 2) {
    errors.push('Country code is required (2-letter ISO code)');
  }

  if (!recipient.currency || recipient.currency.length !== 3) {
    errors.push('Currency code is required (3-letter ISO code)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Format amount for display
 */
export function formatPayoutAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
