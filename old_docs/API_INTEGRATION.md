# API Integration & Refactoring Guide

## Overview

We have migrated the application to use a robust `axios`-based API architecture. This ensures consistent error handling, automatic authentication injection, and type safety across both frontend and backend communication.

## Core Structure

### 1. API Configuration (`src/lib/api/axios.ts`)

- **`clientAxios`**: For authenticated client-side requests.
  - Base URL: `/api`
  - Interceptors: Injects Bearer token from Supabase session.
- **`adminAxios`**: For authenticated admin-side requests.
  - Base URL: `/api/admin`
  - Interceptors: Injects Bearer token, checks for admin role.
- **`serverAxios`**: For server-side third-party integrations (Turnkey, Bitso, etc.).

### 2. Service Modules (`src/lib/api`)

- **`client.ts`**: Client-facing API methods.
  - `wallets`: List wallets, get deposit addresses.
  - `transactions`: List transactions, get details.
  - `deposits`: Create deposit requests.
  - `payouts`: Create payout requests.
  - `profile`: Manage user profile and KYC.

- **`admin.ts`**: Admin console API methods.
  - `dashboard`: Get system stats.
  - `transactions`: Manage global transactions.
  - `kyc`: Review and approve/reject KYC.
  - `payouts`: Monitor banking payouts.

- **`types.ts`**: Shared TypeScript definitions for all API request/response objects.

## Integration Details

### Client-Side Data Fetching

All frontend pages now use the centralized API services instead of raw `fetch` calls.

**Example: Fetching Wallets**
```typescript
import clientApi from '@/lib/api/client';

const wallets = await clientApi.wallets.list();
```

**Example: Creating a Deposit**
```typescript
import clientApi from '@/lib/api/client';

await clientApi.deposits.create({
  amount: 1000,
  currency: 'USDT',
  chain: 'tron',
  source: 'crypto'
});
```

### Server-Side Integrations

External services are integrated via dedicated modules in `src/lib/integrations/` which utilize the `axios` configuration.

1.  **Turnkey**: Wallet generation and signing.
2.  **Bitso**: Crypto-to-Fiat exchange (SWAP).
3.  **Infinitus**: Global bank payouts.
4.  **AMLBot**: Security screening.

## Backend Route Standards

All API routes follow a standard response format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

### Key Endpoints

- **Client**:
  - `GET /api/wallets/list`
  - `GET /api/wallets/deposit-address`
  - `GET /api/transactions/list`
  - `POST /api/transactions/deposit`
  - `POST /api/transactions/payout`

- **Admin**:
  - `GET /api/admin/transactions/list`
  - `POST /api/admin/transactions/[id]/update` (Actions: Mark Received, Swap, Payout)
  - `GET /api/admin/kyc/list`
  - `POST /api/admin/kyc/[id]/update-status`

## Troubleshooting

- **401 Unauthorized**: Session expired. The interceptor will redirect to login.
- **403 Forbidden**: User not allowed (e.g., failed KYC or non-admin accessing admin routes).
- **500 Internal Error**: Check server logs. Integration API failures are logged with context.
