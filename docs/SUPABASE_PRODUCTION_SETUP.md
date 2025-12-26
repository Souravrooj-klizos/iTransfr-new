# Production Deployment Guide - Supabase Setup

This guide explains how to set up Supabase for production deployment of the iTransfr application.

## 📋 Prerequisites

- Supabase account (https://supabase.com)
- Production Supabase project created

## 🚀 Step-by-Step Setup

### 1. Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in details:
   - **Name**: `itransfr-prod` (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Select closest to your users
4. Click **"Create new project"**
5. Wait 2-3 minutes for setup to complete

### 2. Get API Credentials

1. In your project dashboard, go to **Settings** → **API**
2. Copy these values:

```
Project URL: https://xxxxx.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (click "Reveal" to see it)
```

3. Update your production `.env` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Run Database Setup (Two Steps)

#### Step 3.0: Clean Existing Data (If Starting Fresh)
If you have existing tables/data, run this **first** to clean everything:

```sql
-- ============================================
-- CLEANUP: Remove all existing tables and data
-- ============================================

-- Drop functions first
DROP FUNCTION IF EXISTS public.insert_email_verification(TEXT, TEXT, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.verify_email_otp(TEXT, TEXT);

-- Drop existing tables (in reverse dependency order)
DROP TABLE IF EXISTS public.kyc_documents CASCADE;
DROP TABLE IF EXISTS public.kyc_records CASCADE;
DROP TABLE IF EXISTS public.email_verifications CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop old tables if they exist
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.audit_log CASCADE;
DROP TABLE IF EXISTS public.payout_requests CASCADE;
DROP TABLE IF EXISTS public.fx_orders CASCADE;
DROP TABLE IF EXISTS public.ledger_entries CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.wallets CASCADE;

-- Drop storage bucket policies (only if buckets exist)
DO $$
BEGIN
    -- Drop policies only if they exist
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can upload own KYC documents' AND tablename = 'objects' AND schemaname = 'storage') THEN
        DROP POLICY "Users can upload own KYC documents" ON storage.objects;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own KYC documents' AND tablename = 'objects' AND schemaname = 'storage') THEN
        DROP POLICY "Users can read own KYC documents" ON storage.objects;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can upload own documents' AND tablename = 'objects' AND schemaname = 'storage') THEN
        DROP POLICY "Users can upload own documents" ON storage.objects;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own documents' AND tablename = 'objects' AND schemaname = 'storage') THEN
        DROP POLICY "Users can read own documents" ON storage.objects;
    END IF;
END $$;

-- Clean up any remaining data (buckets must be deleted manually from dashboard)
-- Note: Delete buckets manually from Supabase Dashboard > Storage before running this
```

#### Step 3.1: Create Tables and Policies
1. Go to **SQL Editor** in your Supabase dashboard
2. Click **"New query"**
3. Copy and paste everything from the SQL below **up to but not including** the "STEP 2" section:

```sql
-- ============================================
-- ITRANSFR DATABASE SCHEMA (UPDATED)
-- ============================================

-- Table 1: Users
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "supabaseUserId" TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  "fullName" TEXT NOT NULL,
  "companyName" TEXT,
  mobile TEXT,
  "countryCode" TEXT,
  city TEXT,
  country TEXT,
  pincode TEXT,
  "businessType" TEXT,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin', 'super_admin')),
  status TEXT NOT NULL DEFAULT 'pending_kyc' CHECK (status IN ('pending_kyc', 'active', 'suspended')),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_supabaseUserId ON public.users("supabaseUserId");
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Table 2: Email Verifications
CREATE TABLE IF NOT EXISTS public.email_verifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT NOT NULL,
  otp TEXT NOT NULL,
  "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "userId" TEXT REFERENCES public.users(id),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON public.email_verifications(email);
CREATE INDEX IF NOT EXISTS idx_email_verifications_expiresAt ON public.email_verifications("expiresAt");

-- Table 3: KYC Records
CREATE TABLE IF NOT EXISTS public.kyc_records (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  "amlbotRequestId" TEXT,
  "riskScore" DECIMAL,
  notes TEXT[] DEFAULT '{}',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kyc_records_userId ON public.kyc_records("userId");

-- Table 4: KYC Documents
CREATE TABLE IF NOT EXISTS public.kyc_documents (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "kycRecordId" TEXT NOT NULL REFERENCES public.kyc_records(id) ON DELETE CASCADE,
  "documentType" TEXT NOT NULL CHECK ("documentType" IN ('passport', 'address_proof', 'photo_id')),
  "fileName" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "uploadedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.kyc_documents DROP CONSTRAINT IF EXISTS unique_kyc_document_type;
ALTER TABLE public.kyc_documents ADD CONSTRAINT unique_kyc_document_type
UNIQUE ("kycRecordId", "documentType");

CREATE INDEX IF NOT EXISTS idx_kyc_documents_kycRecordId ON public.kyc_documents("kycRecordId");

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;

CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid()::text = "supabaseUserId");

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid()::text = "supabaseUserId");

CREATE POLICY "Users can insert own data" ON public.users
  FOR INSERT WITH CHECK (auth.uid()::text = "supabaseUserId");

-- RLS Policies for email_verifications
DROP POLICY IF EXISTS "Allow all operations on email_verifications" ON public.email_verifications;
CREATE POLICY "Allow all operations on email_verifications" ON public.email_verifications
  FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for kyc_records
DROP POLICY IF EXISTS "Users can read own KYC" ON public.kyc_records;
DROP POLICY IF EXISTS "Users can update own KYC" ON public.kyc_records;
DROP POLICY IF EXISTS "Users can insert own KYC" ON public.kyc_records;

CREATE POLICY "Users can read own KYC" ON public.kyc_records
  FOR SELECT USING (auth.uid()::text IN (
    SELECT "supabaseUserId" FROM public.users WHERE id = kyc_records."userId"
  ));

CREATE POLICY "Users can update own KYC" ON public.kyc_records
  FOR UPDATE USING (auth.uid()::text IN (
    SELECT "supabaseUserId" FROM public.users WHERE id = kyc_records."userId"
  ));

CREATE POLICY "Users can insert own KYC" ON public.kyc_records
  FOR INSERT WITH CHECK (auth.uid()::text IN (
    SELECT "supabaseUserId" FROM public.users WHERE id = kyc_records."userId"
  ));

-- RLS Policies for kyc_documents
DROP POLICY IF EXISTS "Users can read own KYC documents" ON public.kyc_documents;
DROP POLICY IF EXISTS "Users can insert own KYC documents" ON public.kyc_documents;

CREATE POLICY "Users can read own KYC documents" ON public.kyc_documents
  FOR SELECT USING (auth.uid()::text IN (
    SELECT u."supabaseUserId"
    FROM public.users u
    JOIN public.kyc_records kr ON u.id = kr."userId"
    WHERE kr.id = kyc_documents."kycRecordId"
  ));

CREATE POLICY "Users can insert own KYC documents" ON public.kyc_documents
  FOR INSERT WITH CHECK (auth.uid()::text IN (
    SELECT u."supabaseUserId"
    FROM public.users u
    JOIN public.kyc_records kr ON u.id = kr."userId"
    WHERE kr.id = kyc_documents."kycRecordId"
  ));

-- Grant permissions
GRANT ALL ON public.users TO anon, authenticated;
GRANT ALL ON public.email_verifications TO anon, authenticated;
GRANT ALL ON public.kyc_records TO anon, authenticated;
GRANT ALL ON public.kyc_documents TO anon, authenticated;

```

#### Step 3.2: Create Functions (Run Separately)
After the tables are created successfully, run a **new query** with just the functions:

```sql
-- ============================================
-- STEP 2: CREATE DATABASE FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.insert_email_verification(
  p_email TEXT,
  p_otp TEXT,
  p_expires_at TIMESTAMPTZ
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.email_verifications (email, otp, "expiresAt")
  VALUES (p_email, p_otp, p_expires_at);

  RETURN json_build_object('success', true);
EXCEPTION WHEN others THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_email_otp(
  p_email TEXT,
  p_otp TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_record RECORD;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  SELECT * INTO v_record
  FROM public.email_verifications
  WHERE email = p_email AND otp = p_otp
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid OTP');
  END IF;

  IF v_now > v_record."expiresAt" THEN
    DELETE FROM public.email_verifications WHERE email = p_email;
    RETURN json_build_object('success', false, 'error', 'OTP has expired');
  END IF;

  DELETE FROM public.email_verifications WHERE email = p_email AND otp = p_otp;

  RETURN json_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.insert_email_verification(TEXT, TEXT, TIMESTAMPTZ) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_email_otp(TEXT, TEXT) TO anon, authenticated;
```

4. Click **"Run"** to execute the SQL
5. Verify success message: "Success. No rows returned"

### 4. Create Storage Bucket

**CRITICAL:** Create a **new bucket** manually in Supabase Dashboard before KYC uploads will work.

1. Go to **Supabase Dashboard** → **Storage** (left sidebar)
2. Click **"+ New bucket"** (create new bucket)
3. Configure:
   - **Name**: `kyc-documents` (exactly this name - case sensitive)
   - **Public bucket**: ✅ **Toggle ON** (required for file access)
   - Click **"Create bucket"**

**⚠️ Do NOT skip this step** - KYC document uploads will fail with "Bucket not found" error if this bucket doesn't exist.

4. Set up storage policies - Go back to SQL Editor and run:

```sql
-- Storage Policies for KYC documents
DROP POLICY IF EXISTS "Users can upload own kyc documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own kyc documents" ON storage.objects;

CREATE POLICY "Users can upload own kyc documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'kyc-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can read own kyc documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'kyc-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

### 5. Configure Email Settings (Optional)

If you want to customize Supabase Auth emails:

1. Go to **Authentication** → **Email Templates**
2. Customize the templates for:
   - Confirm signup
   - Magic link
   - Change email address
   - Reset password

### 6. Enable Email Provider

1. Go to **Authentication** → **Providers**
2. Ensure **Email** is enabled
3. Configure settings:
   - **Enable Email Signup**: Yes
   - **Confirm email**: Optional (your app handles OTP verification)

### 7. Update Application Environment Variables

For production deployment, ensure your `.env.production` or hosting platform has:

```env
# AWS Credentials
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_DEFAULT_REGION=us-east-2
SES_FROM_ADDRESS=info@interviewscreener.com

# Supabase (Production)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## ✅ Verification Checklist

After setup, verify:

- [ ] **Step 1:** All tables exist in Table Editor (`users`, `email_verifications`, `kyc_records`, `kyc_documents`)
- [ ] **Step 1:** RLS is enabled on all tables
- [ ] **Step 2:** Functions `insert_email_verification` and `verify_email_otp` exist
- [ ] Storage bucket `kyc-documents` exists and is public
- [ ] Environment variables are updated
- [ ] Test signup flow works end-to-end

## 🔄 Schema Updates

If you need to update the schema later:

1. **Never drop tables in production!**
2. Use **migrations** for schema changes
3. Always backup before major changes:
   - Go to **Database** → **Backups**
   - Click **"Create backup"**

## 🐛 Troubleshooting

### "Table not found in schema cache"
- Solution: Pause and resume project in Settings → General
- Or use the RPC functions (already created in step 3)

### "Permission denied"
- Check RLS policies are correctly applied
- Verify GRANT statements ran successfully

### Storage upload fails
- Verify bucket is public
- Check storage policies are applied
- Ensure user is authenticated

## 📚 Additional Resources

- [Supabase Docs](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Guide](https://supabase.com/docs/guides/storage)

---

**Note**: For production, consider:
1. Using Redis for OTP storage instead of database
2. Setting up database backups
3. Monitoring query performance
4. Implementing rate limiting
