/**
 * Admin API Service
 *
 * API calls for the admin console.
 * All methods use the adminAxios instance with auth interceptors.
 */

import { adminAxios } from './axios';
import type {
  AdminTransactionAction,
  ApiResponse,
  DashboardStats,
  KycRecord,
  PaginatedResponse,
  Transaction,
} from './types';

// =====================================================
// DASHBOARD API
// =====================================================

export const dashboardApi = {
  /**
   * Get dashboard statistics
   */
  async getStats(): Promise<DashboardStats> {
    const response =
      await adminAxios.get<ApiResponse<{ stats: DashboardStats }>>('/dashboard/stats');
    return (
      response.data.data?.stats || {
        totalClients: 0,
        pendingKYC: 0,
        approvedKYC: 0,
        rejectedKYC: 0,
        pendingTransactions: 0,
        completedTransactions: 0,
        totalVolume: 0,
      }
    );
  },

  /**
   * Get recent KYC requests
   */
  async getRecentKYC(limit: number = 5): Promise<KycRecord[]> {
    const response = await adminAxios.get<ApiResponse<{ recentKYC: KycRecord[] }>>(
      `/dashboard/stats?limit=${limit}`
    );
    return response.data.data?.recentKYC || [];
  },
};

// =====================================================
// TRANSACTIONS API (ADMIN)
// =====================================================

export const adminTransactionApi = {
  /**
   * Get paginated transactions (all users)
   */
  async list(params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    userId?: string;
  }): Promise<PaginatedResponse<Transaction>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.type) queryParams.set('type', params.type);
    if (params?.status) queryParams.set('status', params.status);
    if (params?.userId) queryParams.set('userId', params.userId);

    const response = await adminAxios.get<PaginatedResponse<Transaction>>(
      `/transactions/list?${queryParams.toString()}`
    );
    return response.data;
  },

  /**
   * Get single transaction by ID
   */
  async get(transactionId: string): Promise<Transaction | null> {
    const response = await adminAxios.get<ApiResponse<Transaction>>(
      `/transactions/${transactionId}`
    );
    return response.data.data || null;
  },

  /**
   * Execute transaction action (mark received, execute swap, send payout)
   */
  async executeAction(
    transactionId: string,
    action: AdminTransactionAction
  ): Promise<ApiResponse<{ newStatus: string; integrationResult?: any }>> {
    const response = await adminAxios.post<
      ApiResponse<{ newStatus: string; integrationResult?: any }>
    >(`/transactions/${transactionId}/update`, action);
    return response.data;
  },

  /**
   * Mark deposit as received
   */
  async markReceived(transactionId: string): Promise<ApiResponse<any>> {
    return this.executeAction(transactionId, { action: 'mark_received' });
  },

  /**
   * Execute swap via Bitso
   */
  async executeSwap(transactionId: string): Promise<ApiResponse<any>> {
    return this.executeAction(transactionId, { action: 'execute_swap' });
  },

  /**
   * Send payout via Infinitus
   */
  async sendPayout(
    transactionId: string,
    payoutDetails: AdminTransactionAction['payoutDetails']
  ): Promise<ApiResponse<any>> {
    return this.executeAction(transactionId, {
      action: 'send_payout',
      payoutDetails,
    });
  },
};

// =====================================================
// KYC API (ADMIN)
// =====================================================

export const adminKycApi = {
  /**
   * Get all KYC records
   */
  async list(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedResponse<KycRecord & { client_profiles?: any }>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.status) queryParams.set('status', params.status);

    const response = await adminAxios.get<PaginatedResponse<KycRecord & { client_profiles?: any }>>(
      `/kyc/list?${queryParams.toString()}`
    );
    return response.data;
  },

  /**
   * Get single KYC record
   */
  async get(kycId: string): Promise<KycRecord | null> {
    const response = await adminAxios.get<ApiResponse<KycRecord>>(`/kyc/${kycId}`);
    return response.data.data || null;
  },

  /**
   * Approve KYC
   */
  async approve(kycId: string, notes?: string): Promise<ApiResponse<KycRecord>> {
    const response = await adminAxios.post<ApiResponse<KycRecord>>(`/kyc/${kycId}/update-status`, {
      status: 'approved',
      notes: notes ? [notes] : [],
    });
    return response.data;
  },

  /**
   * Reject KYC
   */
  async reject(kycId: string, reason: string): Promise<ApiResponse<KycRecord>> {
    const response = await adminAxios.post<ApiResponse<KycRecord>>(`/kyc/${kycId}/update-status`, {
      status: 'rejected',
      notes: [reason],
    });
    return response.data;
  },

  /**
   * Re-run AMLBot check
   */
  async rerunAmlCheck(kycId: string): Promise<ApiResponse<any>> {
    const response = await adminAxios.post<ApiResponse<any>>(`/kyc/${kycId}/amlbot`);
    return response.data;
  },
};

// =====================================================
// PAYOUT API (ADMIN)
// =====================================================

export const adminPayoutApi = {
  /**
   * Get all payout requests
   */
  async list(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.status) queryParams.set('status', params.status);

    const response = await adminAxios.get<PaginatedResponse<any>>(
      `/payouts/list?${queryParams.toString()}`
    );
    return response.data;
  },

  /**
   * Get payout status from Infinitus
   */
  async getStatus(payoutId: string): Promise<ApiResponse<any>> {
    const response = await adminAxios.get<ApiResponse<any>>(`/payouts/${payoutId}/status`);
    return response.data;
  },

  /**
   * Cancel payout
   */
  async cancel(payoutId: string): Promise<ApiResponse<any>> {
    const response = await adminAxios.post<ApiResponse<any>>(`/payouts/${payoutId}/cancel`);
    return response.data;
  },
};

// =====================================================
// COMBINED ADMIN API EXPORT
// =====================================================

export const adminApi = {
  dashboard: dashboardApi,
  transactions: adminTransactionApi,
  kyc: adminKycApi,
  payouts: adminPayoutApi,
};

export default adminApi;
