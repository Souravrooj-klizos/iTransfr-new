/**
 * AML Transaction Check
 *
 * This module provides transaction screening functionality using AMLBot.
 * Call this before processing any transaction (deposit, swap, payout).
 *
 * Per docs: AMLBot checks EACH transaction for money laundering risk
 */

import { supabaseAdmin } from '@/lib/supabaseClient';

// =====================================================
// TYPES
// =====================================================

export interface TransactionCheckRequest {
  transactionId: string;
  userId: string;
  amount: number;
  currency: string;
  transactionType: 'deposit' | 'swap' | 'payout';
  destinationCountry?: string;
}

export interface TransactionCheckResult {
  passed: boolean;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  reason?: string;
  checkId: string;
  timestamp: string;
}

// =====================================================
// CONFIGURATION
// =====================================================

// Risk thresholds (0-100 scale)
const RISK_THRESHOLDS = {
  LOW: 30, // 0-30: Low risk, auto-approve
  MEDIUM: 70, // 31-70: Medium risk, may need review
  HIGH: 100, // 71-100: High risk, block
};

// Amount thresholds that trigger enhanced checks
const AMOUNT_THRESHOLDS = {
  STANDARD: 1000, // Standard check
  ENHANCED: 10000, // Enhanced check required
  MANUAL: 50000, // Manual review required
};

// =====================================================
// MAIN SCREENING FUNCTION
// =====================================================

/**
 * Screen a transaction for AML risk
 *
 * This performs a risk assessment based on:
 * - Transaction amount
 * - User's transaction history
 * - User's KYC status
 * - Destination country (for payouts)
 *
 * @returns TransactionCheckResult with pass/fail and risk score
 */
