# Turnkey Setup Guide

## Current Error
The API key is not registered with your Turnkey organization:
```
could not find public key in organization
organizationId=85df6c3a-cae6-44c4-9e54-9296b4d1f534
publicKey=033788231c9d7f734c22912cb5ebff03869cc3ba25bce2bebfbc7f27014c8812c0
```

## How to Fix

### Step 1: Log into Turnkey Dashboard
1. Go to https://dashboard.turnkey.com/
2. Sign in with your account

### Step 2: Navigate to API Keys
1. Click on your organization (ID: `85df6c3a-cae6-44c4-9e54-9296b4d1f534`)
2. Go to **Settings** → **API Keys** (or **Users** → your user → **API Keys**)

### Step 3: Create a New API Key
1. Click **Create API Key** (or **Add API Key**)
2. Give it a name like `itransfr-server`
3. Download or copy the generated credentials:
   - **API Public Key** (starts with `02` or `03`)
   - **API Private Key** (64 character hex string)

### Step 4: Update Environment Variables
Update your `.env` and `.env.local` files:

```env
TURNKEY_ORGANIZATION_ID=85df6c3a-cae6-44c4-9e54-9296b4d1f534
TURNKEY_API_PUBLIC_KEY=<your-new-public-key>
TURNKEY_API_PRIVATE_KEY=<your-new-private-key>
TURNKEY_BASE_URL=https://api.turnkey.com
```

### Step 5: Restart Dev Server & Test
```bash
npm run dev
# Then visit: http://localhost:3000/api/integrations/turnkey/test
```

## Important Notes

1. **Keep Private Key Secret**: Never commit your private key to Git
2. **Key Format**:
   - Public key: 66 chars hex starting with `02` or `03`
   - Private key: 64 chars hex
3. **Organization ID**: Must match your Turnkey dashboard org

## Alternative: Create New Organization

If your organization doesn't have the right permissions:

1. Go to Turnkey Dashboard
2. Create a new organization
3. Get the new Organization ID
4. Create API keys for the new org
5. Update all three env variables

## Testing

After updating credentials:
```bash
# Test the connection
curl http://localhost:3000/api/integrations/turnkey/test

# Expected success response:
# {"success":true,"message":"Turnkey API connection successful","data":{"organizationId":"...","walletCount":0}}
```

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `could not find public key in organization` | API key not registered | Create new API key in dashboard |
| `organization not found` | Wrong org ID | Check org ID in dashboard |
| `invalid signature` | Wrong private key | Regenerate API key pair |
| `TURNKEY_* not set` | Missing env vars | Add to .env file |

