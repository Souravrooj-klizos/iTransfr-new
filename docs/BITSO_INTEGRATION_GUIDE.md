# Bitso Integration Guide for iTransfr

## Overview

**Bitso** is a cryptocurrency exchange platform that provides:
- **Currency Conversions** - Convert between fiat and crypto currencies
- **FX Trading** - Execute foreign exchange orders
- **API Access** - RESTful API for programmatic trading

### iTransfr Use Case
In our remittance flow, Bitso handles the **SWAP** step:
```
USD (deposit) → [BITSO CONVERSION] → MXN/INR (for payout)
```

---

## Step 1: Get Bitso API Credentials

### 1.1 Create Bitso Account
1. Go to [bitso.com](https://bitso.com)
2. Create a business account
3. Complete KYB (Know Your Business) verification

### 1.2 Generate API Keys
1. Login to Bitso Dashboard
2. Go to **Settings** → **API Keys**
3. Click **Generate New API Key**
4. Save securely:
   - `API_KEY` (Public key)
   - `API_SECRET` (Private key - never share)

### 1.3 Add to Environment Variables
```env
# .env.local
BITSO_API_KEY=your_api_key
BITSO_API_SECRET=your_api_secret
BITSO_API_URL=https://api.bitso.com  # Production
# BITSO_API_URL=https://stage.bitso.com  # Staging/Testing
```

---

## Step 2: Understand Bitso API Authentication

Bitso uses **HMAC-SHA256** authentication with 3 components:

| Component | Description |
|-----------|-------------|
| `key` | Your API Key |
| `nonce` | Current timestamp in milliseconds |
| `signature` | HMAC-SHA256 hash of: `nonce + method + path + body` |

### Authentication Header Format:
```
Authorization: Bitso {key}:{nonce}:{signature}
```

---

## Step 3: Create Bitso Integration File

Create: `src/lib/integrations/bitso.ts`

```typescript
import crypto from 'crypto';

// =====================================================
// BITSO API CLIENT
// =====================================================

const BITSO_API_URL = process.env.BITSO_API_URL || 'https://api.bitso.com';
const BITSO_API_KEY = process.env.BITSO_API_KEY;
const BITSO_API_SECRET = process.env.BITSO_API_SECRET;

// =====================================================
// TYPES
// =====================================================

export interface BitsoQuote {
  id: string;
  from_amount: string;
  from_currency: string;
  to_amount: string;
  to_currency: string;
  rate: string;
  expires: number;
  created: number;
}

export interface BitsoConversion {
  id: string;
  status: 'pending' | 'completed' | 'failed';
  from_amount: string;
  from_currency: string;
  to_amount: string;
  to_currency: string;
  rate: string;
  created: number;
}

export interface BitsoError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

// =====================================================
// AUTHENTICATION
// =====================================================

function createSignature(
  nonce: string,
  method: string,
  path: string,
  body: string = ''
): string {
  if (!BITSO_API_SECRET) {
    throw new Error('BITSO_API_SECRET not configured');
  }

  const data = nonce + method + path + body;
  return crypto
    .createHmac('sha256', BITSO_API_SECRET)
    .update(data)
    .digest('hex');
}

function getAuthHeaders(
  method: string,
  path: string,
  body: string = ''
): Record<string, string> {
  if (!BITSO_API_KEY) {
    throw new Error('BITSO_API_KEY not configured');
  }

  const nonce = Date.now().toString();
  const signature = createSignature(nonce, method, path, body);

  return {
    'Authorization': `Bitso ${BITSO_API_KEY}:${nonce}:${signature}`,
    'Content-Type': 'application/json',
  };
}

// =====================================================
// API FUNCTIONS
// =====================================================

/**
 * Request a conversion quote
 * Quote is valid for 30 seconds
 */
export async function requestQuote(
  fromCurrency: string,
  toCurrency: string,
  amount: number,
  type: 'spend' | 'receive' = 'spend'
): Promise<BitsoQuote> {
  const path = '/api/v4/currency_conversions';
  const body = JSON.stringify({
    from_currency: fromCurrency.toLowerCase(),
    to_currency: toCurrency.toLowerCase(),
    ...(type === 'spend'
      ? { spend_amount: amount.toString() }
      : { receive_amount: amount.toString() }
    ),
  });

  const response = await fetch(`${BITSO_API_URL}${path}`, {
    method: 'POST',
    headers: getAuthHeaders('POST', path, body),
    body,
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error?.message || 'Failed to get quote');
  }

  console.log('[Bitso] Quote received:', data.payload.id);
  return data.payload;
}

/**
 * Execute a conversion quote
 * Must be called within 30 seconds of receiving quote
 */
export async function executeQuote(quoteId: string): Promise<BitsoConversion> {
  const path = `/api/v4/currency_conversions/${quoteId}`;

  const response = await fetch(`${BITSO_API_URL}${path}`, {
    method: 'PUT',
    headers: getAuthHeaders('PUT', path),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error?.message || 'Failed to execute quote');
  }

  console.log('[Bitso] Conversion executed:', data.payload.id);
  return data.payload;
}

/**
 * Get conversion status
 */
export async function getConversionStatus(
  conversionId: string
): Promise<BitsoConversion> {
  const path = `/api/v4/currency_conversions/${conversionId}`;

  const response = await fetch(`${BITSO_API_URL}${path}`, {
    method: 'GET',
    headers: getAuthHeaders('GET', path),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error?.message || 'Failed to get conversion status');
  }

  return data.payload;
}

/**
 * Get account balance
 */
export async function getBalance(): Promise<Record<string, string>> {
  const path = '/api/v3/balance/';

  const response = await fetch(`${BITSO_API_URL}${path}`, {
    method: 'GET',
    headers: getAuthHeaders('GET', path),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error?.message || 'Failed to get balance');
  }

  // Convert array to object
  const balances: Record<string, string> = {};
  for (const b of data.payload.balances) {
    balances[b.currency] = b.available;
  }

  return balances;
}

/**
 * Test API connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const balance = await getBalance();
    console.log('[Bitso] Connection successful, currencies:', Object.keys(balance));
    return true;
  } catch (error) {
    console.error('[Bitso] Connection failed:', error);
    return false;
  }
}
```

---

## Step 4: Create Bitso API Endpoints

### 4.1 Test Connection Endpoint

Create: `src/app/api/integrations/bitso/test/route.ts`

```typescript
import { testConnection, getBalance } from '@/lib/integrations/bitso';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const connected = await testConnection();

    if (!connected) {
      return NextResponse.json({
        success: false,
        error: 'Failed to connect to Bitso'
      }, { status: 500 });
    }

    const balance = await getBalance();

    return NextResponse.json({
      success: true,
      message: 'Bitso connection successful',
      balances: balance,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
```

### 4.2 Get Quote Endpoint

Create: `src/app/api/integrations/bitso/quote/route.ts`

```typescript
import { requestQuote } from '@/lib/integrations/bitso';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { fromCurrency, toCurrency, amount } = await request.json();

    if (!fromCurrency || !toCurrency || !amount) {
      return NextResponse.json({
        error: 'fromCurrency, toCurrency, and amount are required'
      }, { status: 400 });
    }

    const quote = await requestQuote(fromCurrency, toCurrency, amount);

    return NextResponse.json({
      success: true,
      quote: {
        id: quote.id,
        fromAmount: quote.from_amount,
        fromCurrency: quote.from_currency,
        toAmount: quote.to_amount,
        toCurrency: quote.to_currency,
        rate: quote.rate,
        expiresAt: new Date(quote.expires).toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
```

### 4.3 Execute Swap Endpoint

Create: `src/app/api/integrations/bitso/execute/route.ts`

```typescript
import { executeQuote, getConversionStatus } from '@/lib/integrations/bitso';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { quoteId, transactionId } = await request.json();

    if (!quoteId) {
      return NextResponse.json({
        error: 'quoteId is required'
      }, { status: 400 });
    }

    // Execute the conversion
    const conversion = await executeQuote(quoteId);

    // If transactionId provided, update fx_orders table
    if (transactionId && supabaseAdmin) {
      await supabaseAdmin.from('fx_orders').insert({
        transactionId,
        fromCurrency: conversion.from_currency.toUpperCase(),
        toCurrency: conversion.to_currency.toUpperCase(),
        fromAmount: conversion.from_amount,
        toAmount: conversion.to_amount,
        exchangeRate: conversion.rate,
        bitsoOrderId: conversion.id,
        status: conversion.status,
        executedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      conversion: {
        id: conversion.id,
        status: conversion.status,
        fromAmount: conversion.from_amount,
        fromCurrency: conversion.from_currency,
        toAmount: conversion.to_amount,
        toCurrency: conversion.to_currency,
        rate: conversion.rate,
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
```

---

## Step 5: Integration with Transaction Flow

### In Admin Console - Execute Swap Button:

```typescript
// When admin clicks "Execute Swap"
async function handleExecuteSwap(transactionId: string) {
  // 1. Get quote
  const quoteResponse = await fetch('/api/integrations/bitso/quote', {
    method: 'POST',
    body: JSON.stringify({
      fromCurrency: 'USD',
      toCurrency: 'MXN',
      amount: transaction.amount,
    }),
  });
  const { quote } = await quoteResponse.json();

  // 2. Execute quote (within 30 seconds)
  const executeResponse = await fetch('/api/integrations/bitso/execute', {
    method: 'POST',
    body: JSON.stringify({
      quoteId: quote.id,
      transactionId,
    }),
  });
  const { conversion } = await executeResponse.json();

  // 3. Update transaction status
  await updateTransactionStatus(transactionId, 'SWAP_COMPLETED');
}
```

---

## Step 6: Testing Checklist

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Add env variables | `.env.local` has `BITSO_API_KEY` and `BITSO_API_SECRET` |
| 2 | Test connection | `GET /api/integrations/bitso/test` returns balances |
| 3 | Get quote | `POST /api/integrations/bitso/quote` returns quote with rate |
| 4 | Execute quote | `POST /api/integrations/bitso/execute` returns conversion |

---

## API Reference Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/integrations/bitso/test` | GET | Test API connection |
| `/api/integrations/bitso/quote` | POST | Get conversion quote |
| `/api/integrations/bitso/execute` | POST | Execute conversion |

---

## Environment Variables Needed

```env
BITSO_API_KEY=your_api_key
BITSO_API_SECRET=your_api_secret
BITSO_API_URL=https://api.bitso.com
```

---

## Bitso Supported Currencies

| Type | Currencies |
|------|------------|
| Fiat | USD, MXN, BRL, ARS, COP |
| Crypto | BTC, ETH, XRP, USDT, USDC, and more |

For full list: [Bitso Currency Dictionary](https://docs.bitso.com/bitso-api/docs/currency-dictionary)
