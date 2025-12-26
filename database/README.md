# iTransfr Database Setup

## ⚡ Quick Start (One-Click Setup)

### Complete Database Setup
Run in Supabase SQL Editor (one time only):
```
COMPLETE_SCHEMA_SETUP.sql
```

This creates **everything** needed for iTransfr:
- ✅ Production tables (users, transactions, wallets)
- ✅ Complete onboarding flow (8 steps)
- ✅ Admin authentication system
- ✅ AMLBot & Infinitus integrations
- ✅ Security policies & functions

### Create Admin User
```bash
npm run admin:create
```
**Default Login:**
- URL: `/admin-login`
- Username: `admin`
- Password: `SecurePass123!`

---

## 📋 Schema Components

### Core Tables (Production)
| Table | Purpose |
|-------|---------|
| `client_profiles` | Customer accounts + onboarding data |
| `admin_profiles` | Admin accounts + roles |
| `transactions` | All financial transactions |
| `wallets` | User currency balances |
| `kyc_records` | KYC verification status |
| `kyc_documents` | Uploaded KYC files |
| `fx_orders` | Currency exchange orders |
| `payout_requests` | Outbound payments |

### Onboarding Tables
| Table | Purpose |
|-------|---------|
| `business_operations` | Volume & operational data |
| `beneficial_owners` | Owner information & PEP screening |
| `onboarding_sessions` | Progress tracking |
| `client_management_actions` | Admin audit log |

### Admin Authentication Tables
| Table | Purpose |
|-------|---------|
| `admin_credentials` | Username/password storage |
| `admin_sessions` | Session management |
| `admin_login_attempts` | Security logging |
| `admin_roles` | Role-based permissions |
| `admin_password_resets` | Password recovery |

---

## 🚀 Complete Setup Steps

1. **Create Supabase Project** at [supabase.com](https://supabase.com)

2. **Run Complete Schema**
   - Go to SQL Editor in Supabase Dashboard
   - Open `database/COMPLETE_SCHEMA_SETUP.sql`
   - Click "Run" (this creates all 20+ tables and functions)

3. **Create Admin Account**
   - Go to SQL Editor in Supabase Dashboard
   - Run `database/CREATE_ADMIN_DIRECT.sql`
   - This creates admin user: `admin` / `SecurePass123!`

4. **Update Environment Variables**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

5. **Done!** 🎉
   - Client onboarding: `/signup/new`
   - Admin login: `/admin-login`
   - Admin clients: `/admin/clients`

---

## 🔐 Security Features

- **Password Hashing**: SHA-256 with salt
- **Account Lockout**: 5 failed attempts = 15-minute lock
- **Session Management**: 24-hour expiry
- **Login Auditing**: All attempts logged
- **Row Level Security**: Complete RLS policies
- **Role-Based Access**: Super admin, admin, compliance officer, support agent

---

## 📁 File Structure

| File | Purpose | Status |
|------|---------|--------|
| `FINAL_PROJECT_SETUP.sql` | **One-click complete setup with admin** | ✅ **USE THIS** |
| `COMPLETE_SCHEMA_SETUP.sql` | Complete setup without cleanup | 🏚️ **Legacy** |
| `PRODUCTION_SETUP.sql` | Legacy base tables only | 🏚️ **Legacy** |
| `ONBOARDING_SCHEMA_CURRENT.sql` | Onboarding extensions only | 🏚️ **Legacy** |
| `ADMIN_AUTH_SCHEMA.sql` | Admin auth only | 🏚️ **Legacy** |

---

## 🐛 Troubleshooting

### "relation 'client_profiles' does not exist"
**Cause:** Running onboarding schema before production setup
**Fix:** Use `COMPLETE_SCHEMA_SETUP.sql` instead of individual files

### "Admin login not working"
**Cause:** Admin user not created
**Fix:** Run `npm run admin:create`

### "Permission denied"
**Cause:** RLS policies not applied
**Fix:** Schema cache not refreshed - restart Supabase or run schema again

---

## 🔄 Migration Notes

If you have existing data:
1. Backup your database
2. Run migration: `SELECT migrate_current_clients_to_new_schema();`
3. This adds new onboarding fields to existing clients

For new installations, just run `COMPLETE_SCHEMA_SETUP.sql` once.
