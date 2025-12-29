# iTransfer Platform - Complete Explanation (English)

## What is iTransfer?

**iTransfer** (also known as **iTransfr**) is a **remittance platform** that enables secure, compliant international money transfers. It allows customers to send money from one country to another with proper currency conversion, security checks, and regulatory compliance.

**Simple Definition:** A digital platform where people can send money internationally (like from USA to India, USA to Mexico, etc.) with automatic currency conversion and security checks.

---

## Platform Overview

### Core Purpose
- Enable international money transfers (remittances)
- Convert currencies automatically (e.g., USD to INR, USD to MXN)
- Ensure security and compliance with financial regulations
- Provide transparent tracking and receipts

### Key Features
1. **Customer Portal** - Where customers send money
2. **Admin Console** - Where admins manage transactions and KYC
3. **Secure Wallet System** - Stores customer funds
4. **Currency Exchange** - Converts between currencies
5. **Compliance Checks** - KYC and AML verification
6. **Bank Payouts** - Sends money to recipient banks

---

## Platform Architecture

### Three Main Applications

#### 1. Client Portal (Port 3000)
**What it is:** The customer-facing website where users send money.

**Features:**
- User registration and login
- KYC document upload
- Create deposit transactions
- View wallet balance
- Create swap (currency exchange) requests
- Create payout requests
- View transaction history
- Download receipts

**Who uses it:** Regular customers (Raj, Priya, etc.)

**Code Location:** `apps/client-portal/`

---

#### 2. Admin Console (Port 3001)
**What it is:** The administrative dashboard for managing the platform.

**Features:**
- Review and approve/reject KYC documents
- View all customer transactions
- Mark deposits as received
- Execute currency swaps
- Send payouts to recipients
- View audit logs
- Monitor platform activity

**Who uses it:** Platform administrators and staff

**Code Location:** `apps/admin-console/`

---

#### 3. API Backend (Port 3002)
**What it is:** The server that handles all business logic and integrations.

**Features:**
- Authentication and authorization
- Transaction processing
- Database operations
- Integration with external services (Bitso, Infinitus, AMLBot, Turnkey)
- Email notifications
- PDF receipt generation
- Ledger management

**Code Location:** `apps/api/`

---

## Technology Stack

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS
- **Language:** TypeScript
- **Authentication:** Supabase Auth

### Backend
- **Framework:** Next.js API Routes
- **Database:** PostgreSQL (via Supabase)
- **Language:** TypeScript

### External Integrations
- **Bitso:** Currency exchange (FX swaps)
- **Infinitus:** Bank payout processing
- **AMLBot:** Anti-money laundering checks
- **Turnkey:** Wallet management

---

## How iTransfer Works - Complete Flow

### Example Scenario
**Raj (USA)** wants to send **$1,000 USD** to **Priya (India)** in **Indian Rupees (INR)**.

---

## Step-by-Step Process

### Step 1: Customer Registration & KYC

**What happens:**
1. Raj signs up on iTransfer Client Portal
2. Raj uploads KYC documents:
   - Passport copy
   - Proof of address
   - Photo ID
3. Status: **"Pending"** → **"Submitted"**
4. Admin reviews documents in Admin Console
5. Admin approves: Status → **"Approved"**
6. Raj can now use the platform

**Important:** KYC is done **ONCE** when customer registers, not for every transaction.

**Code Locations:**
- Customer uploads: `apps/client-portal/src/app/kyc/page.tsx`
- Admin reviews: `apps/admin-console/src/app/kyc-review/page.tsx`
- API endpoint: `apps/api/src/app/api/kyc/upload/route.ts`

---

### Step 2: AMLBot Check - Transaction Security

**What is AMLBot?**
- AMLBot checks **EACH transaction** for money laundering risk
- Different from KYC - this happens for every transaction
- Uses customer's KYC data + transaction details

**Process for $1,000 transfer:**
1. Raj initiates $1,000 transfer to Priya
2. System sends to AMLBot:
   - Customer ID: Raj
   - Amount: $1,000 USD
   - Currency: USD
   - Destination: India (INR)
   - Customer's KYC status: Approved
   - Transaction history
3. AMLBot analyzes:
   - Is this amount normal for Raj?
   - Is $1,000 suspicious?
   - Does Raj's profile match this transaction?
   - Any red flags?
4. AMLBot responds:
   - **PASSED:** "Transaction safe, risk score: 2/10" ✅
   - **FAILED:** "High risk, requires additional verification" ❌

