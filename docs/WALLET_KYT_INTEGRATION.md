# Wallet & KYT Integration Progress

**Last Updated:** 2026-01-06

## Overview

This document tracks the implementation progress of Turnkey Wallet integration and KYT (Know Your Transaction) system for iTransfr.

---

## 🎯 Implementation Scope

### Networks Supported
- ✅ Ethereum (EVM) - USDT, USDC, ETH
- ✅ Solana (SVM) - USDT, USDC, SOL
- ✅ Tron - USDT, USDC, TRX

### Features
- Wallet creation via Turnkey API
- Multi-chain wallet addresses
- Client-wallet linking
- KYT wallet screening (AMLBot)
- Continuous monitoring with alerts
- Transaction signing (future)

---

## 📋 Implementation Checklist

### Phase 1: Database Schema
- [x] Create `wallets` table enhancement migration
- [x] Create `aml_alerts` table
- [x] Create `aml_screenings` table
- [x] Create `client_wallet_links` table
- [x] Create `addressbook` table (whitelisting)
- [ ] Run migration on Supabase

### Phase 2: Turnkey Wallet Integration
- [x] Basic Turnkey SDK setup (`src/lib/integrations/turnkey.ts`)
- [x] Enhance wallet creation for all networks
- [x] Add Solana transaction helper
- [x] Add Ethereum transaction helper
- [x] Add Tron transaction helper
- [ ] Create wallet balances fetcher
- [x] Create wallet API routes:
  - [x] `POST /api/admin/wallets` (create)
  - [x] `GET /api/admin/wallets`
  - [x] `GET /api/admin/wallets/:id`
  - [ ] `GET /api/admin/wallets/:id/balances`
  - [x] `POST /api/admin/client/:id/wallet`

### Phase 3: KYT (Know Your Transaction)
- [x] Create AMLBot KYT service (`amlbot-kyt.ts`)
- [x] Implement address screening
- [x] Implement monitoring subscription
- [x] Implement webhook handler
- [x] Create KYT API routes:
  - [x] `POST /api/kyt/screen`
  - [x] `POST /api/kyt/monitor`
  - [x] `DELETE /api/kyt/monitor` (query param)
  - [x] `GET /api/kyt/alerts`
  - [x] `PATCH /api/kyt/alerts/:id`
  - [x] `POST /api/kyt/webhook`

### Phase 4: Admin UI Components
- [x] Wallet management page (`/admin/wallets`)
- [x] KYT alerts page (`/admin/kyt/alerts`)
- [x] KYT monitored wallets page (Merged into `/admin/wallets`)
- [x] Client wallet tab in client detail page

### Phase 5: Integration & Testing
- [x] Link wallet creation to client onboarding
- [ ] Wallet balances fetcher (Optional/Future)
- [ ] End-to-end testing
- [ ] Test monitoring webhooks
- [ ] End-to-end testing

---

## 🔑 Environment Variables Required

```env
# Turnkey Credentials (Already Configured ✅)
TURNKEY_ORGANIZATION_ID=85df6c3a-cae6-44c4-9e54-9296b4d1f534
TURNKEY_API_PUBLIC_KEY=033788231c9d7f734c22912cb5ebff03869cc3ba25bce2bebfbc7f27014c8812c0
TURNKEY_API_PRIVATE_KEY=e89b93e884be6836bb219711fcc0c75da5b9489eee7b69e65f80bc1845b9bf45
TURNKEY_BASE_URL=https://api.turnkey.com

# AMLBot KYT Credentials (Already Configured ✅)
AMLBOT_KYT_ACCESS_ID=81247-79B2E-D917D85
AMLBOT_KYT_ACCESS_KEY=5Hki9LNuGTT-oAwSqsRX1-tbjfRMg-OStMNlmU3Rc-s2G3sqy-kIXDlNHhg-zc9r47zMX-2Vd6juPJ
AMLBOT_WEBHOOK=https://i-transfr-new.vercel.app/api/webhooks/amlbot

# Development Mode (set to 'true' for mock wallets)
TURNKEY_DEV_MODE=true
```

---

## 📁 File Structure

```
src/
├── lib/
│   └── integrations/
│       ├── turnkey.ts              # Turnkey SDK wrapper (enhanced)
│       ├── turnkey-solana.ts       # Solana transaction helpers
│       └── amlbot-kyt.ts           # KYT service (NEW)
│
├── app/api/
│   ├── admin/
│   │   └── wallets/
│   │       ├── route.ts            # GET wallets
│   │       ├── create/route.ts     # POST create wallet
│   │       └── [id]/
│   │           ├── route.ts        # GET wallet by ID
│   │           └── balances/route.ts
│   │
│   ├── kyt/
│   │   ├── screen/route.ts         # Screen address
│   │   ├── monitor/route.ts        # Enable monitoring
│   │   ├── alerts/
│   │   │   ├── route.ts            # List alerts
│   │   │   └── [id]/route.ts       # Update alert
│   │   └── webhook/route.ts        # Webhook receiver
│   │
│   └── clients/
│       └── [id]/
│           └── wallet/route.ts     # Create client wallet
│
└── components/admin/
    ├── wallets/
    │   └── WalletsList.tsx
    └── kyt/
        ├── AlertsList.tsx
        └── MonitoredWallets.tsx
```

---

## 🗄️ Database Schema Changes

### Enhanced `wallets` Table
```sql
-- Additional columns for the existing wallets table
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS network TEXT;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS wallet_type TEXT DEFAULT 'client';
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS label TEXT;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
-- KYT fields
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS aml_risk_score DECIMAL(5,2);
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS aml_status TEXT DEFAULT 'not_checked';
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS aml_monitoring_enabled BOOLEAN DEFAULT false;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS aml_monitoring_uid TEXT;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS aml_last_checked TIMESTAMP WITH TIME ZONE;
```

