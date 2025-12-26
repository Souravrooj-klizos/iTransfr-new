/**
 * Client API Service
 *
 * Frontend API calls for the client portal.
 * All methods use the clientAxios instance with auth interceptors.
 */

import { clientAxios } from './axios';
import type {
  ApiResponse,
  CreateDepositRequest,
  CreatePayoutRequest,
  DepositAddress,
  KycRecord,
  PaginatedResponse,
  PayoutEstimate,
  Transaction,
  UserProfile,
  Wallet,
  WalletBalance,
} from './types';

// =====================================================
// WALLET API
// =====================================================

export const walletApi = {
  /**
   * Get all wallets for current user
   */
  async list(): Promise<WalletBalance[]> {
    const response = await clientAxios.get<ApiResponse<WalletBalance[]>>('/wallets/list');
    return response.data.data || [];
  },

  /**
   * Get single wallet by ID
   */
  async get(walletId: string): Promise<Wallet | null> {
    const response = await clientAxios.get<ApiResponse<Wallet>>(`/wallets/${walletId}`);
    return response.data.data || null;
  },

  /**
   * Get deposit address for a currency
   */
  async getDepositAddress(currency: string, chain: string): Promise<DepositAddress | null> {
    const response = await clientAxios.get<ApiResponse<DepositAddress>>(
      `/wallets/deposit-address?currency=${currency}&chain=${chain}`
    );
    return response.data.data || null;
  },

  /**
   * Get total balance across all wallets
   */
  async getTotalBalance(): Promise<{ total: number; currency: string }> {
    const response =
      await clientAxios.get<ApiResponse<{ total: number; currency: string }>>(
        '/wallets/total-balance'
      );
    return response.data.data || { total: 0, currency: 'USD' };
  },
};

// =====================================================
// TRANSACTION API
// =====================================================

export const transactionApi = {
  /**
   * Get paginated transactions for current user
   */
  async list(params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
  }): Promise<PaginatedResponse<Transaction>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.type) queryParams.set('type', params.type);
    if (params?.status) queryParams.set('status', params.status);

    const response = await clientAxios.get<PaginatedResponse<Transaction>>(
      `/transactions/list?${queryParams.toString()}`
    );
    return response.data;
  },

  /**
   * Get single transaction by ID
   */
  async get(transactionId: string): Promise<Transaction | null> {
    const response = await clientAxios.get<ApiResponse<Transaction>>(
      `/transactions/${transactionId}`
    );
    return response.data.data || null;
  },

  /**
   * Get recent transactions (last 10)
   */
  async getRecent(limit: number = 10): Promise<Transaction[]> {
    const response = await clientAxios.get<ApiResponse<Transaction[]>>(
      `/transactions/list?limit=${limit}`
    );
    return response.data.data || [];
  },
};

// =====================================================
// DEPOSIT API
// =====================================================

export const depositApi = {
  /**
   * Create a new deposit request
   */
  async create(data: CreateDepositRequest): Promise<ApiResponse<Transaction>> {
    const response = await clientAxios.post<ApiResponse<Transaction>>(
      '/transactions/deposit',
      data
    );
    return response.data;
  },

  /**
   * Get deposit address for crypto deposits
   */
  async getAddress(currency: string, chain: string): Promise<DepositAddress | null> {
    return walletApi.getDepositAddress(currency, chain);
  },

  /**
   * Get deposit instructions for wire transfers
   */
  async getWireInstructions(type: 'domestic' | 'swift' | 'sepa'): Promise<ApiResponse<any>> {
    const response = await clientAxios.get<ApiResponse<any>>(
      `/deposits/wire-instructions?type=${type}`
    );
    return response.data;
  },
};

// =====================================================
// PAYOUT API
// =====================================================

export const payoutApi = {
  /**
   * Get payout estimate (exchange rate, fees)
   */
  async estimate(data: {
    amount: number;
    fromCurrency: string;
    toCurrency: string;
    country: string;
  }): Promise<PayoutEstimate> {
    const response = await clientAxios.post<ApiResponse<PayoutEstimate>>('/payouts/estimate', data);
    return response.data.data!;
  },

  /**
   * Create a payout request
   */
  async create(data: CreatePayoutRequest): Promise<ApiResponse<Transaction>> {
    const response = await clientAxios.post<ApiResponse<Transaction>>('/transactions/payout', data);
    return response.data;
  },

  /**
   * Get user's recipients
   */
  async getRecipients(): Promise<any[]> {
    const response = await clientAxios.get<ApiResponse<any[]>>('/recipients/list');
    return response.data.data || [];
  },

  /**
   * Save a recipient
   */
  async saveRecipient(data: any): Promise<ApiResponse<any>> {
    const response = await clientAxios.post<ApiResponse<any>>('/recipients/create', data);
    return response.data;
  },
};

// =====================================================
// PROFILE API
// =====================================================

export const profileApi = {
  /**
   * Get current user profile
   */
  async get(): Promise<UserProfile | null> {
    const response = await clientAxios.get<ApiResponse<UserProfile>>('/profile');
    return response.data.data || null;
  },

  /**
   * Update user profile
   */
  async update(data: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    const response = await clientAxios.put<ApiResponse<UserProfile>>('/profile', data);
    return response.data;
  },

  /**
   * Get KYC status
   */
  async getKycStatus(): Promise<KycRecord | null> {
    const response = await clientAxios.get<ApiResponse<KycRecord>>('/kyc/status');
    return response.data.data || null;
  },
};

// =====================================================
// COMBINED CLIENT API EXPORT
// =====================================================

export const clientApi = {
  wallets: walletApi,
  transactions: transactionApi,
  deposits: depositApi,
  payouts: payoutApi,
  profile: profileApi,
};

export default clientApi;