**Key Difference:**
- **KYC** = "Who is this person?" (Identity verification - one time)
- **AMLBot** = "Is this transaction safe?" (Transaction check - every time)

**Code Location:** `packages/integrations/src/amlbot.ts`

---

### Step 3: Create Deposit Transaction - How Raj Sends $1,000 to Platform

**Detailed Process:**

#### Part A: Raj Creates Deposit Request on Platform

1. **Raj logs into Client Portal**
   - Goes to "Deposit" or "Add Funds" section
   - Enters amount: **$1,000 USD**
   - Selects currency: **USD**

2. **System Creates Transaction Record**
   - Transaction ID generated: `TXN-DEP-123456`
   - Status: **"pending_deposit"**
   - Amount: $1,000 USD
   - Created at: Current timestamp

3. **System Shows Deposit Instructions**
   - Platform displays company's bank account details:
     ```
     Bank Name: Chase Bank
     Account Number: 1234567890
     Routing Number: 021000021
     Account Name: iTransfer Inc.
     SWIFT Code: CHASUS33 (for international transfers)
     Reference/Note: TXN-DEP-123456 (IMPORTANT - must include this!)
     ```

#### Part B: Raj Transfers Money from His Bank

**Raj has multiple options to send $1,000:**

**Option 1: Wire Transfer (Recommended for large amounts)**
1. Raj goes to his bank (e.g., Bank of America)
2. Raj initiates wire transfer:
   - Amount: $1,000
   - To: iTransfer Inc. account (Chase Bank)
   - Reference: TXN-DEP-123456 (very important!)
3. Bank processes wire transfer
4. Money arrives in company account (usually same day or next business day)

**Option 2: ACH Transfer (For US domestic transfers)**
1. Raj logs into his online banking
2. Adds iTransfer as payee:
   - Account number: 1234567890
   - Routing number: 021000021
3. Initiates ACH transfer for $1,000
4. Includes reference: TXN-DEP-123456
5. Money arrives in 1-3 business days

**Option 3: Bank Transfer via Mobile App**
1. Raj opens his bank's mobile app
2. Selects "Send Money" or "Transfer"
3. Enters iTransfer account details
4. Sends $1,000 with reference TXN-DEP-123456
5. Money arrives based on transfer type

**Important:** Raj **MUST** include the transaction reference (TXN-DEP-123456) in the transfer notes/memo so admin can match the payment!

#### Part C: Admin Verification Process

1. **Admin Receives Notification**
   - Email notification: "New deposit pending: TXN-DEP-123456"
   - Admin Console shows new pending deposit

2. **Admin Checks Company Bank Account**
   - Admin logs into company bank account (Chase Bank)
   - Looks for incoming transfer of $1,000
   - Checks transfer memo/notes for reference: TXN-DEP-123456
   - Verifies sender details match Raj's account

3. **Admin Verifies Match**
   - Amount matches: $1,000 ✅
   - Reference matches: TXN-DEP-123456 ✅
   - Sender verified: Raj's bank account ✅

4. **Admin Marks Deposit as Received**
   - Admin goes to Admin Console
   - Opens transaction TXN-DEP-123456
   - Clicks "Mark as Received" button
   - Status changes: **"pending_deposit"** → **"deposit_received"** ✅

#### Part D: System Updates

1. **Ledger Entry Created**
   - Debit: $1,000 to `company:deposits` account
   - Credit: $1,000 to `wallet:raj:USD` account
   - Raj's wallet balance: **$1,000 USD** ✅

2. **Email Notification Sent**
   - Raj receives email: "Your deposit of $1,000 USD has been received!"
   - Transaction receipt PDF generated

3. **Raj Can Now Use Funds**
   - Raj's wallet shows: $1,000 USD balance
   - Raj can now create swap transaction to convert USD to INR

---

**Summary - How Raj Deposits $1,000:**

```
Step 1: Raj creates deposit request on platform
        ↓
Step 2: Platform shows bank account details + reference number
        ↓
Step 3: Raj transfers $1,000 from his bank to company bank account
        (Wire/ACH/Bank Transfer with reference number)
        ↓
Step 4: Money arrives in company bank account (1-3 days)
        ↓
Step 5: Admin verifies money received and matches to transaction
        ↓
Step 6: Admin marks deposit as received in Admin Console
        ↓
Step 7: System credits $1,000 to Raj's USD wallet ✅
```