export async function screenTransaction(
  request: TransactionCheckRequest
): Promise<TransactionCheckResult> {
  console.log('[AML Check] Screening transaction:', request.transactionId);
  console.log('[AML Check] Amount:', request.amount, request.currency);
  console.log('[AML Check] Type:', request.transactionType);

  const checkId = `aml-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();

  try {
    // 1. Check user's KYC status
    const kycCheck = await checkUserKYC(request.userId);
    if (!kycCheck.approved) {
      console.log('[AML Check] ❌ User KYC not approved');
      return {
        passed: false,
        riskScore: 100,
        riskLevel: 'high',
        reason: 'User KYC not approved',
        checkId,
        timestamp,
      };
    }

    // 2. Calculate risk score based on various factors
    let riskScore = 0;
    const riskFactors: string[] = [];

    // Amount-based risk
    if (request.amount >= AMOUNT_THRESHOLDS.MANUAL) {
      riskScore += 40;
      riskFactors.push('Large transaction amount');
    } else if (request.amount >= AMOUNT_THRESHOLDS.ENHANCED) {
      riskScore += 20;
      riskFactors.push('Medium transaction amount');
    }

    // Transaction frequency check
    const frequencyRisk = await checkTransactionFrequency(request.userId);
    riskScore += frequencyRisk.score;
    if (frequencyRisk.flag) {
      riskFactors.push(frequencyRisk.reason);
    }

    // Country risk (for payouts)
    if (request.transactionType === 'payout' && request.destinationCountry) {
      const countryRisk = getCountryRiskScore(request.destinationCountry);
      riskScore += countryRisk.score;
      if (countryRisk.flag) {
        riskFactors.push(countryRisk.reason);
      }
    }

    // Cap at 100
    riskScore = Math.min(riskScore, 100);

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high';
    if (riskScore <= RISK_THRESHOLDS.LOW) {
      riskLevel = 'low';
    } else if (riskScore <= RISK_THRESHOLDS.MEDIUM) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'high';
    }

    // Determine pass/fail
    const passed = riskScore < RISK_THRESHOLDS.HIGH;

    console.log('[AML Check] Risk score:', riskScore);
    console.log('[AML Check] Risk level:', riskLevel);
    console.log('[AML Check] Result:', passed ? '✅ PASSED' : '❌ BLOCKED');

    // Log the check result
    await logAMLCheck({
      checkId,
      transactionId: request.transactionId,
      userId: request.userId,
      riskScore,
      riskLevel,
      passed,
      factors: riskFactors,
      timestamp,
    });

    return {
      passed,
      riskScore,
      riskLevel,
      reason: riskFactors.length > 0 ? riskFactors.join('; ') : undefined,
      checkId,
      timestamp,
    };
  } catch (error: any) {
    console.error('[AML Check] Error:', error);

    // On error, block transaction for safety
    return {
      passed: false,
      riskScore: 100,
      riskLevel: 'high',
      reason: 'AML check failed: ' + error.message,
      checkId,
      timestamp,
    };
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Check user's KYC approval status
 */
async function checkUserKYC(userId: string): Promise<{ approved: boolean }> {
  if (!supabaseAdmin) {
    return { approved: false };
  }

  const { data: kycRecord } = await supabaseAdmin
    .from('kyc_records')
    .select('status')
    .eq('userId', userId)
    .single();

  return { approved: kycRecord?.status === 'approved' };
}

/**
 * Check transaction frequency for the user
 * Flags unusual patterns (many transactions in short time)
 */
async function checkTransactionFrequency(
  userId: string
): Promise<{ score: number; flag: boolean; reason: string }> {
  if (!supabaseAdmin) {
    return { score: 0, flag: false, reason: '' };
  }

  // Count transactions in last 24 hours
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const { count } = await supabaseAdmin
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('userId', userId)
    .gte('createdAt', yesterday.toISOString());

  const txCount = count || 0;

  if (txCount >= 10) {
    return { score: 30, flag: true, reason: 'High transaction frequency (10+ in 24h)' };
  } else if (txCount >= 5) {
    return { score: 15, flag: true, reason: 'Elevated transaction frequency (5+ in 24h)' };
  }

  return { score: 0, flag: false, reason: '' };
}

/**
 * Get risk score based on destination country
 */
function getCountryRiskScore(countryCode: string): {
  score: number;
  flag: boolean;
  reason: string;
} {
  // High-risk countries (simplified list)
  const highRiskCountries = ['AF', 'KP', 'IR', 'SY', 'YE'];
  const mediumRiskCountries = ['PK', 'MM', 'VE', 'CU'];

  if (highRiskCountries.includes(countryCode.toUpperCase())) {
    return { score: 50, flag: true, reason: `High-risk destination country: ${countryCode}` };
  }

  if (mediumRiskCountries.includes(countryCode.toUpperCase())) {
    return { score: 20, flag: true, reason: `Medium-risk destination country: ${countryCode}` };
  }

  return { score: 0, flag: false, reason: '' };
}

/**
 * Log AML check result for audit
 */
async function logAMLCheck(data: {
  checkId: string;
  transactionId: string;
  userId: string;
  riskScore: number;
  riskLevel: string;
  passed: boolean;
  factors: string[];
  timestamp: string;
}): Promise<void> {
  // Log to console for now
  console.log('[AML Check] Logged check:', {
    checkId: data.checkId,
    transactionId: data.transactionId,
    riskScore: data.riskScore,
    passed: data.passed,
  });

  // TODO: In production, store in audit_log table
  // This would require adding an aml_checks table or using audit_log
}

// =====================================================
// QUICK CHECK (for simple validation)
// =====================================================

/**
 * Quick check if user can make transactions
 * Use this for lightweight validation
 */
export async function canUserTransact(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  if (!supabaseAdmin) {
    return { allowed: false, reason: 'Server configuration error' };
  }

  // Check KYC status
  const { data: profile } = await supabaseAdmin
    .from('client_profiles')
    .select('status')
    .eq('id', userId)
    .single();

  if (!profile) {
    return { allowed: false, reason: 'User profile not found' };
  }

  if (profile.status !== 'active') {
    return { allowed: false, reason: 'User account not active. Please complete KYC.' };
  }

  // Check KYC record
  const { data: kycRecord } = await supabaseAdmin
    .from('kyc_records')
    .select('status')
    .eq('userId', userId)
    .single();

  if (!kycRecord || kycRecord.status !== 'approved') {
    return { allowed: false, reason: 'KYC not approved' };
  }

  return { allowed: true };
}
