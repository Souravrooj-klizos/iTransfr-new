# AMLBot Integration Documentation

## Overview

AMLBot is integrated into iTransfr for **transaction-level anti-money laundering checks**. Per the platform design:

| Component | Purpose | Frequency |
|-----------|---------|-----------|
| **KYC** | Identity verification | Once at signup |
| **AMLBot** | Transaction risk screening | Every transaction |

---

## Integration Status ✅

### Completed Components

| Component | File | Status |
|-----------|------|--------|
| AMLBot Client Library | `src/lib/integrations/amlbot.ts` | ✅ Complete |
| AML Transaction Screening | `src/lib/integrations/aml-check.ts` | ✅ Complete |
| Test Connection Endpoint | `/api/kyc/amlbot-test` | ✅ Complete |
| Forms API Endpoint | `/api/kyc/amlbot-forms` | ✅ Complete |
| Submit to AMLBot | `/api/kyc/submit-amlbot` | ✅ Complete |
| Deposit with AML Check | `/api/transactions/deposit` | ✅ Complete |
| Payout with AML Check | `/api/transactions/payout` | ✅ Complete |
| AMLBot Webhook Handler | `/api/webhooks/amlbot` | ✅ Complete |
| Admin AMLBot Status | `/api/admin/kyc/[id]/amlbot` | ✅ Complete |

---

## How AMLBot Works in iTransfr

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER SIGNUP FLOW                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   User Signup → Upload KYC Docs → Admin Review → KYC Approved      │
│                     (Passport, ID, Proof of Address)                │
│                                                                     │
│   Note: AMLBot NOT used here - just document collection             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                     TRANSACTION FLOW (with AMLBot)                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   1. User creates deposit/payout request                            │
│                              ↓                                      │
│   2. System checks: Is KYC approved?                                │
│      ├── No  → Reject transaction                                   │
│      └── Yes → Continue                                             │
│                              ↓                                      │
│   3. AML SCREENING (aml-check.ts)                                   │
│      ├── Check transaction amount                                   │
│      ├── Check transaction frequency (last 24h)                     │
│      ├── Check destination country risk (payouts)                   │
│      └── Calculate risk score (0-100)                               │
│                              ↓                                      │
│   4. Risk Score Evaluation                                          │
│      ├── 0-30  (Low)    → ✅ Auto-approve                           │
│      ├── 31-70 (Medium) → ✅ Approve with flag                      │
│      └── 71-100 (High)  → ❌ Block transaction                      │
│                              ↓                                      │
│   5. If approved → Create transaction record                        │
│      If blocked  → Log & notify support                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Risk Scoring System

### Risk Factors

| Factor | Points Added | Condition |
|--------|--------------|-----------|
| Large amount | +20 | Amount > $10,000 |
| Very large amount | +40 | Amount > $50,000 |
| High frequency | +15 | 5+ transactions in 24h |
| Very high frequency | +30 | 10+ transactions in 24h |
| High-risk country | +50 | Destination: AF, KP, IR, SY, YE |
| Medium-risk country | +20 | Destination: PK, MM, VE, CU |

### Risk Levels

| Score | Level | Action |
|-------|-------|--------|
| 0-30 | Low | Auto-approve ✅ |
| 31-70 | Medium | Approve with monitoring |
| 71-100 | High | Block transaction ❌ |

---

## API Endpoints

### 1. Test AMLBot Connection
```
GET /api/kyc/amlbot-test

Response:
{
  "success": true,
  "message": "AMLBot API connection successful",
  "apiKeyConfigured": true
}
```

### 2. Create Deposit (with AML check)
```
POST /api/transactions/deposit
Authorization: Required (Cookie)

Body:
{
  "amount": 1000,
  "currency": "USD"
}

Response (success):
{
  "success": true,
  "transactionId": "xxx",
  "reference": "DEP-xxx",
  "amlCheck": {
    "passed": true,
    "riskScore": 15,
    "riskLevel": "low"
  },
  "bankDetails": {
    "bankName": "Chase Bank",
    "accountNumber": "1234567890"
  }
}
```