**Key Points:**
- Raj sends money to **company's bank account** (not directly to platform)
- **Reference number is critical** - helps admin match payment to transaction
- **Admin manually verifies** each deposit (for security)
- Once verified, money appears in Raj's wallet
- This is **not automatic** - requires admin verification

**Code Locations:**
- Customer creates: `apps/api/src/app/api/transactions/deposit/route.ts`
- Admin marks received: `apps/api/src/app/api/admin/transactions/[id]/mark-received/route.ts`

---

## Deposit Methods - How Customers Send Money

### Available Deposit Methods

#### 1. Wire Transfer (SWIFT)
**Best for:** Large amounts, international transfers
- **Speed:** Same day or next business day
- **Fee:** Usually $25-50 (charged by bank)
- **Limit:** No limit (for large amounts)
- **How it works:**
  - Customer goes to bank
  - Initiates international wire transfer
  - Uses SWIFT code for international transfers
  - Money arrives quickly

#### 2. ACH Transfer (US Domestic)
**Best for:** US customers, smaller amounts
- **Speed:** 1-3 business days
- **Fee:** Usually free or $3-5
- **Limit:** Varies by bank (typically $10,000-25,000 per day)
- **How it works:**
  - Customer uses online banking
  - Adds company as payee
  - Initiates ACH transfer
  - Money arrives in 1-3 days

#### 3. Bank Transfer (Domestic)
**Best for:** Same bank transfers, quick transfers
- **Speed:** Same day or next day
- **Fee:** Usually free
- **Limit:** Varies by bank
- **How it works:**
  - Customer uses bank's transfer service
  - Sends money to company account
  - Money arrives quickly

#### 4. Check Deposit (Less Common)
**Best for:** Customers who prefer physical checks
- **Speed:** 3-5 business days (check clearing)
- **Fee:** Usually free
- **Limit:** Check amount limit
- **How it works:**
  - Customer mails check to company
  - Company deposits check
  - Check clears in 3-5 days

### Important Notes

**Reference Number is Critical:**
- Every deposit transaction has a unique reference number (e.g., TXN-DEP-123456)
- Customer **MUST** include this in transfer memo/notes
- Helps admin match payment to correct transaction
- Without reference, admin cannot verify deposit

**Processing Time:**
- Wire Transfer: Same day or next day
- ACH Transfer: 1-3 business days
- Bank Transfer: Same day or next day
- Check: 3-5 business days

**Admin Verification:**
- All deposits require manual admin verification
- Admin checks company bank account
- Admin matches amount and reference number
- Admin marks deposit as received
- Then money appears in customer wallet

---

## Platform Bank Account - Complete Explanation

### What is Platform Bank Account?

**Platform Bank Account** is the **company's bank account** where customers send their deposits. This is iTransfer Inc.'s official business bank account.

### Bank Account Details

**Example Account (for illustration):**
```
Bank Name: Chase Bank
Account Number: 1234567890
Routing Number: 021000021
Account Name: iTransfer Inc.
SWIFT Code: CHASUS33 (for international wire transfers)
Account Type: Business Checking Account
```

**Note:** Actual account details are configured in the platform and shown to customers when they create deposit requests.

### How Platform Bank Account Works

#### Purpose of Platform Bank Account

1. **Receives Customer Deposits**
   - Customers send money to this account
   - All deposits come to this single account
   - Admin verifies each deposit manually

2. **Holds Company Funds**
   - Stores customer deposits temporarily
   - Holds funds for currency exchange
   - Maintains balance for payouts

3. **Centralized Money Management**
   - Single account for all transactions
   - Easier to track and manage
   - Simplifies reconciliation

#### Account Structure

**Single Account Model:**
- Platform uses **ONE main bank account**
- All customers send money to same account
- Admin uses reference numbers to match deposits
- Account balance = sum of all customer deposits

**Why Single Account?**
- Simpler setup and management
- Lower banking fees
- Easier reconciliation
- Standard for remittance platforms

#### Money Flow Through Platform Account

**Step 1: Customer Deposits**
```
Raj's Bank Account → Platform Bank Account (Chase)
Amount: $1,000 USD
Reference: TXN-DEP-123456
```

**Step 2: Funds Held in Account**
```
Platform Bank Account Balance: $1,000 USD
(After admin verifies and marks as received)
```

