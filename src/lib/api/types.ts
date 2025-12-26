/**
 * API Types
 * Shared types for API responses and requests
 */

// =====================================================
// GENERIC API RESPONSE
// =====================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// =====================================================
// WALLET TYPES
// =====================================================

export interface Wallet {
  id: string;
  userId: string;
  currency: string;
  chain: string;
  address: string;
  balance: number;
  status: 'active' | 'inactive' | 'frozen';
  createdAt: string;
  updatedAt: string;
}

export interface WalletBalance {
  currency: string;
  chain: string;
  address: string;
  balance: number;
  formattedBalance: string;
  icon?: string;
}

// =====================================================
// TRANSACTION TYPES
// =====================================================

export type TransactionType = 'deposit' | 'withdrawal' | 'swap' | 'payout';
export type TransactionStatus =
  | 'PENDING'
  | 'DEPOSIT_REQUESTED'
  | 'DEPOSIT_RECEIVED'
  | 'SWAP_IN_PROGRESS'
  | 'SWAP_COMPLETED'
  | 'PAYOUT_IN_PROGRESS'
  | 'PAYOUT_COMPLETED'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: string;
  currencyFrom?: string;
  currencyTo?: string;
  amountFrom?: number;
  amountTo?: number;
  exchangeRate?: number;
  referenceNumber: string;
  recipientName?: string;
  recipientBank?: string;
  recipientAccount?: string;
  metadata?: Record<string, any>;
  amlCheckId?: string;
  amlRiskScore?: number;
  createdAt: string;
  updatedAt: string;
}

// =====================================================
// DEPOSIT REQUEST TYPES
// =====================================================

export interface CreateDepositRequest {
  amount: number;
  currency: string;
  chain?: string;
  source: 'crypto' | 'wire' | 'swift' | 'sepa';
}

export interface DepositAddress {
  currency: string;
  chain: string;
  address: string;
  qrCode?: string;
  memo?: string;
  expiresAt?: string;
}

// =====================================================
// PAYOUT REQUEST TYPES
// =====================================================

export interface CreatePayoutRequest {
  amount: number;
  sourceCurrency: string;
  destinationCurrency: string;
  recipientId?: string;
  recipientName: string;
  recipientEmail?: string;
  bankName: string;
  bankCode?: string;
  accountNumber: string;
  accountType?: 'checking' | 'savings';
  country: string;
  note?: string;
}

export interface PayoutEstimate {
  fromAmount: number;
  fromCurrency: string;
  toAmount: number;
  toCurrency: string;
  exchangeRate: number;
  fee: number;
  totalCost: number;
  recipientGets: number;
}

// =====================================================
// KYC TYPES
// =====================================================

export type KycStatus = 'pending' | 'under_review' | 'approved' | 'rejected';

export interface KycRecord {
  id: string;
  userId: string;
  status: KycStatus;
  documentType?: string;
  amlBotApplicantId?: string;
  amlBotVerificationId?: string;
  riskScore?: number;
  notes?: string[];
  createdAt: string;
  updatedAt: string;
  client_profiles?: {
    id: string;
    first_name: string;
    last_name: string;
    company_name: string;
  };
  kyc_documents?: {
    id: string;
    documentType: string;
    fileUrl: string;
    fileName: string;
    s3Key?: string;
    fileSize?: number;
    mimeType?: string;
    uploadedAt?: string;
  }[];
}

// =====================================================
// USER/PROFILE TYPES
// =====================================================

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  companyName?: string;
  phone?: string;
  mobileNumber?: string; // Alias or specific field
  address?: string;
  timezone?: string;
  language?: string;
  country?: string;
  status: 'pending' | 'active' | 'suspended';
  kycStatus: KycStatus;
  createdAt: string;
}

// =====================================================
// ADMIN TYPES
// =====================================================

export interface DashboardStats {
  totalClients: number;
  pendingKYC: number;
  approvedKYC: number;
  rejectedKYC: number;
  pendingTransactions: number;
  completedTransactions: number;
  totalVolume: number;
}

export interface AdminTransactionAction {
  action: 'mark_received' | 'execute_swap' | 'send_payout';
  payoutDetails?: {
    recipientName: string;
    accountNumber: string;
    bankName: string;
    bankCode?: string;
    country?: string;
    recipientEmail?: string;
    accountType?: 'checking' | 'savings';
  };
}