### 3. Create Payout (with AML check)
```
POST /api/transactions/payout
Authorization: Required (Cookie)

Body:
{
  "amount": 83250,
  "currency": "INR",
  "recipient": {
    "name": "Priya Sharma",
    "accountNumber": "123456789012",
    "bankName": "State Bank of India",
    "country": "IN"
  }
}

Response (success):
{
  "success": true,
  "transactionId": "xxx",
  "amlCheck": {
    "passed": true,
    "riskScore": 20,
    "riskLevel": "low"
  }
}
```

### 4. Test Deposit (Development)
```
POST /api/transactions/deposit-test

Body:
{
  "userId": "user-uuid",
  "amount": 1000,
  "currency": "USD"
}
```

---

## Code Structure

```
src/
├── lib/
│   └── integrations/
│       ├── amlbot.ts          # AMLBot API client (external API)
│       └── aml-check.ts       # Transaction screening logic
│
└── app/api/
    ├── kyc/
    │   ├── amlbot-test/       # Test API connection
    │   ├── amlbot-forms/      # List/generate KYC forms (optional)
    │   └── submit-amlbot/     # Submit KYC to AMLBot
    │
    ├── transactions/
    │   ├── deposit/           # Create deposit (with AML check)
    │   ├── deposit-test/      # Test endpoint (no auth)
    │   └── payout/            # Create payout (with AML check)
    │
    ├── webhooks/
    │   └── amlbot/            # Receive AMLBot callbacks
    │
    └── admin/kyc/[id]/
        └── amlbot/            # Admin: Check/trigger AMLBot
```

---

## Environment Variables

```env
# Required for AMLBot
AML_BOT_API_KEY=your_amlbot_api_key

# Optional (for webhook signature verification)
AML_BOT_WEBHOOK_SECRET=your_webhook_secret
```

---

## Complete User Journey

### 1. Signup (No AMLBot)
1. User fills signup form
2. User uploads KYC documents (passport, ID, address proof)
3. KYC record created with status: `pending`
4. Admin reviews documents in Admin Console
5. Admin approves → status: `approved`, profile: `active`

### 2. First Transaction (With AMLBot)
1. User clicks "Deposit"
2. Enters amount: $1,000 USD
3. System checks KYC status = approved ✅
4. **AML Screening runs:**
   - Amount: $1,000 (no extra risk)
   - Frequency: First transaction (no extra risk)
   - Risk score: 0 ✅
5. Transaction approved
6. User receives bank details for deposit

### 3. Large Transaction (Blocked)
1. User clicks "Payout"
2. Enters amount: $75,000 to Syria
3. System checks KYC status = approved ✅
4. **AML Screening runs:**
   - Amount: $75,000 (+40 points)
   - Destination: Syria (+50 points)
   - Risk score: 90 ❌
5. Transaction BLOCKED
6. Support notified, user sees error message

---

## Per Project Guidelines

### Required by "Pod C – Integrations"
> "AMLBot basic call"

**Status: ✅ COMPLETE**

| Requirement | Implementation |
|-------------|----------------|
| Basic call | `amlbot.ts` - `testConnection()` |
| Transaction check | `aml-check.ts` - `screenTransaction()` |
| Webhook handler | `/api/webhooks/amlbot` |
| Callable from script | Yes - API endpoints available |

---

## Testing

### Postman Collection

1. **Test Connection**
   ```
   GET http://localhost:3000/api/kyc/amlbot-test
   ```

2. **Test Deposit (no auth)**
   ```
   POST http://localhost:3000/api/transactions/deposit-test
   {
     "userId": "active-user-uuid",
     "amount": 1000,
     "currency": "USD"
   }
   ```

3. **Test High-Risk Transaction**
   ```
   POST http://localhost:3000/api/transactions/deposit-test
   {
     "userId": "active-user-uuid",
     "amount": 60000,
     "currency": "USD"
   }
   ```

---

## Summary

✅ **AMLBot integration is COMPLETE** per project guidelines.

| Feature | Status |
|---------|--------|
| API Connection | ✅ Working |
| Transaction Screening | ✅ Implemented |
| Risk Scoring | ✅ Implemented |
| Deposit with AML | ✅ Implemented |
| Payout with AML | ✅ Implemented |
| Webhooks | ✅ Ready |
| Admin Controls | ✅ Ready |