**Step 3: Currency Exchange**
```
Platform Bank Account: $1,000 USD
    ↓ (Bitso exchange)
Platform Bank Account: ₹83,250 INR
(USD debited, INR credited)
```

**Step 4: Payout to Recipient**
```
Platform Bank Account: ₹83,250 INR
    ↓ (via Infinitus)
Priya's SBI Account: ₹83,250 INR
```

### Platform Account vs Customer Wallets

**Platform Bank Account (Real Bank Account):**
- Physical bank account at Chase Bank
- Holds actual money
- Receives deposits from customers
- Used for currency exchange
- Used for payouts

**Customer Wallets (Digital/Logical):**
- Digital records in database
- Track customer balances
- Not real bank accounts
- Managed by Turnkey
- Represent customer's share of platform account

**Example:**
- Platform Bank Account: $10,000 USD (real money)
- Raj's Wallet: $1,000 USD (digital record)
- Priya's Wallet: $500 USD (digital record)
- Other customers: $8,500 USD (digital records)
- Total: $10,000 USD ✅ (matches)

### Admin Responsibilities

**Admin Must:**
1. **Monitor Account Daily**
   - Check for incoming deposits
   - Match deposits to transactions
   - Verify amounts and references

2. **Reconcile Transactions**
   - Match bank statement to platform records
   - Ensure all deposits are marked
   - Track account balance

3. **Maintain Account Balance**
   - Ensure sufficient funds for payouts
   - Monitor for currency exchange needs
   - Keep account funded

### Security Measures

**Account Security:**
- Only authorized admins can access
- Multi-factor authentication required
- Transaction limits set
- Regular audits performed

**Fraud Prevention:**
- All deposits manually verified
- Reference numbers required
- Amount matching required
- Sender verification

### Account Management

**Multiple Currency Accounts:**
- Platform may have separate accounts for different currencies:
  - USD Account (Chase Bank) - for USD deposits
  - INR Account (Indian Bank) - for INR operations (if needed)
  - MXN Account (Mexican Bank) - for MXN operations (if needed)

**Or Single Multi-Currency Account:**
- One account that holds multiple currencies
- Bank handles currency conversion
- Simpler but may have limitations

**Typical Setup:**
- **USD Account:** Main account for customer deposits
- **Local Accounts:** For specific countries (if needed)

### Bank Account Configuration

**Where Configured:**
- Bank account details stored in platform configuration
- Shown to customers when creating deposits
- Can be updated by admin

**Information Shown to Customers:**
- Bank name
- Account number
- Routing number (for US)
- SWIFT code (for international)
- Account name
- Reference number (transaction-specific)

**Code Location:**
- Deposit instructions: `apps/client-portal/src/app/transactions/page.tsx`
- Admin verification: `apps/admin-console/` (admin checks external bank account)

---

### Step 4: Turnkey - Create Wallet

**What is Turnkey?**
- Turnkey manages secure digital wallets for customers
- Each customer can have multiple wallets (one per currency)
- Wallets store customer funds securely

**Process:**
1. System creates USD wallet for Raj via Turnkey API
2. Turnkey responds: "Wallet created - ID: wallet-raj-123"
3. Raj's wallet is ready to hold USD
4. When deposit is received, money is credited to this wallet

**Code Location:** `packages/integrations/src/turnkey.ts`

---

### Step 5: Create Swap Transaction (Currency Exchange)

**What happens:**
1. Raj wants to convert $1,000 USD to INR
2. Raj creates swap transaction on Client Portal
3. Status: **"swap_pending"**
4. Admin receives notification

**Code Location:** `apps/api/src/app/api/transactions/swap/route.ts`

---

### Step 6: Bitso - Get Exchange Quote (USD to INR)

**What is Bitso?**
- Bitso is a currency exchange service
- Provides real-time exchange rates
- Executes currency conversions

**Process:**
1. Admin executes swap in Admin Console
2. System asks Bitso: "What's the rate for $1,000 USD to INR?"
3. Bitso responds:
   ```
   Current rate: 83.25 INR per USD
   For $1,000 USD, you'll get: 83,250 INR
   Quote valid for: 60 seconds
   Quote ID: quote-abc123
   ```
4. System shows admin: "Raj will receive ₹83,250"

**Code Location:** `packages/integrations/src/bitso.ts`

---

### Step 7: Bitso - Execute Exchange

