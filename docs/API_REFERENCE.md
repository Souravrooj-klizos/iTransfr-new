# iTransfr Wallet & KYT API Reference

Base URL: `http://localhost:3000` (development) or your production URL

---

## 📁 Wallet Management APIs

### List All Wallets

```http
GET /api/admin/wallets
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Filter by wallet type: `master`, `client`, `client_external` |
| `network` | string | Filter by network: `ethereum`, `solana`, `tron` |
| `status` | string | Filter by status: `active`, `inactive`, `suspended` |
| `clientId` | string | Filter by client ID |

**Response:**
```json
{
  "wallets": [
    {
      "id": "abc123",
      "address": "DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy",
      "network": "solana",
      "wallet_type": "master",
      "label": "SOL Master Wallet",
      "status": "active",
      "aml_risk_score": 12.5,
      "aml_status": "clear",
      "aml_monitoring_enabled": true
    }
  ],
  "count": 1,
  "supportedNetworks": ["Ethereum", "Solana", "Tron"]
}
```

---

### Create Wallet

```http
POST /api/admin/wallets
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Test Solana Wallet",
  "label": "SOL Master Wallet",
  "network": "solana",
  "walletType": "master",
  "clientId": "uuid-here",
  "enableKytMonitoring": true
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Wallet name for Turnkey |
| `label` | string | No | Display label |
| `network` | string | Yes | `ethereum`, `solana`, or `tron` |
| `walletType` | string | No | `master`, `client`, `client_external` (default: `master`) |
| `clientId` | string | No | Client UUID (required for client wallets) |
| `enableKytMonitoring` | boolean | No | Auto-screen and enable monitoring (default: `true`) |

**Response (201 Created):**
```json
{
  "success": true,
  "wallet": {
    "id": "abc123",
    "address": "DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy",
    "network": "solana",
    "turnkeyWalletId": "turnkey-wallet-id"
  },
  "kyt": {
    "success": true,
    "riskScore": 5.2,
    "severity": "clear",
    "monitoringEnabled": true
  }
}
```

---

### Get Wallet Details

```http
GET /api/admin/wallets/:id
```

**Response:**
```json
{
  "wallet": {
    "id": "abc123",
    "address": "DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy",
    "network": "solana",
    "aml_risk_score": 12.5,
    "turnkeyInfo": {
      "walletId": "turnkey-wallet-id",
      "walletName": "Test Wallet"
    }
  },
  "screenings": [...],
  "alerts": [...]
}
```

---

### Update Wallet

```http
PATCH /api/admin/wallets/:id
Content-Type: application/json
```

**Request Body:**
```json
{
  "label": "Updated Label",
  "status": "active",
  "aml_alert_threshold": 40,
  "aml_critical_threshold": 50
}
```

---

### Deactivate Wallet

```http
DELETE /api/admin/wallets/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Wallet deactivated and pending deletion approval",
  "wallet": {...}
}
```

---

## 👤 Client Wallet APIs

### Get Client's Wallets

```http
GET /api/admin/client/:clientId/wallet
```

**Response:**
```json
{
  "wallets": [
    {
      "id": "abc123",
      "address": "...",
      "network": "solana",
      "linkInfo": {
        "isPrimary": true,
        "linkedAt": "2026-01-06T12:00:00Z"
      }
    }
  ],
  "count": 1
}
```

---

### Create Wallet for Client

```http
POST /api/admin/client/:clientId/wallet
Content-Type: application/json
```

**Request Body:**
```json
{
  "network": "solana",
  "label": "Client SOL Wallet",
  "enableKytMonitoring": true,
  "isPrimary": true
}
```

---

## 🔍 KYT Screening APIs

### Screen Address

```http
POST /api/kyt/screen
Content-Type: application/json
```