### New `aml_alerts` Table
```sql
CREATE TABLE aml_alerts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  wallet_id TEXT REFERENCES wallets(id),
  address TEXT NOT NULL,
  network TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  previous_risk_score DECIMAL(5,2),
  new_risk_score DECIMAL(5,2),
  risk_signals JSONB,
  severity TEXT NOT NULL,
  amlbot_uid TEXT,
  amlbot_payload JSONB,
  status TEXT DEFAULT 'unread',
  reviewed_by UUID REFERENCES admin_profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### New `aml_screenings` Table
```sql
CREATE TABLE aml_screenings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  wallet_id TEXT REFERENCES wallets(id),
  address TEXT NOT NULL,
  network TEXT NOT NULL,
  risk_score DECIMAL(5,2),
  risk_signals JSONB,
  is_blacklisted BOOLEAN DEFAULT false,
  amlbot_uid TEXT,
  amlbot_response JSONB,
  check_type TEXT DEFAULT 'manual',
  triggered_by UUID REFERENCES admin_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 📊 Progress Summary

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Database | ✅ Complete | 90% (migration created, needs to run) |
| Phase 2: Wallet Integration | ✅ Complete | 90% (balances fetcher remaining) |
| Phase 3: KYT System | ✅ Complete | 100% |
| Phase 4: Admin UI | ⏳ Pending | 0% |
| Phase 5: Testing | ⏳ Pending | 0% |

**Overall Progress: ~65%**

---

## 📝 Files Created/Modified

### New Files
| File | Description |
|------|-------------|
| `database/WALLET_KYT_MIGRATION.sql` | Complete database migration for wallets and KYT tables |
| `src/lib/integrations/amlbot-kyt.ts` | KYT service for AMLBot wallet screening |
| `src/lib/integrations/turnkey-signing.ts` | Enhanced Turnkey service with transaction signing |
| `src/app/api/admin/wallets/route.ts` | Wallet list and create API |
| `src/app/api/admin/wallets/[id]/route.ts` | Wallet detail API |
| `src/app/api/admin/client/[id]/wallet/route.ts` | Client-specific wallet API |
| `src/app/api/kyt/screen/route.ts` | KYT address screening API |
| `src/app/api/kyt/monitor/route.ts` | KYT monitoring enable/disable API |
| `src/app/api/kyt/alerts/route.ts` | KYT alerts list API |
| `src/app/api/kyt/alerts/[id]/route.ts` | KYT alert detail API |
| `src/app/api/kyt/webhook/route.ts` | AMLBot webhook receiver |
| `docs/WALLET_KYT_INTEGRATION.md` | This progress tracking document |

### Existing Files Enhanced
| File | Changes |
|------|---------|
| `src/lib/integrations/turnkey.ts` | Already had basic wallet creation (still valid) |

---

## 🚀 Next Steps (Remaining Work)

### Immediate (Required)
1. **Run Database Migration**
   ```bash
   # In Supabase SQL Editor, run:
   database/WALLET_KYT_MIGRATION.sql
   ```

2. **Update Environment Variables**
   - Ensure `AMLBOT_KYT_ACCESS_ID` and `AMLBOT_KYT_ACCESS_KEY` are set
   - For production, update `AMLBOT_WEBHOOK` URL

### Optional (Future Enhancements)
1. **Admin UI Components**
   - Create `/admin/wallets` page for wallet management
   - Create `/admin/kyt/alerts` page for alert dashboard
   - Add wallet tab to client detail page

2. **Wallet Balances Fetcher**
   - Integrate with blockchain RPC to fetch real balances
   - Create `GET /api/admin/wallets/:id/balances` endpoint

3. **Client Onboarding Integration**
   - Auto-create wallet during Step 8 (onboarding completion)
   - Run KYT screening on new wallets automatically

---

## 📋 API Endpoints Summary

### Wallet Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/wallets` | List all wallets |
| POST | `/api/admin/wallets` | Create new wallet |
| GET | `/api/admin/wallets/:id` | Get wallet details |
| PATCH | `/api/admin/wallets/:id` | Update wallet |
| DELETE | `/api/admin/wallets/:id` | Deactivate wallet |
| GET | `/api/admin/client/:id/wallet` | Get client's wallets |
| POST | `/api/admin/client/:id/wallet` | Create wallet for client |

### KYT (Know Your Transaction)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/kyt/screen` | Screen an address |
| POST | `/api/kyt/monitor` | Enable monitoring |
| DELETE | `/api/kyt/monitor?walletId=X` | Disable monitoring |
| GET | `/api/kyt/alerts` | List all alerts |
| GET | `/api/kyt/alerts/:id` | Get alert details |
| PATCH | `/api/kyt/alerts/:id` | Update alert status |
| POST | `/api/kyt/webhook` | Webhook receiver |

---

## 📝 Notes

1. **Turnkey Dev Mode**: Set `TURNKEY_DEV_MODE=true` for local development to use mock wallets
2. **KYT vs KYC**: KYT (wallet screening) is separate from KYC (document verification)
3. **Webhook URL**: The webhook URL should be configured in AMLBot dashboard
4. **Network Mapping**: 
   - Ethereum → ETH
   - Solana → SOL
   - Tron → TRX

---

## 🔗 References

- [Turnkey SDK Documentation](https://docs.turnkey.com/)
- [Turnkey Solana Guide](https://docs.turnkey.com/networks/solana)
- [AMLBot API Documentation](https://docs.amlbot.com/)
- MVP Reference: `iTransfr-Admin-MVP` project