**Process:**
1. Admin confirms the exchange
2. System tells Bitso: "Execute quote quote-abc123"
3. Bitso processes:
   - Takes $1,000 USD from company account
   - Converts at rate 83.25
   - Provides ₹83,250 INR
4. Bitso confirms: "Exchange completed - Order ID: order-xyz789"
5. Status changes to: **"swap_completed"**
6. System creates ledger entries:
   - Debit: Raj's USD wallet (-$1,000)
   - Credit: Company FX account (+₹83,250)

**Result:**
- $1,000 USD → ₹83,250 INR ✅

**Code Location:** `apps/api/src/app/api/admin/transactions/[id]/execute-swap/route.ts`

---

### Step 8: Create Payout Transaction

**What happens:**
1. Raj creates payout transaction on Client Portal
2. Raj enters Priya's bank details:
   - Account Number: 123456789012
   - Bank Name: State Bank of India (SBI)
   - IFSC Code: SBIN0001234
   - Address: Mumbai, India
3. Status: **"payout_pending"**
4. Admin receives notification

**Code Location:** `apps/api/src/app/api/transactions/payout/route.ts`

---

### Step 9: Infinitus - Send Payout to India

**What is Infinitus?**
- Infinitus is a payout processing service
- Handles bank transfers to various countries
- Supports NEFT, RTGS, IMPS for India
- Acts as a payment gateway for international remittances

#### Detailed Process: How Infinitus Transfers Money

**Part A: Platform Sends Payout Request to Infinitus**

1. **Admin Sends Payout in Admin Console**
   - Admin clicks "Send Payout" button
   - System prepares payout request

2. **System Calls Infinitus API**
   - API Endpoint: `POST https://api.infinitus.com/payouts`
   - Request includes:
     ```json
     {
       "transaction_id": "TXN-PAY-789456",
       "amount": 83250,
       "currency": "INR",
       "recipient": {
         "name": "Priya Sharma",
         "account_number": "123456789012",
         "bank_name": "State Bank of India",
         "bank_code": "SBIN0001234",
         "ifsc_code": "SBIN0001234",
         "address": "Mumbai, Maharashtra, India",
         "country": "India"
       }
     }
     ```

**Part B: Infinitus Receives and Validates Request**

1. **Infinitus Validates Bank Details**
   - Checks IFSC code is valid (SBIN0001234)
   - Verifies bank name matches IFSC
   - Validates account number format
   - Checks recipient name

2. **Infinitus Checks Platform Balance**
   - Infinitus has a **pre-funded account** with iTransfer
   - Platform maintains balance with Infinitus (e.g., ₹10,00,000 INR)
   - Infinitus verifies: ₹83,250 available? ✅

**Part C: Infinitus Initiates Bank Transfer**

1. **Infinitus Chooses Transfer Method**
   - For India, options are:
     - **NEFT** (National Electronic Funds Transfer) - 1-2 days
     - **RTGS** (Real Time Gross Settlement) - Same day, min ₹2 lakh
     - **IMPS** (Immediate Payment Service) - Instant, up to ₹2 lakh
   
   - For ₹83,250: Infinitus uses **NEFT** (amount < ₹2 lakh)

2. **Infinitus Sends Money to Recipient Bank**
   - Infinitus has partnerships with Indian banks
   - Infinitus initiates NEFT transfer:
     ```
     From: Infinitus's bank account (pre-funded)
     To: Priya's SBI account (123456789012)
     Amount: ₹83,250
     IFSC: SBIN0001234
     Method: NEFT
     ```

3. **Bank Processing**
   - SBI receives NEFT request
   - SBI validates account details
   - SBI credits ₹83,250 to Priya's account
   - Processing time: 1-2 business days

**Part D: Infinitus Confirms Transfer**

1. **Infinitus Receives Confirmation**
   - SBI confirms: "Transfer successful"
   - Infinitus updates status

2. **Infinitus Responds to Platform**
   ```json
   {
     "request_id": "INF-789456123",
     "status": "completed",
     "tracking_number": "INF-789456123",
     "estimated_completion": "2024-01-15T10:00:00Z",
     "actual_completion": "2024-01-15T09:45:00Z"
   }
   ```

3. **Platform Updates Status**
   - Status changes: **"payout_pending"** → **"payout_completed"** ✅
   - System creates ledger entry:
     - Debit: ₹83,250 from `company:payouts`
     - Credit: ₹83,250 to `external:infinitus`

**Part E: Recipient Receives Money**

