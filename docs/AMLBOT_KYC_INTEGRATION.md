# AMLBot KYC Integration Documentation

> **Last Updated:** December 26, 2024
> **Version:** 1.0.0
> **Status:** ✅ Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Current Integration Status](#current-integration-status)
3. [File & Folder Structure](#file--folder-structure)
4. [Integration Flow](#integration-flow)
5. [API Endpoints](#api-endpoints)
6. [Document Requirements](#document-requirements)
7. [Environment Configuration](#environment-configuration)
8. [Webhooks](#webhooks)
9. [Verification Statuses](#verification-statuses)
10. [Troubleshooting](#troubleshooting)

---

## Overview

iTransfr integrates with **AMLBot** for KYC (Know Your Customer) and AML (Anti-Money Laundering) verification. This integration allows:

- Automatic applicant creation when a client is onboarded
- Document upload to AMLBot for verification
- Creation of verification requests
- Webhook callbacks for status updates
- Status tracking in the database

### AMLBot API Base URL

```
https://kyc-api.amlbot.com
```

---

## Current Integration Status

| Component | Status | Notes |
|-----------|--------|-------|
| **Applicant Creation** | ✅ Working | Creates PERSON applicants |
| **File Upload** | ✅ Working | Supports PDF, JPG, PNG |
| **Document Creation** | ✅ Working | Links files to document types |
| **Verification Creation** | ✅ Working | Requires form_id |
| **Webhooks** | ✅ Implemented | Endpoint at `/api/webhooks/amlbot` |
| **Status Tracking** | ✅ Working | Updates kyc_records table |

---

## File & Folder Structure

```
src/
├── lib/
│   └── integrations/
│       ├── amlbot.ts                    # Original AMLBot client (utility functions)
│       └── amlbot-kyc-service.ts        # NEW: Complete KYC submission service
│
├── services/
│   └── onboarding-service.ts            # Uses amlbot-kyc-service for Step 8
│
├── app/
│   └── api/
│       ├── kyc/
│       │   ├── amlbot-test/
│       │   │   └── route.ts             # GET - Test AMLBot connection
│       │   ├── amlbot-forms/
│       │   │   └── route.ts             # GET - List available forms
│       │   └── submit-amlbot/
│       │       └── route.ts             # POST - Manual KYC submission
│       │
│       ├── webhooks/
│       │   └── amlbot/
│       │       └── route.ts             # POST - Webhook receiver
│       │
│       └── admin/
│           └── client/
│               └── [id]/
│                   └── submit-kyc/
│                       └── route.ts     # POST/GET - Admin manual KYC trigger
│
└── docs/
    ├── AMLBOT_KYC_INTEGRATION.md        # This documentation
    ├── amlbot-env-sample.txt            # Environment variables sample
    └── KYC-AMLBOT.postman_collection.json  # Postman collection
```

---

## Integration Flow

### Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLIENT ONBOARDING FLOW                          │
└─────────────────────────────────────────────────────────────────────────┘

Step 1-7: Client fills onboarding forms and uploads documents
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     STEP 8: FINAL SUBMISSION                            │
│  → User confirms accuracy and agrees to terms                           │
│  → submitOnboarding() is called in onboarding-service.ts                │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    AMLBOT KYC SERVICE (amlbot-kyc-service.ts)           │
└─────────────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
   ┌─────────┐          ┌─────────┐          ┌─────────┐
   │  STEP 1 │          │  STEP 2 │          │  STEP 3 │
   │ Create  │    ──►   │ Upload  │    ──►   │ Create  │
   │Applicant│          │  Files  │          │Documents│
   └─────────┘          └─────────┘          └─────────┘
        │                     │                     │
        │    POST /applicants │   POST /files       │   POST /documents
        │                     │                     │
        └─────────────────────┴─────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │     STEP 4      │
                    │    Create       │
                    │  Verification   │
                    └─────────────────┘
                              │
                    POST /verifications
                    (requires form_id!)
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    AMLBOT PROCESSING                                    │
│  → Status: "pending"                                                    │
│  → AMLBot AI/Manual review of documents                                 │
│  → May take minutes to hours depending on plan                          │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    WEBHOOK CALLBACK                                     │
│  → AMLBot sends POST to /api/webhooks/amlbot                            │
│  → Event: verification.completed / verification.failed                  │
│  → Updates kyc_records.status in database                               │
│  → If approved: Updates client_profiles.status to 'active'              │
└─────────────────────────────────────────────────────────────────────────┘
```

### Step-by-Step Breakdown

#### 1. Create Applicant
```http
POST https://kyc-api.amlbot.com/applicants
Authorization: Token YOUR_API_KEY
Content-Type: application/json

{
    "type": "PERSON",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "dob": "1990-01-15",
    "residence_country": "US",
    "nationality": "US"
}
```

**Response:**
```json
{
    "applicant_id": "abc123..."
}
```

#### 2. Upload Files
```http
POST https://kyc-api.amlbot.com/files
Authorization: Token YOUR_API_KEY
Content-Type: multipart/form-data

file: [binary data]
```

**Response:**
```json
{
    "file_id": "file123..."
}
```

#### 3. Create Documents
```http
POST https://kyc-api.amlbot.com/documents
Authorization: Token YOUR_API_KEY
Content-Type: application/json

{
    "applicant_id": "abc123...",
    "type": "PASSPORT",
    "front_side_id": "file123...",
    "back_side_id": "file456..."  // Optional
}
```

**Response:**
```json
{
    "document_id": "doc123..."
}
```

#### 4. Create Verification
```http
POST https://kyc-api.amlbot.com/verifications
Authorization: Token YOUR_API_KEY
Content-Type: application/json

{
    "applicant_id": "abc123...",
    "form_id": "7b6ea16b17e0a14f791aa1f9fe5d2812dcf1",
    "callback_url": "https://your-domain.com/api/webhooks/amlbot"
}
```

**Response:**
```json
{
    "verification_id": "ver123...",
    "applicant_id": "abc123..."
}
```

---

## API Endpoints

### Internal APIs (iTransfr)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/kyc/amlbot-test` | Test AMLBot API connection |
| `GET` | `/api/kyc/amlbot-forms` | List available AMLBot forms |
| `POST` | `/api/webhooks/amlbot` | Webhook receiver for AMLBot callbacks |
| `GET` | `/api/webhooks/amlbot` | Webhook health check |
| `POST` | `/api/admin/client/[id]/submit-kyc` | Manually trigger KYC for a client |
| `GET` | `/api/admin/client/[id]/submit-kyc` | Get KYC status for a client |

### AMLBot External APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/applicants` | Create applicant |
| `GET` | `/applicants/{id}` | Get applicant details |
| `PATCH` | `/applicants/{id}` | Update applicant |
| `POST` | `/files` | Upload file |
| `GET` | `/files/{id}` | Get file info |
| `DELETE` | `/files/{id}` | Delete file |
| `POST` | `/documents` | Create document |
| `GET` | `/documents/{id}` | Get document |
| `DELETE` | `/documents/{id}` | Delete document |
| `POST` | `/verifications` | Create verification |
| `GET` | `/verifications/{id}` | Get verification status |
| `GET` | `/forms` | List available forms |

---

## Document Requirements

### For Successful KYC Verification

To get a verification status of **"approved"** instead of **"pending"** or **"invalid"**, you need to upload the correct documents for your form configuration.

#### Required Document Types by Form

| Form | Required Documents |
|------|-------------------|
| **Basic KYC** | Passport OR Government ID |
| **Advanced KYC** | Passport + Selfie |
| **Pro KYC** | Passport + Selfie + Proof of Address |
| **Business Client Onboard V2** | ID Document + Financial Document |
| **KYB** | Business Registration + Proof of Ownership |

#### AMLBot Document Types

| Type | Description | When to Use |
|------|-------------|-------------|
| `PASSPORT` | Passport document | Primary ID for individuals |
| `GOVERNMENT_ID` | National ID card | Alternative to passport |
| `DRIVERS_LICENSE` | Driver's license | Alternative ID |
| `SELFIE` | Photo of person holding ID | Liveness verification |
| `FINANCIAL_DOCUMENT` | Bank statement, etc. | Proof of financial status |
| `OTHER` | Other documents | Business docs, misc |

#### Document Mapping in iTransfr

```typescript
// From amlbot-kyc-service.ts
const DOCUMENT_TYPE_MAP: Record<string, AMLBotDocumentType> = {
  // Personal ID Documents
  passport: 'PASSPORT',
  governmentId: 'GOVERNMENT_ID',
  idCard: 'GOVERNMENT_ID',
  idCardFront: 'GOVERNMENT_ID',
  idCardBack: 'GOVERNMENT_ID',
  driversLicense: 'DRIVERS_LICENSE',
  driversLicenseFront: 'DRIVERS_LICENSE',
  driversLicenseBack: 'DRIVERS_LICENSE',
  selfie: 'SELFIE',

  // Business Documents (map to FINANCIAL_DOCUMENT or OTHER)
  bankStatement: 'FINANCIAL_DOCUMENT',
  formationDocument: 'OTHER',
  proofOfOwnership: 'OTHER',
  proofOfRegistration: 'OTHER',
  taxIdVerification: 'OTHER',
};
```

### Why Documents Show "Invalid" Status

Documents may show "invalid" status because:

1. **Wrong document type for the form** - Form expects PASSPORT but received OTHER
2. **Document quality issues** - Blurry, cropped, or unreadable
3. **Expired document** - ID has expired
4. **Missing required fields** - OCR couldn't extract required data

### Documents Required for Complete Verification

For a **successful/complete** verification:

1. **Upload a PASSPORT or GOVERNMENT_ID** - This is essential for identity verification
2. **Upload a SELFIE** (if required by form) - Holding the ID document
3. **Ensure documents are clear** - Not blurry, fully visible
4. **Documents must be valid** - Not expired

---

## Environment Configuration

Add these to your `.env.local`:

```bash
# AMLBot API Configuration
# ========================

# REQUIRED: Your AMLBot API key
AML_BOT_API_KEY=841037a01227c24d100b78e572faa55f3a83

# REQUIRED: Default form ID for verifications
# Get from: GET https://kyc-api.amlbot.com/forms
AMLBOT_FORM_ID=7b6ea16b17e0a14f791aa1f9fe5d2812dcf1

# Optional: Webhook signature secret
AMLBOT_WEBHOOK_SECRET=your_webhook_secret_here

# Optional: Alternative form ID variable name
AMLBOT_DEFAULT_FORM_ID=7b6ea16b17e0a14f791aa1f9fe5d2812dcf1
```

### Available Forms in Your Account

| Form ID | Name |
|---------|------|
| `7b6ea16b17e0a14f791aa1f9fe5d2812dcf1` | Business Client Onboard V2 |
| `dc18215806c9854b310a6fe7b0b67e954c95` | Basic KYC |
| `3a1c660102a125422409b4a7069373dedc84` | Advanced KYC |
| `db70c13407f8e548380b6687148f0cfcd4fc` | Pro KYC |
| `6b002a3108aa75411c0ad737a0b6d0b9b526` | KYB |
| `aa1c2cab099fa548ec0ab5f791a1be3fd2f8` | KYC_iTransfr |

---

## Webhooks

### Webhook Endpoint

```
POST /api/webhooks/amlbot
```

### Webhook Events

| Event | Description |
|-------|-------------|
| `verification.completed` | Verification finished |
| `verification.failed` | Verification failed |
| `verification.updated` | Status changed |

### Webhook Payload

```json
{
  "event": "verification.completed",
  "data": {
    "verification_id": "ver123...",
    "applicant_id": "app123...",
    "status": "completed",
    "result": "approved",
    "risk_score": 15
  },
  "timestamp": "2024-12-26T10:00:00Z"
}
```

### Webhook Handler Actions

1. **Finds KYC record** by `amlbotRequestId` (verification_id)
2. **Updates KYC status** based on result:
   - `approved` → kyc_records.status = 'approved'
   - `declined` → kyc_records.status = 'rejected'
   - `review_needed` → kyc_records.status = 'pending_review'
3. **Updates client profile** if approved → status = 'active'
4. **Logs webhook receipt** in notes

### Webhook Security

- Signature verification using `x-amlbot-signature` header
- HMAC-SHA256 with `AMLBOT_WEBHOOK_SECRET`

---

## Verification Statuses

### AMLBot Statuses

| Status | Meaning |
|--------|---------|
| `pending` | Verification created, waiting for processing |
| `in_progress` | Being reviewed by AI/human |
| `completed` | Verification finished |
| `failed` | Technical failure |
| `expired` | Verification expired |

### AMLBot Results

| Result | Meaning | iTransfr KYC Status |
|--------|---------|---------------------|
| `approved` | Documents verified | `approved` |
| `declined` | Documents failed | `rejected` |
| `review_needed` | Manual review needed | `pending_review` |

### Document Statuses

| Status | Meaning |
|--------|---------|
| `pending` | Waiting to be processed |
| `valid` | Document accepted |
| `invalid` | Document rejected |

---

## Troubleshooting

### Common Issues

#### 1. "Form ID was not found" Error

**Cause:** Missing or invalid `form_id`

**Solution:**
```bash
# Add to .env.local
AMLBOT_FORM_ID=7b6ea16b17e0a14f791aa1f9fe5d2812dcf1
```

#### 2. "Only one document with OTHER document type is allowed"

**Cause:** Multiple business documents mapping to OTHER

**Solution:** Already handled - service skips duplicates and logs warning

#### 3. Documents showing "invalid" status

**Cause:**
- Wrong document type for form
- Document quality issues
- Missing identity document

**Solution:**
- Ensure at least one PASSPORT or GOVERNMENT_ID is uploaded
- Check document quality
- Match form requirements

#### 4. Verification stuck in "pending"

**Cause:** Normal - waiting for AMLBot processing

**Solution:**
- Wait for webhook callback
- Check status manually: `GET /verifications/{id}`
- May take minutes to hours depending on plan

### Debug Commands

```bash
# Test AMLBot connection
curl http://localhost:3000/api/kyc/amlbot-test

# List available forms
curl -H "Authorization: Token YOUR_API_KEY" \
  https://kyc-api.amlbot.com/forms

# Check verification status
curl -H "Authorization: Token YOUR_API_KEY" \
  https://kyc-api.amlbot.com/verifications/VERIFICATION_ID

# Check applicant details
curl -H "Authorization: Token YOUR_API_KEY" \
  https://kyc-api.amlbot.com/applicants/APPLICANT_ID
```

---

## Related Files

- **Postman Collection:** `docs/KYC-AMLBOT.postman_collection.json`
- **Sample Docs:** `public/dummy-docs/` (for testing)
- **Env Sample:** `docs/amlbot-env-sample.txt`

---

## Support

For AMLBot API issues, refer to:
- AMLBot Documentation: https://kyc-docs.amlbot.com
- AMLBot Dashboard: https://dashboard.amlbot.com
