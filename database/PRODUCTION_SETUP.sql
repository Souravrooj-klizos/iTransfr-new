-- =====================================================
-- iTransfr PRODUCTION DATABASE SETUP
-- =====================================================
-- Run this ENTIRE script in Supabase SQL Editor (one time)
-- This creates all tables needed by the application
--
-- Tables created:
--   1. email_verifications - OTP storage
--   2. client_profiles     - Customer accounts
--   3. admin_profiles      - Admin accounts
--   4. kyc_records         - KYC status tracking
--   5. kyc_documents       - Uploaded KYC files
--   6. wallets             - User currency wallets
--   7. transactions        - All transactions
--   8. ledger_entries      - Double-entry ledger
--   9. fx_orders           - Currency exchange orders
--  10. payout_requests     - Payout tracking
--  11. audit_log           - Admin action logs
-- =====================================================

-- =====================================================
-- STEP 1: COMPLETE CLEANUP (Drops EVERYTHING)
-- =====================================================

-- Drop all policies first (they depend on tables)
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
            pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- Drop all triggers
DO $$
DECLARE
    trg RECORD;
BEGIN
    FOR trg IN
        SELECT trigger_name, event_object_table
        FROM information_schema.triggers
        WHERE trigger_schema = 'public'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I CASCADE',
            trg.trigger_name, trg.event_object_table);
    END LOOP;
END $$;

-- Drop all tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS payout_requests CASCADE;
DROP TABLE IF EXISTS fx_orders CASCADE;
DROP TABLE IF EXISTS ledger_entries CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS wallets CASCADE;
DROP TABLE IF EXISTS kyc_documents CASCADE;
DROP TABLE IF EXISTS kyc_records CASCADE;
DROP TABLE IF EXISTS email_verifications CASCADE;
DROP TABLE IF EXISTS client_profiles CASCADE;
DROP TABLE IF EXISTS admin_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS kyc_status CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS is_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;

-- Force PostgREST schema cache refresh
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Small delay to allow cache refresh
SELECT pg_sleep(0.5);

DO $$ BEGIN RAISE NOTICE '🧹 Cleanup completed - all tables, policies, and cache cleared!'; END $$;

-- =====================================================
-- STEP 2: CREATE TABLES
-- =====================================================

-- 1. EMAIL VERIFICATIONS (OTP for signup)
CREATE TABLE email_verifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT NOT NULL,
  otp TEXT NOT NULL,
  "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "userId" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_email_verifications_email ON email_verifications(email);

-- 2. CLIENT PROFILES (Customers)
CREATE TABLE client_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  mobile TEXT,
  country_code TEXT,
  city TEXT,
  country TEXT,
  pincode TEXT,
  company_name TEXT,
  business_type TEXT,
  status TEXT NOT NULL DEFAULT 'pending_kyc' CHECK (status IN ('pending_kyc', 'active', 'suspended')),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_client_profiles_status ON client_profiles(status);

-- 3. ADMIN PROFILES (Staff)
CREATE TABLE admin_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  mobile TEXT,
  country_code TEXT,
  city TEXT,
  country TEXT,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  department TEXT,
  employee_id TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_admin_profiles_role ON admin_profiles(role);

-- 4. KYC RECORDS (Verification status)
CREATE TABLE kyc_records (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" UUID UNIQUE NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  "amlbotRequestId" TEXT,
  "riskScore" DECIMAL,
  notes TEXT[] DEFAULT '{}',
  "reviewedBy" UUID REFERENCES admin_profiles(id),
  "reviewedAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_kyc_records_userId ON kyc_records("userId");
CREATE INDEX idx_kyc_records_status ON kyc_records(status);

-- 5. KYC DOCUMENTS (Uploaded files)
CREATE TABLE kyc_documents (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "kycRecordId" TEXT NOT NULL REFERENCES kyc_records(id) ON DELETE CASCADE,
  "documentType" TEXT NOT NULL CHECK ("documentType" IN ('passport', 'address_proof', 'photo_id')),
  "fileName" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "s3Bucket" TEXT DEFAULT 'itransfr-kyc-documents',
  "s3Key" TEXT,
  "fileSize" BIGINT,
  "mimeType" TEXT,
  "uploadedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE kyc_documents ADD CONSTRAINT unique_kyc_doc_type UNIQUE ("kycRecordId", "documentType");
CREATE INDEX idx_kyc_documents_kycRecordId ON kyc_documents("kycRecordId");

-- 6. WALLETS (User currency balances)
CREATE TABLE wallets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  currency TEXT NOT NULL,
  balance DECIMAL(18, 8) NOT NULL DEFAULT 0,
  "turnkeyWalletId" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE wallets ADD CONSTRAINT unique_user_currency UNIQUE ("userId", currency);
CREATE INDEX idx_wallets_userId ON wallets("userId");

-- 7. TRANSACTIONS (Core transaction table)
CREATE TABLE transactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'swap', 'payout', 'fee')),
  status TEXT NOT NULL DEFAULT 'pending',
  amount DECIMAL(18, 8) NOT NULL,
  currency TEXT NOT NULL,
  "referenceNumber" TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transactions_userId ON transactions("userId");
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);