1. **Priya's Bank Account**
   - SBI credits ₹83,250 to account 123456789012
   - Priya receives SMS notification
   - Priya can see balance updated

2. **Transaction Complete**
   - Money successfully transferred ✅
   - Platform sends email to Raj
   - Receipt generated

---

#### How Infinitus Works - Technical Details

**Infinitus Account Structure:**
- Platform has a **pre-funded account** with Infinitus
- Platform deposits money in advance (e.g., ₹10,00,000)
- When payout needed, Infinitus uses this balance
- Platform refills account when balance is low

**Infinitus Bank Partnerships:**
- Infinitus has direct partnerships with banks in multiple countries
- For India: Partnerships with major banks (SBI, HDFC, ICICI, etc.)
- This allows direct bank transfers without intermediaries

**Transfer Methods by Country:**

**India:**
- **NEFT:** 1-2 business days, any amount
- **RTGS:** Same day, minimum ₹2 lakh
- **IMPS:** Instant, up to ₹2 lakh

**Mexico:**
- **SPEI:** Same day transfers
- **Bank Transfer:** 1-2 business days

**Other Countries:**
- Infinitus supports 50+ countries
- Uses local payment networks

**Code Location:** `packages/integrations/src/infinitus.ts`

---

## Complete Money Flow: Platform Account to Recipient

### Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: CUSTOMER DEPOSIT                                     │
│                                                               │
│  Raj's Bank Account                                          │
│       │                                                       │
│       │ Wire/ACH Transfer: $1,000 USD                       │
│       │ Reference: TXN-DEP-123456                            │
│       ↓                                                       │
│  Platform Bank Account (Chase Bank)                          │
│  Account: 1234567890                                         │
│  Balance: $1,000 USD ✅                                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: CURRENCY EXCHANGE                                    │
│                                                               │
│  Platform Bank Account                                       │
│  $1,000 USD → (Bitso Exchange) → ₹83,250 INR                │
│                                                               │
│  Platform Bank Account Balance:                              │
│  - USD: $0                                                   │
│  - INR: ₹83,250 ✅                                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: INFINITUS PAYOUT                                     │
│                                                               │
│  Platform Bank Account: ₹83,250 INR                         │
│       │                                                       │
│       │ Infinitus API Call                                   │
│       │ (Platform → Infinitus)                               │
│       ↓                                                       │
│  Infinitus Pre-funded Account                                │
│  (Platform maintains balance with Infinitus)                 │
│       │                                                       │
│       │ NEFT Transfer                                        │
│       │ (Infinitus → SBI Bank)                               │
│       ↓                                                       │
│  Priya's SBI Account                                         │
│  Account: 123456789012                                       │
│  Balance: +₹83,250 INR ✅                                    │
└─────────────────────────────────────────────────────────────┘
```

### Key Points

**Platform Bank Account:**
- Receives all customer deposits
- Holds funds temporarily
- Used for currency exchange
- Single account for all customers

**Infinitus Transfer:**
- Platform sends payout request to Infinitus
- Infinitus uses pre-funded account
- Infinitus transfers to recipient bank
- Uses local payment networks (NEFT/RTGS/IMPS for India)

**Complete Journey:**
1. Raj → Platform Account (deposit)
2. Platform Account → Currency Exchange (Bitso)
3. Platform Account → Infinitus (payout request)
4. Infinitus → Recipient Bank (final transfer)
5. Recipient receives money ✅

---

### Step 10: Completion

**Result:**
- 1-2 business days later
- Infinitus: "Payout completed"
- Priya receives ₹83,250 INR in her SBI account
- Transaction complete! ✅
- System sends email notification to Raj
- Raj can download receipt PDF

---

## Transaction Status Flow

### Valid State Transitions

```
pending_deposit
    ↓
deposit_received
    ↓
swap_pending
    ↓
swap_completed
    ↓
payout_pending
    ↓