**Request Body:**
```json
{
  "address": "DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy",
  "network": "solana",
  "walletId": "abc123"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `address` | string | Yes | Wallet address to screen |
| `network` | string | Yes | `ethereum`, `solana`, `tron`, `polygon`, `bitcoin` |
| `walletId` | string | No | If provided, updates wallet record with results |

**Response:**
```json
{
  "success": true,
  "status": "success",
  "riskScore": 15.3,
  "severity": "clear",
  "topSignals": [
    { "name": "mixing_service", "value": 5.2 },
    { "name": "gambling", "value": 3.1 }
  ],
  "signals": {...},
  "isBlacklisted": false,
  "uid": "amlbot-uid-12345",
  "screeningId": "screening-abc123"
}
```

**Risk Severity Levels:**
| Score | Severity |
|-------|----------|
| < 35% | `clear` |
| 35-47% | `warning` |
| > 47% | `critical` |
| Blacklisted | `blacklisted` |

---

## 📡 KYT Monitoring APIs

### Enable Monitoring

```http
POST /api/kyt/monitor
Content-Type: application/json
```

**Request Body:**
```json
{
  "walletId": "abc123",
  "address": "DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy",
  "network": "solana"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Monitoring enabled successfully",
  "walletId": "abc123",
  "uid": "amlbot-uid-12345",
  "riskScore": 15.3
}
```

---

### Disable Monitoring

```http
DELETE /api/kyt/monitor?walletId=abc123
```

**Response:**
```json
{
  "success": true,
  "message": "Monitoring disabled successfully",
  "walletId": "abc123"
}
```

---

## 🚨 KYT Alerts APIs

### List Alerts

```http
GET /api/kyt/alerts
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | `unread`, `reviewed`, `resolved`, `dismissed` |
| `severity` | string | `low`, `medium`, `high`, `critical` |
| `walletId` | string | Filter by wallet ID |
| `limit` | number | Results per page (default: 50) |
| `offset` | number | Pagination offset (default: 0) |

**Response:**
```json
{
  "alerts": [
    {
      "id": "alert123",
      "address": "DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy",
      "network": "solana",
      "alert_type": "risk_increase",
      "previous_risk_score": 15.3,
      "new_risk_score": 42.1,
      "severity": "warning",
      "status": "unread",
      "created_at": "2026-01-06T12:00:00Z"
    }
  ],
  "total": 1,
  "unreadCount": 1,
  "limit": 50,
  "offset": 0
}
```

---

### Get Alert Details

```http
GET /api/kyt/alerts/:id
```

**Response:**
```json
{
  "alert": {
    "id": "alert123",
    "address": "...",
    "risk_signals": {...},
    "amlbot_payload": {...}
  },
  "wallet": {
    "id": "wallet123",
    "label": "SOL Master Wallet"
  }
}
```

---

### Update Alert Status

```http
PATCH /api/kyt/alerts/:id
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "reviewed",
  "notes": "Reviewed and confirmed as legitimate activity",
  "reviewedBy": "admin-uuid"
}
```

| Status | Description |
|--------|-------------|
| `unread` | New alert, not reviewed |
| `reviewed` | Alert has been seen |
| `resolved` | Issue resolved |
| `dismissed` | False positive or ignored |

---

## 🔗 Webhook API

### Health Check

```http
GET /api/kyt/webhook
```

**Response:**
```json
{
  "status": "ok",
  "endpoint": "/api/kyt/webhook",
  "description": "AMLBot KYT monitoring webhook receiver"
}
```

---

### Receive Webhook (AMLBot Callback)

```http
POST /api/kyt/webhook
Content-Type: application/json
x-amlbot-check: <hmac-signature>
x-amlbot-tonce: <timestamp>
```

This endpoint is called by AMLBot when monitored addresses have risk changes.

---

## 🧪 Testing Examples

### cURL - Create Solana Wallet
```bash
curl -X POST http://localhost:3000/api/admin/wallets \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Wallet",
    "network": "solana",
    "walletType": "master",
    "enableKytMonitoring": true
  }'
```

### cURL - Screen Address
```bash
curl -X POST http://localhost:3000/api/kyt/screen \
  -H "Content-Type: application/json" \
  -d '{
    "address": "DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy",
    "network": "solana"
  }'
```

### cURL - List Alerts
```bash
curl "http://localhost:3000/api/kyt/alerts?status=unread&severity=critical"
```

---

## ⚠️ Error Responses

All endpoints return errors in this format:
```json
{
  "error": "Error message here",
  "details": {...}
}
```

**Common Status Codes:**
| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid parameters |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |
| 503 | Service Unavailable - KYT not configured |