-- 8. LEDGER ENTRIES (Double-entry accounting)
CREATE TABLE ledger_entries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "transactionId" TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  account TEXT NOT NULL,
  debit DECIMAL(18, 8) DEFAULT 0,
  credit DECIMAL(18, 8) DEFAULT 0,
  currency TEXT NOT NULL,
  description TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ledger_entries_transactionId ON ledger_entries("transactionId");

-- 9. FX ORDERS (Currency exchange)
CREATE TABLE fx_orders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "transactionId" TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  "fromCurrency" TEXT NOT NULL,
  "toCurrency" TEXT NOT NULL,
  "fromAmount" DECIMAL(18, 8) NOT NULL,
  "toAmount" DECIMAL(18, 8),
  "exchangeRate" DECIMAL(18, 8),
  "bitsoOrderId" TEXT,
  "bitsoQuoteId" TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  "executedAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_fx_orders_transactionId ON fx_orders("transactionId");

-- 10. PAYOUT REQUESTS (Outbound payments)
CREATE TABLE payout_requests (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "transactionId" TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  "userId" UUID REFERENCES client_profiles(id),
  "destinationCountry" TEXT,
  "destinationBank" JSONB,
  "recipientName" TEXT,
  "recipientAccount" TEXT,
  "recipientBank" TEXT,
  "recipientBankCode" TEXT,
  "recipientCountry" TEXT,
  amount DECIMAL(18, 8) NOT NULL,
  currency TEXT NOT NULL,
  "infinitusRequestId" TEXT,
  "infinitusTrackingNumber" TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  "sentAt" TIMESTAMP WITH TIME ZONE,
  "completedAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payout_requests_transactionId ON payout_requests("transactionId");
CREATE INDEX idx_payout_requests_userId ON payout_requests("userId");

-- 11. AUDIT LOG (Admin actions)
CREATE TABLE audit_log (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "adminId" UUID REFERENCES admin_profiles(id),
  action TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "oldValues" JSONB,
  "newValues" JSONB,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_log_adminId ON audit_log("adminId");

-- =====================================================
-- STEP 3: AUTOMATIC TIMESTAMP UPDATES
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_client_profiles_updated_at
  BEFORE UPDATE ON client_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_profiles_updated_at
  BEFORE UPDATE ON admin_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kyc_records_updated_at
  BEFORE UPDATE ON kyc_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payout_requests_updated_at
  BEFORE UPDATE ON payout_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 4: HELPER FUNCTIONS
-- =====================================================
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM admin_profiles WHERE id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 5: ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;

-- Client Profiles: Users can read/update own, admins can read all
CREATE POLICY "Users can read own profile" ON client_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON client_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles" ON client_profiles
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Service role full access" ON client_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- KYC Records: Users can read own, admins can read/update all
CREATE POLICY "Users can read own KYC" ON kyc_records
  FOR SELECT USING (auth.uid() = "userId");

CREATE POLICY "Users can insert own KYC" ON kyc_records
  FOR INSERT WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Admins can read all KYC" ON kyc_records
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all KYC" ON kyc_records
  FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Service role full access KYC" ON kyc_records
  FOR ALL USING (auth.role() = 'service_role');

-- KYC Documents: Same as KYC Records
CREATE POLICY "Users can read own documents" ON kyc_documents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM kyc_records WHERE id = "kycRecordId" AND "userId" = auth.uid())
  );

CREATE POLICY "Admins can read all documents" ON kyc_documents
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Service role full access docs" ON kyc_documents
  FOR ALL USING (auth.role() = 'service_role');

-- Wallets: Users can read own
CREATE POLICY "Users can read own wallets" ON wallets
  FOR SELECT USING (auth.uid() = "userId");

CREATE POLICY "Service role full access wallets" ON wallets
  FOR ALL USING (auth.role() = 'service_role');

-- Transactions: Users can read own, admins can read all
CREATE POLICY "Users can read own transactions" ON transactions
  FOR SELECT USING (auth.uid() = "userId");

CREATE POLICY "Admins can read all transactions" ON transactions
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Service role full access transactions" ON transactions
  FOR ALL USING (auth.role() = 'service_role');

-- Payout Requests: Users can read own
CREATE POLICY "Users can read own payouts" ON payout_requests
  FOR SELECT USING (auth.uid() = "userId");

CREATE POLICY "Service role full access payouts" ON payout_requests
  FOR ALL USING (auth.role() = 'service_role');

-- Admin Profiles: Only admins can read
CREATE POLICY "Admins can read admin profiles" ON admin_profiles
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Service role full access admin" ON admin_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- STEP 6: FINAL CACHE REFRESH & VERIFY
-- =====================================================

-- Force PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Show created tables
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '✅ DATABASE SETUP COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'All 11 tables created with RLS policies';
  RAISE NOTICE 'Schema cache has been refreshed';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Update your .env files with Supabase credentials';
  RAISE NOTICE '=====================================================';
END $$;
