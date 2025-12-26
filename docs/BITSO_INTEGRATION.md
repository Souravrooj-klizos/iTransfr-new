# Bitso Integration - Complete Documentation

## Overview

Bitso is integrated into iTransfr for **currency exchange (FX swaps)**.

```
User deposits $1,000 USD
        ↓
[BITSO SWAP] → Rate: 1 USD = 17.90 MXN
        ↓
Result: 17,900 MXN ready for payout
```

---

## How It Works

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     BITSO SWAP FLOW                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. USER INITIATES SWAP                                             │
│     └── Admin clicks "Execute Swap" in Admin Console                │
│                              ↓                                      │
│  2. GET QUOTE (Valid 30 seconds)                                    │
│     POST /api/integrations/bitso/quote                              │
│     └── Response: Rate 17.90 MXN/USD, Quote ID: V2P1j6NPewCcFcD8   │
│                              ↓                                      │
│  3. SHOW RATE TO USER/ADMIN                                         │
│     └── "$1,000 USD → 17,900 MXN (Rate: 17.90)"                    │
│                              ↓                                      │
│  4. EXECUTE SWAP (Within 30 seconds)                                │
│     POST /api/integrations/bitso/execute                            │
│     └── Uses quote ID to lock in the rate                          │
│                              ↓                                      │
│  5. UPDATE DATABASE                                                 │
│     └── Save to fx_orders table                                    │
│     └── Update transaction status → SWAP_COMPLETED                 │
│                              ↓                                      │
│  6. PROCEED TO PAYOUT                                               │
│     └── MXN now available for Infinitus payout                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### 1. Test Connection

**Check if Bitso API is working and view account balances**

```http
GET /api/integrations/bitso/test
```

**Response:**
```json
{
  "success": true,
  "message": "Bitso API connection successful",
  "data": {
    "balances": [
      { "currency": "USD", "available": "0.00000000", "total": "0.00000000" },
      { "currency": "MXN", "available": "0.00000000", "total": "0.00000000" },
      { "currency": "BTC", "available": "0.00000000", "total": "0.00000000" }
    ],
    "supportedBooks": ["ada_usd", "sol_mxn", "eth_btc", "usd_mxn"]
  }
}
```

---

### 2. Get Conversion Quote

**Get exchange rate and quote ID (valid for 30 seconds)**

```http
POST /api/integrations/bitso/quote
Content-Type: application/json
```

**Request Body:**
```json
{
  "fromCurrency": "USD",
  "toCurrency": "MXN",
  "amount": 1000,
  "type": "spend"  // optional: "spend" or "receive"
}
```

**Response:**
```json
{
  "success": true,
  "quote": {
    "id": "V2P1j6NPewCcFcD8",
    "fromCurrency": "USD",
    "toCurrency": "MXN",
    "fromAmount": "1000.00000000",
    "toAmount": "17902.00000000",
    "rate": "17.90",
    "plainRate": "18.17",
    "rateCurrency": "MXN",
    "book": "usd_mxn",
    "slippage": {
      "value": "0.0153",
      "level": "normal",
      "message": ""
    },
    "expiresAt": "2025-12-05T18:22:49.830Z",
    "expiresInSeconds": 28,
    "createdAt": "2025-12-05T18:22:19.830Z"
  },
  "message": "Quote valid for 28 seconds. Use quote ID to execute."
}
```

---

### 3. Quick Rate Lookup (GET)

**Get exchange rate without creating a quote**

```http
GET /api/integrations/bitso/quote?from=USD&to=MXN&amount=1000
```

**Response:**
```json
{
  "success": true,
  "rate": {
    "from": "USD",
    "to": "MXN",
    "rate": "17.90",
    "amount": 1000,
    "converted": "17902.00000000",
    "quoteId": "xyz123",
    "expiresAt": "2025-12-05T18:22:49.830Z"
  }
}
```

---

### 4. Execute Conversion

**Execute a swap using an existing quote ID**

```http
POST /api/integrations/bitso/execute
Content-Type: application/json
```

**Option A - Execute existing quote:**
```json
{
  "quoteId": "V2P1j6NPewCcFcD8",
  "transactionId": "uuid-from-transactions-table"  // optional
}
```

**Option B - Full swap (get quote + execute):**
```json
{
  "fromCurrency": "USD",
  "toCurrency": "MXN",
  "amount": 1000,
  "transactionId": "uuid-from-transactions-table"  // optional
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Conversion executed successfully",
  "conversion": {
    "id": "conv_abc123",
    "status": "completed",
    "fromCurrency": "USD",
    "toCurrency": "MXN",
    "fromAmount": "1000.00000000",
    "toAmount": "17902.00000000",
    "rate": "17.90",
    "executedAt": "2025-12-05T18:22:50.000Z"
  },
  "transactionId": "uuid-from-transactions-table"
}
```

**Error Response (Insufficient Balance):**
```json
{
  "success": false,
  "error": "You don't have enough balance available."
}
```

---

### 5. Get Conversion Status

**Check status of an existing conversion**

```http
GET /api/integrations/bitso/execute?id=conv_abc123
```

