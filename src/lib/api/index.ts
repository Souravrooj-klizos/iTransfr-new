/**
 * API Module Exports
 *
 * Barrel file for all API-related exports.
 */

// Axios instances and helpers
export { adminAxios, clientAxios, createServerAxios, getErrorMessage, isHttpError } from './axios';

// Client API services
export { clientApi, depositApi, payoutApi, profileApi, transactionApi, walletApi } from './client';

// Admin API services
export { adminApi, adminKycApi, adminPayoutApi, adminTransactionApi, dashboardApi } from './admin';

// Types
export type {
  AdminTransactionAction,
  ApiResponse,
  CreateDepositRequest,
  CreatePayoutRequest,
  DashboardStats,
  DepositAddress,
  KycRecord,
  KycStatus,
  PaginatedResponse,
  PayoutEstimate,
  Transaction,
  TransactionStatus,
  TransactionType,
  UserProfile,
  Wallet,
  WalletBalance,
} from './types';
