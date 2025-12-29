# 🚀 Production Deployment Guide

## When Changing Supabase Credentials

### Step 1: Update Environment Variables

Create/update your production environment file:

```bash
# Copy and update environment variables
cp .env.local .env.production

# Edit with your production values
```

**Required Production Environment Variables:**

```env
# Production Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key

# Production Database URL
DATABASE_URL="postgresql://postgres:[password]@db.your-project-ref.supabase.co:5432/postgres"

# AWS (if using)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-production-access-key
AWS_SECRET_ACCESS_KEY=your-production-secret-key
AWS_S3_BUCKET=your-production-s3-bucket

# Email
AWS_SES_FROM_EMAIL=noreply@yourdomain.com
```

### Step 2: Database Setup Options

#### **Option A: One-Click Setup (Recommended)**

Run the complete setup script in your **new Supabase project**:

```sql
-- Run: database/SETUP_ALL_IN_ONE.sql
```

This single script will:
- ✅ Clean up any existing tables
- ✅ Create all tables with proper schema
- ✅ Set up RLS policies and permissions
- ✅ Create helper functions

#### **Option B: Step-by-Step Setup**

If you prefer individual steps:

1. **`database/00_safe_reset.sql`** - Clean slate
2. **`database/01_complete_schema.sql`** - Create all tables
3. **`database/02_create_admin.sql`** - Set up admin user

### Step 3: Create Admin User

After database setup, create your admin user:

1. Sign up normally through your app
2. Or use the admin seeding script:

```sql
-- Edit database/02_create_admin.sql with your admin user ID
-- Then run it in Supabase SQL Editor
```

### Step 4: Deploy Application

```bash
# Build for production
npm run build

# Deploy (depending on your platform)
# Vercel, Netlify, Railway, etc.
```

### Step 5: Verify Setup

Test these flows in production:
- ✅ User registration with OTP
- ✅ KYC document upload
- ✅ Admin dashboard access
- ✅ Profile management

## 🔄 Switching Between Environments

### Development ↔ Production

```bash
# Development (uses .env.local)
npm run dev

# Production (uses .env.production)
NODE_ENV=production npm run build
NODE_ENV=production npm start
```

### Environment-Specific Commands

```bash
# Generate Prisma client for current env
npx prisma generate

# Push schema to current database
npx prisma db push

# Reset current database (careful!)
npx prisma migrate reset --force
```

## 🛡️ Security Checklist

- ✅ **Environment variables** not committed to git
- ✅ **Service role keys** properly secured
- ✅ **RLS policies** active on all tables
- ✅ **Admin roles** properly configured
- ✅ **API keys** restricted to correct domains

## 📊 Database Files (Production Ready)

Keep only these essential files:
- ✅ `database/SETUP_ALL_IN_ONE.sql` - Complete setup
- ✅ `database/01_complete_schema.sql` - Schema only
- ✅ `database/02_create_admin.sql` - Admin setup
- ✅ `database/README.md` - Documentation

**Removed debugging files** for cleaner production codebase.

## 🚨 Important Notes

1. **Never commit** `.env.production` to git
2. **Test thoroughly** before going live
3. **Backup data** before major changes
4. **Monitor logs** after deployment
5. **Update DNS** and domain settings

## 🎯 Quick Reference

```bash
# New Supabase project setup:
1. Update .env.production
2. Run database/SETUP_ALL_IN_ONE.sql
3. Deploy application
4. Test all features
```

Your iTransfer platform is production-ready! 🚀