payout_completed ✅
```

**Terminal States:**
- `payout_completed` - Transaction successful
- `failed` - Transaction failed (can happen at any step)

**Code Location:** `apps/api/src/services/status-engine.ts`

---

## Ledger System (Double-Entry Bookkeeping)

### How It Works
Every financial movement creates **two ledger entries** (debit and credit) to maintain balance.

### Account Types
- `wallet:{user_id}:{currency}` - Customer wallets (e.g., `wallet:raj:USD`)
- `company:deposits` - Company deposit account
- `company:fx` - Company FX (currency exchange) account
- `company:payouts` - Company payout account

### Example: Deposit of $1,000
```
Entry 1: Debit  $1,000 to company:deposits
Entry 2: Credit $1,000 to wallet:raj:USD
```

### Example: Swap $1,000 USD → ₹83,250 INR
```
Entry 1: Debit  $1,000 from wallet:raj:USD
Entry 2: Credit $1,000 to company:fx (USD side)
Entry 3: Debit  ₹83,250 from company:fx (INR side)
Entry 4: Credit ₹83,250 to company:payouts
```

### Example: Payout ₹83,250
```
Entry 1: Debit  ₹83,250 from company:payouts
Entry 2: Credit ₹83,250 to external:infinitus
```

**Code Location:** `apps/api/src/services/ledger.ts`

---

## Integration Services Explained

### 1. AMLBot - Security & Compliance

**Purpose:** Prevents money laundering and ensures regulatory compliance.

**When used:** Before every transaction

**What it checks:**
- Transaction amount vs customer history
- Risk scoring (0-10, lower is better)
- Suspicious activity patterns
- Customer profile matching

**Response:**
- `passed: true` - Transaction approved ✅
- `passed: false` - Transaction blocked ❌

**Code:** `packages/integrations/src/amlbot.ts`

---

### 2. Turnkey - Wallet Management

**Purpose:** Securely stores customer funds in digital wallets.

**When used:** 
- When customer first needs a wallet
- When checking wallet balance
- When funds are deposited/withdrawn

**Features:**
- Create wallets per currency
- Track balances
- Secure storage

**Code:** `packages/integrations/src/turnkey.ts`

---

### 3. Bitso - Currency Exchange

**Purpose:** Converts one currency to another (e.g., USD to INR).

**When used:**
- Getting exchange rate quotes
- Executing currency swaps

**Process:**
1. **Get Quote:** Request current exchange rate
2. **Execute Order:** Convert currency at quoted rate

**Features:**
- Real-time exchange rates
- Quote validity (usually 60 seconds)
- Secure API authentication

**Code:** `packages/integrations/src/bitso.ts`

---

### 4. Infinitus - Payout Processing

**Purpose:** Sends money to recipient bank accounts.

**When used:** When sending final payout to recipient

**Features:**
- Supports multiple countries
- Multiple transfer methods (NEFT, RTGS, IMPS for India)
- Tracking numbers
- Status updates

**Code:** `packages/integrations/src/infinitus.ts`

---

## Complete Transaction Example

### Raj sends $1,000 USD to Priya in India

**Timeline:**

1. **Day 1 - Registration:**
   - Raj signs up → Uploads KYC → Admin approves ✅

2. **Day 2 - Deposit:**
   - Raj creates deposit transaction
   - Raj transfers $1,000 to company bank account
   - Admin marks deposit received
   - Status: `deposit_received` ✅
   - Raj's USD wallet: $1,000

3. **Day 2 - Swap:**
   - Raj creates swap transaction
   - Admin gets Bitso quote: "83.25 rate = ₹83,250"
   - Admin executes swap
   - Status: `swap_completed` ✅
   - Raj's USD wallet: $0
   - Company has ₹83,250 ready

4. **Day 2 - Payout:**
   - Raj creates payout with Priya's bank details
   - Admin sends payout via Infinitus
   - Status: `payout_completed` ✅
   - Tracking: INF-789456123

5. **Day 3-4 - Completion:**
   - Infinitus completes bank transfer
   - Priya receives ₹83,250 in her SBI account ✅
   - Raj receives email notification
   - Transaction complete!

---

## Security & Compliance

### KYC (Know Your Customer)
- **When:** Once, at registration
- **Purpose:** Verify customer identity
- **Documents:** Passport, ID, Address proof
- **Process:** Customer uploads → Admin reviews → Approve/Reject

### AML (Anti-Money Laundering)
- **When:** Every transaction
- **Purpose:** Detect suspicious transactions
- **Service:** AMLBot API
- **Response:** Passed/Failed with risk score

### Data Protection
- All documents encrypted
- Secure API authentication
- Access control for admin functions
- Audit trail maintained

---

## Email & Receipts

### Email Notifications
- Deposit received confirmation
- Swap completed notification
- Payout initiated notification
- Transaction completion notification

### PDF Receipts
- Deposit receipt
- Swap receipt
- Payout receipt
- Downloadable from Client Portal

**Code Locations:**
- Email: `apps/api/src/services/email.ts`
- PDF: `apps/api/src/services/pdf-generator.ts`
- Receipt endpoints: `apps/api/src/app/api/receipts/`

---

## Database Schema

### Core Tables

**users**
- User accounts and authentication

**wallets**
- Customer wallets (linked to Turnkey)
- Currency and balance information

**transactions**
- All transactions (deposits, swaps, payouts)
- Status tracking
- Amounts and currencies

**ledger_entries**
- Double-entry bookkeeping records
- Debit/credit entries
- Account tracking

**kyc_status**
- KYC verification records
- Document status
- Admin approval/rejection

**fx_orders**
- FX swap orders from Bitso
- Quote IDs and order IDs
- Exchange rates

**payout_requests**
- Payout requests to Infinitus
- Recipient details
- Tracking numbers

**audit_log**
- Admin action audit trail
- Who did what and when

**Code Location:** `packages/database/src/schema.sql`

---

## API Endpoints

### Customer Endpoints
- `GET /api/transactions` - List user transactions
- `POST /api/transactions/deposit` - Create deposit
- `POST /api/transactions/swap` - Create swap
- `POST /api/transactions/payout` - Create payout
- `GET /api/wallets` - Get user wallets
- `POST /api/kyc/upload` - Upload KYC documents
- `GET /api/receipts/{type}/{transactionId}` - Get receipt PDF

### Admin Endpoints
- `GET /api/admin/transactions` - List all transactions
- `POST /api/admin/kyc/approve` - Approve/reject KYC
- `GET /api/admin/kyc/list` - List KYC records
- `POST /api/admin/transactions/:id/mark-received` - Mark deposit received
- `POST /api/admin/transactions/:id/execute-swap` - Execute swap
- `POST /api/admin/transactions/:id/send-payout` - Send payout

**Code Location:** `apps/api/src/app/api/`

---

## Why Each Component is Needed

### Without Client Portal:
- ❌ Customers can't send money
- ❌ No user interface
- ❌ No way to upload KYC or create transactions

### Without Admin Console:
- ❌ Can't review KYC documents
- ❌ Can't process transactions
- ❌ No way to manage the platform

### Without API Backend:
- ❌ No business logic
- ❌ No database operations
- ❌ No integration with external services

### Without AMLBot:
- ❌ Illegal money could flow through
- ❌ Platform could face legal issues
- ❌ No fraud protection

### Without Turnkey:
- ❌ No secure wallet storage
- ❌ Can't track customer balances
- ❌ No way to hold funds

### Without Bitso:
- ❌ No currency conversion
- ❌ Customers can only send in one currency
- ❌ No competitive exchange rates

### Without Infinitus:
- ❌ Money stays in system
- ❌ Never reaches recipient
- ❌ Remittance process incomplete

---

## Summary

**iTransfer** is a complete remittance platform that:

1. **Verifies customers** (KYC - one time)
2. **Checks transactions** (AMLBot - every time)
3. **Stores funds securely** (Turnkey wallets)
4. **Converts currencies** (Bitso exchange)
5. **Sends money** (Infinitus payouts)
6. **Tracks everything** (Database and ledger)
7. **Provides transparency** (Receipts and notifications)

### Key Takeaways

1. **Three applications** work together: Client Portal, Admin Console, API
2. **Four integrations** handle core functions: AMLBot, Turnkey, Bitso, Infinitus
3. **KYC happens once**, AMLBot checks every transaction
4. **Transaction flow** is: Deposit → Swap → Payout
5. **Status engine** enforces valid state transitions
6. **Ledger system** tracks all financial movements
7. **Complete process** takes 1-3 business days typically
8. **All steps are secure and compliant** with regulations

This ensures safe, legal, and efficient international money transfers!

---

## Platform Benefits

### For Customers:
- ✅ Easy to use web interface
- ✅ Secure transactions
- ✅ Transparent tracking
- ✅ Receipts and notifications
- ✅ Multiple currency support

### For Admins:
- ✅ Centralized dashboard
- ✅ Easy KYC review
- ✅ Transaction management
- ✅ Audit trail
- ✅ Complete control

### For Business:
- ✅ Regulatory compliance
- ✅ Fraud prevention
- ✅ Scalable architecture
- ✅ Automated processes
- ✅ Complete financial tracking

---

This platform makes international remittances simple, secure, and compliant! 🌍💰