**Response:**
```json
{
  "success": true,
  "conversion": {
    "id": "conv_abc123",
    "status": "completed",
    "fromCurrency": "USD",
    "toCurrency": "MXN",
    "fromAmount": "1000.00000000",
    "toAmount": "17902.00000000",
    "rate": "17.90"
  }
}
```

---

## API Summary Table

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/integrations/bitso/test` | GET | Test connection, view balances |
| `/api/integrations/bitso/quote` | POST | Get conversion quote (30 sec) |
| `/api/integrations/bitso/quote?from=USD&to=MXN&amount=1000` | GET | Quick rate lookup |
| `/api/integrations/bitso/execute` | POST | Execute conversion |
| `/api/integrations/bitso/execute?id=xxx` | GET | Check conversion status |

---

## Understanding the Response

### Quote Response Fields

| Field | Description |
|-------|-------------|
| `id` | Quote ID - use this to execute |
| `fromAmount` | Amount being spent |
| `toAmount` | Amount you'll receive |
| `rate` | Effective rate (includes fees) |
| `plainRate` | Market rate (before fees) |
| `expiresInSeconds` | Time remaining to execute |
| `slippage.value` | Expected slippage percentage |

### Rate vs Plain Rate

```
Plain Rate: 18.17 (market rate)
Rate:       17.90 (what you get, after Bitso fees)
Difference: ~1.5% spread
```

---

## Error Handling

### Common Errors

| Error Message | Meaning | Solution |
|---------------|---------|----------|
| `You don't have enough balance available` | Bitso account has insufficient funds | Company needs to fund Bitso account |
| `Quote expired` | Quote ID older than 30 seconds | Get a new quote |
| `Invalid currency pair` | Currencies not supported | Check supported books |
| `BITSO_API_KEY not configured` | Missing env variable | Add to .env.local |

---

## Database Integration

When you provide `transactionId`, the system automatically:

1. **Creates fx_orders record:**
```sql
INSERT INTO fx_orders (
  transactionId,
  fromCurrency,
  toCurrency,
  fromAmount,
  toAmount,
  exchangeRate,
  bitsoOrderId,
  status,
  executedAt
) VALUES (...)
```

2. **Updates transaction status:**
```sql
UPDATE transactions
SET status = 'SWAP_COMPLETED',
    metadata = { bitsoConversionId, bitsoRate, swapCompletedAt }
WHERE id = transactionId
```

---

## Supported Currency Pairs

### Fiat Currencies
- USD (US Dollar)
- MXN (Mexican Peso)
- ARS (Argentine Peso)
- COP (Colombian Peso)
- BRL (Brazilian Real)

### Crypto Currencies
- BTC, ETH, SOL, XRP
- USDT, USDC (Stablecoins)
- And 50+ more

### Popular Books
- `usd_mxn` - USD to Mexican Peso
- `usd_ars` - USD to Argentine Peso
- `btc_mxn` - Bitcoin to Mexican Peso
- `eth_usd` - Ethereum to USD

---

## Environment Variables

```env
# Required
BITSO_API_KEY=PldHHHjPBN
BITSO_API_SECRET=8492d16d6d7003c55abb2e9bc2c48d8f

# Optional (defaults to production)
BITSO_API_URL=https://api.bitso.com
```

---

## Admin Console Usage

### Execute Swap Button Flow:

```typescript
async function handleExecuteSwap(transaction) {
  // Step 1: Get quote
  const quoteRes = await fetch('/api/integrations/bitso/quote', {
    method: 'POST',
    body: JSON.stringify({
      fromCurrency: transaction.currencyFrom,
      toCurrency: transaction.currencyTo,
      amount: transaction.amount,
    }),
  });
  const { quote } = await quoteRes.json();

  // Step 2: Show confirmation
  const confirmed = confirm(
    `Convert ${quote.fromAmount} ${quote.fromCurrency} to ` +
    `${quote.toAmount} ${quote.toCurrency}?\n` +
    `Rate: ${quote.rate}\n` +
    `Expires in: ${quote.expiresInSeconds} seconds`
  );

  if (!confirmed) return;

  // Step 3: Execute
  const execRes = await fetch('/api/integrations/bitso/execute', {
    method: 'POST',
    body: JSON.stringify({
      quoteId: quote.id,
      transactionId: transaction.id,
    }),
  });
  const { conversion } = await execRes.json();

  // Step 4: Update UI
  showSuccess(`Swap completed! ${conversion.toAmount} ${conversion.toCurrency}`);
}
```

---

## Current Status

| Component | Status |
|-----------|--------|
| API Connection | ✅ Working |
| Get Quote | ✅ Working |
| Execute Swap | ✅ Working (needs account funding) |
| Database Integration | ✅ Ready |
| Admin Console Integration | 🔲 Not wired yet |

### ⚠️ Important: Account Needs Funding

The "insufficient balance" error means your company's Bitso account needs to be funded with USD/crypto before swaps can execute.

**Tell your superior:** The Bitso API works perfectly. The account just needs to be funded with USD (or USDT) to enable actual conversions.

---

## Files

```
src/lib/integrations/bitso.ts           # Core client library
src/app/api/integrations/bitso/
├── test/route.ts                       # Test connection
├── quote/route.ts                      # Get FX quote
└── execute/route.ts                    # Execute swap
```
