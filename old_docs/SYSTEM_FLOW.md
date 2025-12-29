# iTransfr System Flow & Integration Guide

This document explains the core flows of the iTransfr application, specifically focusing on the integration of third-party services and the money movement lifecycle.

## 1. Core Integrations

iTransfr leverages four key third-party services to power its remittance and financial operations:

### A. AMLBot (KYC & Compliance)
*   **Purpose**: Identity verification and risk screening.
*   **Flow**:
    1.  **KYC Submission**: When a user submits KYC (Passport/Selfie), the data is sent to AMLBot via `POST /api/kyc/submit-amlbot`.
    2.  **Verification**: AMLBot processes the documents.
    3.  **Webhook**: AMLBot calls our webhook `POST /api/webhooks/amlbot` with the result (`approved`, `rejected`, `resubmit`).
    4.  **Database**: The user's `kyc_status` in `client_profiles` is updated automatically.
*   **Transaction Screening**: Every deposit and payout is screened against sanctions lists using AMLBot's scoring API to ensure compliance.

### B. Turnkey (Crypto Wallets)
*   **Purpose**: Secure, non-custodial-style wallet infrastructure for generating deposit addresses.
*   **Flow**:
    1.  **Wallet Creation**: When a user visits "Deposit", `src/lib/integrations/turnkey.ts` checks if they have a wallet. If not, it calls Turnkey to create a sub-organization/wallet for that user.
    2.  **Address Generation**: It derives addresses for ETH, TRON, and SOL.
    3.  **Deposit**: Users send crypto to these addresses.
    4.  **Detection**: (Currently simulated) In a real prod env, a blockchain indexer would detect the transfer and call `POST /api/webhooks/deposits` to credit the user's ledger.

### C. Bitso (Liquidity & FX)
*   **Purpose**: Converting Crypto (USDC/USDT) to Fiat (USD/MXN/BRL/EUR) for payouts.
*   **Flow**:
    1.  **Quote**: When a swap is requested, `src/lib/integrations/bitso.ts` gets a quote.
    2.  **Execute**: The admin executes the swap. Funds are moved from the generic "Crypto Source" balance to "Fiat Destination" balance in the master Bitso account.
    3.  **Ledger**: The system records a `SWAP` transaction, debiting the user's crypto balance and crediting their fiat balance (or holding it for payout).

### D. Infinitus (Global Payouts)
*   **Purpose**: Last-mile delivery of fiat funds to bank accounts.
*   **Flow**:
    1.  **Payout Request**: Admin triggers `adminApi.payouts.send()`.
    2.  **API Call**: `src/lib/integrations/infinitus.ts` calls Infinitus API with beneficiary details.
    3.  **Tracking**: Infinitus returns a `payoutId`. The system tracks this status.

---

## 2. Transaction Flows

### A. Deposit Flow (Client)
1.  **User**: Navigates to `/deposit`, selects Crypto (e.g., USDT Tron).
2.  **System**: Calls `/api/wallets/deposit-address` -> Turnkey API -> Returns Address.
3.  **User**: Sends USDT to address.
4.  **Admin/System**: (Manual or Webhook) Marks deposit as "Received".
5.  **Ledger**: `POST /api/transactions/deposit` is called.
    *   Creates `DEPOSIT` record.
    *   Updates `wallets` table (User's Balance +Amount).

### B. Money Transfer Flow (Client -> Admin -> Payout)
This is the core remittance loop.

1.  **Client Initiates**:
    *   User goes to `/send`.
    *   Enters Amount (e.g., 1000 USDC) and Recipient (Bank Account in India).
    *   System calculates fees.
    *   User clicks "Send".
2.  **Request Created**:
    *   `POST /api/recipients/create` saves beneficiary.
    *   `POST /api/transactions/payout` creates a `PAYOUT_REQUEST` transaction.
    *   **Funds Locked**: The user's wallet balance is *immediately* debited (or frozen) to prevent double-spend.
3.  **Admin Review**:
    *   Admin sees "Payout Request" in `/admin/payouts`.
    *   Admin reviews AML Score and Recipient.
4.  **Execution (Swap & Send)**:
    *   **Swap**: If the user sent USDC but payout is EUR, Admin first clicks "Execute Swap" (Bitso).
    *   **Payout**: Admin clicks "Send Payout" (Infinitus).
    *   System calls `Infinitus.createPayout()`.
5.  **Completion**:
    *   Transaction status -> `COMPLETED`.
    *   User notified.

---

## 3. Data Architecture

*   **`client_profiles`**: User identity & KYC status.
*   **`wallets`**: Balances per currency/chain.
*   **`transactions`**: Double-entry ledger for every movement.
*   **`kyc_records`**: History of KYC submissions and AML scores.
