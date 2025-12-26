-- =====================================================
-- FINAL iTransfr PROJECT SETUP
-- Complete Clean Setup for Demo/Production
-- =====================================================
-- This script provides a COMPLETE clean setup:
-- ✅ Removes all old policies and data
-- ✅ Creates all tables with proper schema
-- ✅ Sets up admin authentication
-- ✅ Creates default admin user
-- ✅ Ready for immediate use
-- =====================================================

-- =====================================================
-- PHASE 1: COMPLETE CLEANUP
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🧹 PHASE 1: Starting complete cleanup...';
END $$;

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
DROP TABLE IF EXISTS client_management_actions CASCADE;
DROP TABLE IF EXISTS onboarding_sessions CASCADE;
DROP TABLE IF EXISTS pep_screening_responses CASCADE;
DROP TABLE IF EXISTS owner_addresses CASCADE;
DROP TABLE IF EXISTS beneficial_owners CASCADE;
DROP TABLE IF EXISTS business_operations CASCADE;
DROP TABLE IF EXISTS business_entities CASCADE;
DROP TABLE IF EXISTS admin_password_resets CASCADE;
DROP TABLE IF EXISTS admin_login_attempts CASCADE;
DROP TABLE IF EXISTS admin_sessions CASCADE;
DROP TABLE IF EXISTS admin_credentials CASCADE;
DROP TABLE IF EXISTS admin_roles CASCADE;
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

-- Drop all functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS is_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS hash_password(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS verify_password(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS authenticate_admin(TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS validate_admin_session(TEXT) CASCADE;
DROP FUNCTION IF EXISTS create_initial_admin(TEXT, TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_client_onboarding_progress(UUID) CASCADE;
DROP FUNCTION IF EXISTS reset_client_onboarding(UUID, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS validate_ownership_percentage(UUID) CASCADE;
DROP FUNCTION IF EXISTS has_minimum_owners(UUID) CASCADE;
DROP FUNCTION IF EXISTS migrate_current_clients_to_new_schema() CASCADE;
DROP FUNCTION IF EXISTS migrate_existing_clients() CASCADE;

-- Force PostgREST schema cache refresh
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

DO $$
BEGIN
    RAISE NOTICE '✅ PHASE 1: Cleanup completed - all old data and policies removed';
END $$;

-- =====================================================
-- PHASE 2: CREATE ALL TABLES
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '📋 PHASE 2: Creating all tables...';
END $$;

-- 1. EMAIL VERIFICATIONS
CREATE TABLE email_verifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT NOT NULL,
  otp TEXT NOT NULL,
  "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "userId" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_email_verifications_email ON email_verifications(email);

-- 2. CLIENT PROFILES
CREATE TABLE client_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  mobile TEXT,
  country_code TEXT,
  city TEXT,
  country TEXT,
  state TEXT,
  pincode TEXT,
  company_name TEXT,
  business_type TEXT,
  status TEXT NOT NULL DEFAULT 'pending_kyc' CHECK (status IN ('pending_kyc', 'active', 'suspended')),
  account_type TEXT CHECK (account_type IN ('personal', 'business', 'fintech')),
  entity_type TEXT,
  tax_id TEXT,
  business_address JSONB,
  website TEXT,
  industry TEXT,
  business_description TEXT,
  expected_monthly_volume TEXT,
  primary_use_case TEXT,
  onboarding_step INTEGER DEFAULT 1 CHECK (onboarding_step >= 1 AND onboarding_step <= 8),
  onboarding_completed BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_client_profiles_status ON client_profiles(status);
CREATE INDEX idx_client_profiles_account_type ON client_profiles(account_type);

-- 3. ADMIN PROFILES (Fixed - no auth.users dependency)
CREATE TABLE admin_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
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
CREATE INDEX idx_admin_profiles_email ON admin_profiles(email);

-- 4. ADMIN ROLES
CREATE TABLE admin_roles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  permissions TEXT[] DEFAULT '{}',
  is_system_role BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default roles
INSERT INTO admin_roles (name, display_name, description, permissions, is_system_role) VALUES
('super_admin', 'Super Administrator', 'Full system access', ARRAY['*'], true),
('admin', 'Administrator', 'Standard admin access', ARRAY['clients.view', 'clients.create', 'clients.edit', 'kyc.review', 'transactions.view', 'audit.view'], true),
('compliance_officer', 'Compliance Officer', 'KYC and compliance focus', ARRAY['clients.view', 'kyc.review', 'audit.view'], true),
('support_agent', 'Support Agent', 'Customer support access', ARRAY['clients.view', 'transactions.view'], true);

-- Add role relationship to admin_profiles
ALTER TABLE admin_profiles ADD COLUMN IF NOT EXISTS "roleId" TEXT REFERENCES admin_roles(id);
UPDATE admin_profiles SET "roleId" = (SELECT id FROM admin_roles WHERE name = 'admin') WHERE "roleId" IS NULL;
ALTER TABLE admin_profiles ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT '{}';

-- 5. ADMIN CREDENTIALS
CREATE TABLE admin_credentials (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "adminId" UUID NOT NULL REFERENCES admin_profiles(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_admin_credentials UNIQUE ("adminId"),
  CONSTRAINT unique_username UNIQUE (username)
);
-- Trigger moved to later section

-- 6. ADMIN SESSIONS
CREATE TABLE admin_sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "adminId" UUID NOT NULL REFERENCES admin_profiles(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT session_not_expired CHECK (expires_at > NOW())
);
CREATE INDEX idx_admin_sessions_adminId ON admin_sessions("adminId");
CREATE INDEX idx_admin_sessions_token ON admin_sessions(session_token);

-- 7. ADMIN LOGIN ATTEMPTS
CREATE TABLE admin_login_attempts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  username TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "adminId" UUID REFERENCES admin_profiles(id),
  failure_reason TEXT CHECK (failure_reason IN ('invalid_credentials', 'account_locked', 'account_inactive'))
);
CREATE INDEX idx_admin_login_attempts_username ON admin_login_attempts(username);

-- 8. ADMIN PASSWORD RESETS
CREATE TABLE admin_password_resets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "adminId" UUID NOT NULL REFERENCES admin_profiles(id) ON DELETE CASCADE,
  reset_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT reset_not_used CHECK (used_at IS NULL OR used_at <= expires_at),
  CONSTRAINT reset_not_expired CHECK (expires_at > NOW() OR used_at IS NOT NULL)
);

-- 9. KYC RECORDS
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

-- 10. KYC DOCUMENTS
CREATE TABLE kyc_documents (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "kycRecordId" TEXT NOT NULL REFERENCES kyc_records(id) ON DELETE CASCADE,
  "documentType" TEXT NOT NULL CHECK ("documentType" IN (
    'passport', 'driversLicenseFront', 'driversLicenseBack', 'idCard', 'idCardBack', 'proofOfAddress', 'selfie',
    'formationDocument', 'proofOfRegistration', 'proofOfOwnership', 'bankStatement', 'taxId', 'wolfsbergQuestionnaire',
    'agreement', 'registration', 'msbCert', 'mtlLicense', 'amlPolicy', 'amlAudit', 'soc2Report', 'transactionFlowDiagram',
    'owner_passport', 'owner_driversLicense', 'owner_national_id', 'owner_proof_of_address', 'owner_selfie'
  )),
  "fileName" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "s3Bucket" TEXT DEFAULT 'itransfr-kyc-documents',
  "s3Key" TEXT,
  "fileSize" BIGINT,
  "mimeType" TEXT,
  "uploadedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "ownerId" TEXT -- Optional reference to beneficial_owners
);
CREATE INDEX idx_kyc_documents_kycRecordId ON kyc_documents("kycRecordId");

-- 11. WALLETS
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

-- 12. TRANSACTIONS
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

-- 13. LEDGER ENTRIES
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

-- 14. FX ORDERS
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

-- 15. PAYOUT REQUESTS
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

-- 16. AUDIT LOG
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

-- 17. BUSINESS OPERATIONS
CREATE TABLE business_operations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "clientId" UUID UNIQUE NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  volume_swift_monthly DECIMAL(15,2),
  volume_local_monthly DECIMAL(15,2),
  volume_crypto_monthly DECIMAL(15,2),
  volume_international_tx_count INTEGER,
  volume_local_tx_count INTEGER,
  operating_currencies TEXT[] DEFAULT '{}',
  primary_operating_regions TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Trigger moved to later section

-- 18. BENEFICIAL OWNERS
CREATE TABLE beneficial_owners (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "clientId" UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  ownership_percentage DECIMAL(5,2) NOT NULL DEFAULT 100.00 CHECK (ownership_percentage > 0 AND ownership_percentage <= 100),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  phone_country_code TEXT,
  date_of_birth DATE,
  citizenship TEXT,
  secondary_citizenship TEXT,
  tax_id TEXT,
  role TEXT,
  is_authorized_signer BOOLEAN DEFAULT true,
  residential_country TEXT,
  residential_address TEXT,
  residential_apt TEXT,
  residential_city TEXT,
  residential_state TEXT,
  residential_postal_code TEXT,
  id_type TEXT CHECK (id_type IN ('passport', 'drivers_license', 'national_id', 'other')),
  id_number TEXT,
  id_issuing_country TEXT,
  id_issue_date DATE,
  id_expiration_date DATE,
  employment_status TEXT CHECK (employment_status IN ('employed', 'self_employed', 'unemployed', 'student', 'retired', 'other')),
  employment_industry TEXT,
  occupation TEXT,
  employer_name TEXT,
  source_of_income TEXT,
  source_of_wealth TEXT,
  annual_income TEXT,
  pep_senior_official BOOLEAN,
  pep_political_party BOOLEAN,
  pep_family_member BOOLEAN,
  pep_close_associate BOOLEAN,
  pep_screening_completed BOOLEAN DEFAULT false,
  pep_risk_level TEXT CHECK (pep_risk_level IN ('low', 'medium', 'high', 'review_required')),
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'under_review', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_beneficial_owners_clientId ON beneficial_owners("clientId");

-- 19. OWNER ADDRESSES
CREATE TABLE owner_addresses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "ownerId" TEXT NOT NULL REFERENCES beneficial_owners(id) ON DELETE CASCADE,
  address_type TEXT NOT NULL CHECK (address_type IN ('residential', 'business')),
  country TEXT NOT NULL,
  street_address TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  state_province_region TEXT,
  postal_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_owner_addresses_ownerId ON owner_addresses("ownerId");
-- Trigger moved to later section

-- 20. PEP SCREENING RESPONSES
CREATE TABLE pep_screening_responses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "ownerId" TEXT NOT NULL REFERENCES beneficial_owners(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  response BOOLEAN NOT NULL,
  details TEXT,
  screened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_owner_question UNIQUE ("ownerId", question_id)
);
CREATE INDEX idx_pep_responses_ownerId ON pep_screening_responses("ownerId");

-- 21. ONBOARDING SESSIONS
CREATE TABLE onboarding_sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "clientId" UUID REFERENCES client_profiles(id) ON DELETE CASCADE, -- Nullable until client is created
  session_data JSONB DEFAULT '{}',
  current_step INTEGER DEFAULT 1 CHECK (current_step >= 1 AND current_step <= 8),
  completed_steps INTEGER[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Add expiry for shared forms
  expires_at TIMESTAMP WITH TIME ZONE
);
-- Trigger moved to later section

-- 22. CLIENT MANAGEMENT ACTIONS
CREATE TABLE client_management_actions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "adminId" UUID NOT NULL REFERENCES admin_profiles(id) ON DELETE CASCADE,
  "clientId" UUID REFERENCES client_profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'suspended', 'activated', 'deleted', 'onboarding_reset')),
  previous_status TEXT,
  new_status TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_client_management_actions_adminId ON client_management_actions("adminId");

-- =====================================================
-- PHASE 3: CREATE BASE FUNCTIONS FIRST
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '⚙️ PHASE 3: Creating base functions...';
END $$;

-- Base functions (needed before triggers)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle different column naming conventions
  CASE TG_TABLE_NAME
    WHEN 'client_profiles' THEN NEW."updatedAt" = NOW();
    WHEN 'admin_profiles' THEN NEW."updatedAt" = NOW();
    WHEN 'kyc_records' THEN NEW."updatedAt" = NOW();
    WHEN 'wallets' THEN NEW."updatedAt" = NOW();
    WHEN 'transactions' THEN NEW."updatedAt" = NOW();
    WHEN 'payout_requests' THEN NEW."updatedAt" = NOW();
    WHEN 'admin_credentials' THEN NEW.updated_at = NOW();
    WHEN 'admin_roles' THEN NEW.updated_at = NOW();
    WHEN 'business_operations' THEN NEW.updated_at = NOW();
    WHEN 'beneficial_owners' THEN NEW.updated_at = NOW();
    WHEN 'owner_addresses' THEN NEW.updated_at = NOW();
    WHEN 'onboarding_sessions' THEN NEW.updated_at = NOW();
    ELSE
      -- Default to camelCase
      NEW."updatedAt" = NOW();
  END CASE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM admin_profiles WHERE id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM admin_profiles WHERE id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Password functions
CREATE OR REPLACE FUNCTION hash_password(password TEXT, salt TEXT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
    generated_salt TEXT;
BEGIN
    IF salt IS NULL THEN
        generated_salt := encode(gen_random_bytes(16), 'hex');
    ELSE
        generated_salt := salt;
    END IF;
    RETURN generated_salt || ':' || encode(digest(password || generated_salt, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION verify_password(password TEXT, password_hash TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    parts TEXT[];
    salt TEXT;
    hash TEXT;
    computed_hash TEXT;
BEGIN
    parts := string_to_array(password_hash, ':');
    IF array_length(parts, 1) != 2 THEN
        RETURN false;
    END IF;
    salt := parts[1];
    hash := parts[2];
    computed_hash := encode(digest(password || salt, 'sha256'), 'hex');
    RETURN computed_hash = hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin authentication
CREATE OR REPLACE FUNCTION authenticate_admin(
    p_username TEXT,
    p_password TEXT,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    admin_record RECORD;
    cred_record RECORD;
    session_token TEXT;
    login_result JSON;
BEGIN
    SELECT ap.*, ac.* INTO admin_record
    FROM admin_profiles ap
    JOIN admin_credentials ac ON ap.id = ac."adminId"
    WHERE ac.username = p_username AND ac.is_active = true;

    IF NOT FOUND THEN
        INSERT INTO admin_login_attempts (username, success, failure_reason, ip_address, user_agent)
        VALUES (p_username, false, 'invalid_credentials', p_ip_address, p_user_agent);
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid credentials',
            'attempts_remaining', NULL
        );
    END IF;

    IF admin_record.locked_until IS NOT NULL AND admin_record.locked_until > NOW() THEN
        INSERT INTO admin_login_attempts (username, "adminId", success, failure_reason, ip_address, user_agent)
        VALUES (p_username, admin_record."adminId", false, 'account_locked', p_ip_address, p_user_agent);
        RETURN json_build_object(
            'success', false,
            'error', 'Account temporarily locked',
            'locked_until', admin_record.locked_until
        );
    END IF;

    IF NOT verify_password(p_password, admin_record.password_hash) THEN
        UPDATE admin_credentials
        SET login_attempts = login_attempts + 1,
            locked_until = CASE
                WHEN login_attempts + 1 >= 5 THEN NOW() + INTERVAL '15 minutes'
                ELSE NULL
            END
        WHERE "adminId" = admin_record."adminId";

        INSERT INTO admin_login_attempts (username, "adminId", success, failure_reason, ip_address, user_agent)
        VALUES (p_username, admin_record."adminId", false, 'invalid_credentials', p_ip_address, p_user_agent);

        RETURN json_build_object(
            'success', false,
            'error', 'Invalid credentials',
            'attempts_remaining', GREATEST(0, 4 - (admin_record.login_attempts + 1))
        );
    END IF;

    UPDATE admin_credentials
    SET login_attempts = 0,
        locked_until = NULL,
        last_login = NOW()
    WHERE "adminId" = admin_record."adminId";

    session_token := encode(gen_random_bytes(32), 'hex');

    INSERT INTO admin_sessions ("adminId", session_token, expires_at, ip_address, user_agent)
    VALUES (admin_record."adminId", session_token, NOW() + INTERVAL '24 hours', p_ip_address, p_user_agent);

    INSERT INTO admin_login_attempts (username, "adminId", success, ip_address, user_agent)
    VALUES (p_username, admin_record."adminId", true, p_ip_address, p_user_agent);

    RETURN json_build_object(
        'success', true,
        'session_token', session_token,
        'admin', json_build_object(
            'id', admin_record.id,
            'first_name', admin_record.first_name,
            'last_name', admin_record.last_name,
            'email', admin_record.email,
            'role', admin_record.role,
            'department', admin_record.department,
            'permissions', admin_record.permissions
        ),
        'expires_at', (NOW() + INTERVAL '24 hours')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Session validation
CREATE OR REPLACE FUNCTION validate_admin_session(p_session_token TEXT)
RETURNS JSON AS $$
DECLARE
    session_record RECORD;
BEGIN
    SELECT asess.*, ap.* INTO session_record
    FROM admin_sessions asess
    JOIN admin_profiles ap ON asess."adminId" = ap.id
    WHERE asess.session_token = p_session_token
        AND asess.is_active = true
        AND asess.expires_at > NOW();

    IF NOT FOUND THEN
        RETURN json_build_object('valid', false, 'error', 'Invalid or expired session');
    END IF;

    RETURN json_build_object(
        'valid', true,
        'admin', json_build_object(
            'id', session_record."adminId",
            'first_name', session_record.first_name,
            'last_name', session_record.last_name,
            'email', session_record.email,
            'role', session_record.role,
            'department', session_record.department,
            'permissions', session_record.permissions
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create initial admin
CREATE OR REPLACE FUNCTION create_initial_admin(
    p_first_name TEXT,
    p_last_name TEXT,
    p_email TEXT,
    p_username TEXT,
    p_password TEXT
) RETURNS UUID AS $$
DECLARE
    admin_id UUID;
    hashed_password TEXT;
BEGIN
    INSERT INTO admin_profiles (first_name, last_name, email, role, "roleId")
    VALUES (
        p_first_name,
        p_last_name,
        p_email,
        'super_admin',
        (SELECT id FROM admin_roles WHERE name = 'super_admin')
    )
    RETURNING id INTO admin_id;

    hashed_password := hash_password(p_password);

    INSERT INTO admin_credentials ("adminId", username, password_hash, password_salt)
    VALUES (
        admin_id,
        p_username,
        hashed_password,
        split_part(hashed_password, ':', 1)
    );

    RETURN admin_id;
END;
$$ LANGUAGE plpgsql;

-- Onboarding progress function
CREATE OR REPLACE FUNCTION get_client_onboarding_progress(client_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
    client_record RECORD;
    owner_record RECORD;
    docs_count INTEGER;
BEGIN
    SELECT * INTO client_record FROM client_profiles WHERE id = client_uuid;
    IF NOT FOUND THEN
        RETURN json_build_object('error', 'Client not found');
    END IF;

    SELECT * INTO owner_record FROM beneficial_owners WHERE "clientId" = client_uuid;
    SELECT COUNT(*) INTO docs_count FROM kyc_documents WHERE "kycRecordId" IN (
        SELECT id FROM kyc_records WHERE "userId" = client_uuid
    );

    result := json_build_object(
        'clientId', client_record.id,
        'accountType', client_record.account_type,
        'currentStep', COALESCE(client_record.onboarding_step, 1),
        'onboardingCompleted', COALESCE(client_record.onboarding_completed, false),
        'businessInfoCompleted', (client_record.business_name IS NOT NULL),
        'businessDetailsCompleted', (client_record.industry IS NOT NULL AND client_record.business_description IS NOT NULL),
        'operationsCompleted', EXISTS(SELECT 1 FROM business_operations WHERE "clientId" = client_uuid),
        'ownerInfoCompleted', (owner_record IS NOT NULL AND owner_record.first_name IS NOT NULL),
        'pepScreeningCompleted', COALESCE(owner_record.pep_screening_completed, false),
        'documentsUploaded', docs_count,
        'kycStatus', COALESCE((SELECT status FROM kyc_records WHERE "userId" = client_uuid), 'not_started'),
        'overallProgress', CASE
            WHEN client_record.onboarding_completed THEN 100
            ELSE LEAST(client_record.onboarding_step * 12.5, 87.5)
        END
    );
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PHASE 4: CREATE ALL TRIGGERS (AFTER FUNCTIONS)
-- =====================================================

DO $$
-- Client Creation Function (Admin Onboarding)
CREATE OR REPLACE FUNCTION create_client_with_onboarding(
  p_created_by TEXT,           -- 'user' or 'admin'
  p_creator_id TEXT,           -- UUID of creator
  p_account_type TEXT,         -- 'personal', 'business', 'fintech'
  p_country TEXT,              -- ISO country code
  p_entity_type TEXT,          -- Entity type based on country
  p_business_name TEXT,        -- Business/company name
  p_tax_id TEXT,               -- Tax ID
  p_state TEXT,                -- State/region (optional)
  p_business_address JSONB,    -- Business address object
  p_website TEXT,              -- Website URL (optional)
  p_phone TEXT,                -- Phone number (E.164 format)
  p_phone_country_code TEXT,   -- Phone country code
  p_industry TEXT,             -- Industry sector
  p_business_description TEXT, -- Business description
  p_expected_monthly_volume TEXT, -- Expected volume
  p_primary_use_case TEXT,     -- Primary use case
  p_business_operations JSONB, -- Business operations data
  p_owners JSONB,              -- Array of owner objects
  p_pep_screening JSONB,       -- PEP screening responses
  p_documents JSONB,           -- Array of document objects
  p_metadata JSONB DEFAULT '{}' -- Additional metadata
) RETURNS JSON AS $$
DECLARE
  v_client_id UUID;
  v_kyc_record_id TEXT;
  v_onboarding_session_id TEXT;
  v_owner_record RECORD;
  v_document_record RECORD;
  v_address_id TEXT;
  v_total_ownership NUMERIC := 0;
BEGIN
  -- Validate input parameters
  IF p_created_by NOT IN ('user', 'admin') THEN
    RAISE EXCEPTION 'Invalid created_by value. Must be user or admin.';
  END IF;

  IF p_account_type NOT IN ('personal', 'business', 'fintech') THEN
    RAISE EXCEPTION 'Invalid account_type. Must be personal, business, or fintech.';
  END IF;

  -- For admin-created clients, create a new auth user
  IF p_created_by = 'admin' THEN
    -- Generate a temporary email for admin-created clients
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role
    )
    VALUES (
      gen_random_uuid(),
      'admin-created-' || gen_random_uuid() || '@itransfr.internal',
      crypt(gen_random_uuid()::text, gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{}',
      false,
      'authenticated'
    )
    RETURNING id INTO v_client_id;
  ELSE
    -- For user-created clients, use the provided creator_id
    v_client_id := p_creator_id::UUID;
  END IF;

  -- Create client profile
  INSERT INTO client_profiles (
    id,
    account_type,
    first_name,
    last_name,
    company_name,
    business_type,
    tax_id,
    country,
    state,
    city,
    country_code,
    mobile,
    business_address,
    website,
    industry,
    business_description,
    expected_monthly_volume,
    primary_use_case,
    onboarding_step,
    status,
    "createdAt",
    "updatedAt"
  ) VALUES (
    v_client_id,
    p_account_type,
    -- Fix: Ensure first_name/last_name are never null, as per table schema
    COALESCE(p_owners->0->>'firstName', 'Business'),
    COALESCE(p_owners->0->>'lastName', 'Account'),
    CASE WHEN p_account_type IN ('business', 'fintech') THEN p_business_name ELSE NULL END,
    CASE WHEN p_account_type IN ('business', 'fintech') THEN p_entity_type ELSE NULL END,
    p_tax_id,
    p_country,
    p_state,
    p_business_address->>'city',
    p_phone_country_code,
    p_phone,
    p_business_address,
    p_website,
    p_industry,
    p_business_description,
    p_expected_monthly_volume,
    p_primary_use_case,
    1, -- Start at step 1
    'pending_kyc',
    NOW(),
    NOW()
  );

  -- Create business operations (for business/fintech accounts)
  IF p_account_type IN ('business', 'fintech') THEN
    INSERT INTO business_operations (
      "clientId",
      volume_swift_monthly,
      volume_local_monthly,
      volume_crypto_monthly,
      volume_international_tx_count,
      volume_local_tx_count,
      operating_currencies,
      primary_operating_regions,
      created_at,
      updated_at
    ) VALUES (
      v_client_id,
      (p_business_operations->>'volumeSwiftMonthly')::DECIMAL,
      (p_business_operations->>'volumeLocalMonthly')::DECIMAL,
      (p_business_operations->>'volumeCryptoMonthly')::DECIMAL,
      (p_business_operations->>'volumeInternationalTxCount')::INTEGER,
      (p_business_operations->>'volumeLocalTxCount')::INTEGER,
      -- Use ARRAY(SELECT ...) to safely cast JSON array to Postgres array
      (SELECT ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_business_operations->'operatingCurrencies', '[]'::jsonb)))),
      (SELECT ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_business_operations->'primaryOperatingRegions', '[]'::jsonb)))),
      NOW(),
      NOW()
    );
  END IF;

  -- Create beneficial owners
  FOR v_owner_record IN SELECT * FROM jsonb_array_elements(p_owners)
  LOOP
    -- Validate ownership percentage
    v_total_ownership := v_total_ownership + (v_owner_record.value->>'ownershipPercentage')::NUMERIC;

    IF (v_owner_record.value->>'type') = 'person' THEN
      -- Create person owner
      INSERT INTO beneficial_owners (
        "clientId",
        first_name,
        last_name,
        email,
        phone,
        phone_country_code,
        date_of_birth,
        citizenship,
        secondary_citizenship,
        tax_id,
        role,
        ownership_percentage,
        is_authorized_signer,
        residential_country,
        residential_address,
        residential_apt,
        residential_city,
        residential_state,
        residential_postal_code,
        id_type,
        id_number,
        id_issuing_country,
        id_issue_date,
        id_expiration_date,
        employment_status,
        employment_industry,
        occupation,
        employer_name,
        source_of_income,
        source_of_wealth,
        annual_income,
        pep_senior_official,
        pep_political_party,
        pep_family_member,
        pep_close_associate,
        pep_screening_completed,
        verification_status,
        created_at,
        updated_at
      ) VALUES (
        v_client_id,
        v_owner_record.value->>'firstName',
        v_owner_record.value->>'lastName',
        v_owner_record.value->>'email',
        v_owner_record.value->>'phone',
        v_owner_record.value->>'phoneCountryCode',
        (v_owner_record.value->>'dateOfBirth')::DATE,
        v_owner_record.value->>'citizenship',
        v_owner_record.value->>'secondaryCitizenship',
        v_owner_record.value->>'taxId',
        v_owner_record.value->>'role',
        (v_owner_record.value->>'ownershipPercentage')::DECIMAL,
        (v_owner_record.value->>'isAuthorizedSigner')::BOOLEAN,
        v_owner_record.value->>'residentialCountry',
        v_owner_record.value->>'residentialAddress',
        v_owner_record.value->>'residentialApt',
        v_owner_record.value->>'residentialCity',
        v_owner_record.value->>'residentialState',
        v_owner_record.value->>'residentialPostalCode',
        v_owner_record.value->>'idType',
        v_owner_record.value->>'idNumber',
        v_owner_record.value->>'idIssuingCountry',
        (v_owner_record.value->>'idIssueDate')::DATE,
        (v_owner_record.value->>'idExpirationDate')::DATE,
        v_owner_record.value->>'employmentStatus',
        v_owner_record.value->>'employmentIndustry',
        v_owner_record.value->>'occupation',
        v_owner_record.value->>'employerName',
        v_owner_record.value->>'sourceOfIncome',
        v_owner_record.value->>'sourceOfWealth',
        v_owner_record.value->>'annualIncome',
        (p_pep_screening->>'isPEPSeniorOfficial')::BOOLEAN,
        (p_pep_screening->>'isPEPPoliticalParty')::BOOLEAN,
        (p_pep_screening->>'isPEPFamilyMember')::BOOLEAN,
        (p_pep_screening->>'isPEPCloseAssociate')::BOOLEAN,
        true, -- PEP screening completed
        'pending',
        NOW(),
        NOW()
      );

      -- Create owner address record
      INSERT INTO owner_addresses (
        "ownerId",
        address_type,
        country,
        street_address,
        address_line_2,
        city,
        state_province_region,
        postal_code,
        created_at,
        updated_at
      ) VALUES (
        (SELECT id FROM beneficial_owners WHERE "clientId" = v_client_id AND email = v_owner_record.value->>'email' LIMIT 1),
        'residential',
        v_owner_record.value->>'residentialCountry',
        v_owner_record.value->>'residentialAddress',
        v_owner_record.value->>'residentialApt',
        v_owner_record.value->>'residentialCity',
        v_owner_record.value->>'residentialState',
        v_owner_record.value->>'residentialPostalCode',
        NOW(),
        NOW()
      );

    ELSE
      -- Create entity owner (corporate shareholder)
      INSERT INTO beneficial_owners (
        "clientId",
        first_name,
        last_name,
        email, -- Entities might not have email in form, use placeholder or skip? Schema says email NOT NULL.
        -- We will generate a placeholder if missing
        phone,
        citizenship, -- country/jurisdiction
        tax_id, -- registration number
        role,
        ownership_percentage,
        is_authorized_signer,
        residential_country, -- entity country
        residential_address, -- might be missing, use country
        residential_city, -- might be missing
        residential_postal_code, -- might be missing
        verification_status,
        created_at,
        updated_at
      ) VALUES (
        v_client_id,
        v_owner_record.value->>'entityName',
        '(Entity)',
        COALESCE(v_owner_record.value->>'email', 'entity-' || gen_random_uuid() || '@placeholder.com'),
        v_owner_record.value->>'phone',
        v_owner_record.value->>'entityCountry',
        v_owner_record.value->>'registrationNumber',
        'shareholder', -- Default role for entities
        (v_owner_record.value->>'ownershipPercentage')::DECIMAL,
        false, -- Entities usually represented by a person for signing
        v_owner_record.value->>'entityCountry',
        v_owner_record.value->>'entityCountry', -- Placeholder address
        v_owner_record.value->>'entityCountry', -- Placeholder city
        '00000', -- Placeholder zip
        'pending',
        NOW(),
        NOW()
      );
    END IF;
  END LOOP;

  -- Validate total ownership percentage
  IF ABS(v_total_ownership - 100.0) > 0.01 THEN
    RAISE EXCEPTION 'Total ownership percentage must equal 100%%. Current total: %%%', v_total_ownership;
  END IF;

  -- Create PEP screening responses
  FOR v_owner_record IN SELECT * FROM jsonb_array_elements(p_owners)
  LOOP
    IF (v_owner_record.value->>'type') = 'person' THEN
      INSERT INTO pep_screening_responses (
        "ownerId",
        question_id,
        response,
        details,
        screened_at,
        created_at
      ) VALUES
      (
        (SELECT id FROM beneficial_owners WHERE "clientId" = v_client_id AND email = v_owner_record.value->>'email' LIMIT 1),
        'pep_senior_official',
        (p_pep_screening->>'isPEPSeniorOfficial')::BOOLEAN,
        CASE WHEN (p_pep_screening->>'isPEPSeniorOfficial')::BOOLEAN THEN 'PEP senior official identified' ELSE NULL END,
        NOW(),
        NOW()
      ),
      (
        (SELECT id FROM beneficial_owners WHERE "clientId" = v_client_id AND email = v_owner_record.value->>'email' LIMIT 1),
        'pep_political_party',
        (p_pep_screening->>'isPEPPoliticalParty')::BOOLEAN,
        CASE WHEN (p_pep_screening->>'isPEPPoliticalParty')::BOOLEAN THEN 'PEP political party official identified' ELSE NULL END,
        NOW(),
        NOW()
      ),
      (
        (SELECT id FROM beneficial_owners WHERE "clientId" = v_client_id AND email = v_owner_record.value->>'email' LIMIT 1),
        'pep_family_member',
        (p_pep_screening->>'isPEPFamilyMember')::BOOLEAN,
        CASE WHEN (p_pep_screening->>'isPEPFamilyMember')::BOOLEAN THEN 'PEP family member identified' ELSE NULL END,
        NOW(),
        NOW()
      ),
      (
        (SELECT id FROM beneficial_owners WHERE "clientId" = v_client_id AND email = v_owner_record.value->>'email' LIMIT 1),
        'pep_close_associate',
        (p_pep_screening->>'isPEPCloseAssociate')::BOOLEAN,
        CASE WHEN (p_pep_screening->>'isPEPCloseAssociate')::BOOLEAN THEN 'PEP close associate identified' ELSE NULL END,
        NOW(),
        NOW()
      );
    END IF; -- End PEP check for person
  END LOOP;

  -- Create onboarding session
  INSERT INTO onboarding_sessions (
    "clientId",
    session_data,
    current_step,
    completed_steps,
    is_active,
    started_at,
    last_updated,
    created_at,
    updated_at
  ) VALUES (
    v_client_id,
    jsonb_build_object(
      'createdBy', p_created_by,
      'creatorId', p_creator_id,
      'accountType', p_account_type,
      'metadata', p_metadata
    ),
    1,
    '{1,2,3,4,5,6,7,8}', -- Mark all steps as complete
    false, -- Session inactive (completed)
    NOW(),
    NOW(),
    NOW(),
    NOW()
  ) RETURNING id INTO v_onboarding_session_id;

  -- Create KYC record
  INSERT INTO kyc_records (
    "userId",
    status,
    notes,
    "createdAt",
    "updatedAt"
  ) VALUES (
    v_client_id,
    'pending',
    ARRAY['Client created via API', 'AMLBot verification pending'],
    NOW(),
    NOW()
  ) RETURNING id INTO v_kyc_record_id;

  -- Create KYC documents
  FOR v_document_record IN SELECT * FROM jsonb_array_elements(p_documents)
  LOOP
    INSERT INTO kyc_documents (
      "kycRecordId",
      "documentType",
      "fileName",
      "fileUrl",
      "s3Bucket",
      "s3Key",
      "fileSize",
      "mimeType",
      "uploadedAt"
    ) VALUES (
      v_kyc_record_id,
      v_document_record.value->>'type',
      v_document_record.value->>'fileName',
      v_document_record.value->>'fileUrl',
      'itransfr-kyc-documents',
      split_part(v_document_record.value->>'fileUrl', '/', -1),
      (v_document_record.value->>'fileSize')::BIGINT,
      v_document_record.value->>'mimeType',
      NOW()
    );
  END LOOP;

  -- Return success response
  RETURN json_build_object(
    'client_id', v_client_id,
    'kyc_record_id', v_kyc_record_id,
    'onboarding_session_id', v_onboarding_session_id,
    'status', 'created',
    'account_type', p_account_type,
    'current_step', 8,
    'total_owners', jsonb_array_length(p_owners),
    'total_documents', jsonb_array_length(p_documents)
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create client: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

BEGIN
    RAISE NOTICE '🔄 PHASE 4: Creating all triggers...';
END $$;

-- All triggers created here after functions are defined
CREATE TRIGGER update_client_profiles_updated_at
  BEFORE UPDATE ON client_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_profiles_updated_at
  BEFORE UPDATE ON admin_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_credentials_updated_at
  BEFORE UPDATE ON admin_credentials
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

CREATE TRIGGER update_business_operations_updated_at
  BEFORE UPDATE ON business_operations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_onboarding_sessions_updated_at
  BEFORE UPDATE ON onboarding_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_owner_addresses_updated_at
  BEFORE UPDATE ON owner_addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PHASE 5: SET UP ROW LEVEL SECURITY
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🔒 PHASE 5: Setting up security policies...';
END $$;

-- Enable RLS on all tables
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficial_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_management_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_password_resets ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE pep_screening_responses ENABLE ROW LEVEL SECURITY;

-- Client Profiles
CREATE POLICY "Users can read own profile" ON client_profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON client_profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can read all profiles" ON client_profiles
  FOR SELECT USING (is_admin(auth.uid()::uuid));
CREATE POLICY "Service role full access" ON client_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- Admin Profiles
CREATE POLICY "Admins can read admin profiles" ON admin_profiles
  FOR SELECT USING (is_admin(auth.uid()::uuid));
CREATE POLICY "Service role full access admin profiles" ON admin_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- Admin Credentials
CREATE POLICY "Admins can access own credentials" ON admin_credentials
  FOR ALL USING ("adminId" = auth.uid()::uuid);
CREATE POLICY "Service role full access admin credentials" ON admin_credentials
  FOR ALL USING (auth.role() = 'service_role');

-- Admin Sessions
CREATE POLICY "Admins can access own sessions" ON admin_sessions
  FOR ALL USING ("adminId" = auth.uid()::uuid);
CREATE POLICY "Service role full access admin sessions" ON admin_sessions
  FOR ALL USING (auth.role() = 'service_role');

-- Admin Login Attempts
CREATE POLICY "Admins can see own login attempts" ON admin_login_attempts
  FOR SELECT USING ("adminId" = auth.uid()::uuid);
CREATE POLICY "Service role full access login attempts" ON admin_login_attempts
  FOR ALL USING (auth.role() = 'service_role');

-- Admin Roles
CREATE POLICY "Admins can read roles" ON admin_roles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admin Password Resets
CREATE POLICY "Admins can access own password resets" ON admin_password_resets
  FOR ALL USING ("adminId" = auth.uid()::uuid);

-- KYC Records
CREATE POLICY "Users can read own KYC" ON kyc_records
  FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Users can insert own KYC" ON kyc_records
  FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "Admins can read all KYC" ON kyc_records
  FOR SELECT USING (is_admin(auth.uid()::uuid));
CREATE POLICY "Admins can update all KYC" ON kyc_records
  FOR UPDATE USING (is_admin(auth.uid()::uuid));
CREATE POLICY "Service role full access KYC" ON kyc_records
  FOR ALL USING (auth.role() = 'service_role');

-- KYC Documents
CREATE POLICY "Users can read own documents" ON kyc_documents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM kyc_records WHERE id = "kycRecordId" AND "userId" = auth.uid())
  );
CREATE POLICY "Admins can read all documents" ON kyc_documents
  FOR SELECT USING (is_admin(auth.uid()::uuid));
CREATE POLICY "Service role full access docs" ON kyc_documents
  FOR ALL USING (auth.role() = 'service_role');

-- Business Operations
CREATE POLICY "Users can read own operations" ON business_operations
  FOR SELECT USING ("clientId" = auth.uid());
CREATE POLICY "Users can manage own operations" ON business_operations
  FOR ALL USING ("clientId" = auth.uid());
CREATE POLICY "Admins can read all operations" ON business_operations
  FOR SELECT USING (is_admin(auth.uid()::uuid));

-- Beneficial Owners
CREATE POLICY "Users can read own owners" ON beneficial_owners
  FOR SELECT USING ("clientId" = auth.uid());
CREATE POLICY "Users can manage own owners" ON beneficial_owners
  FOR ALL USING ("clientId" = auth.uid());
CREATE POLICY "Admins can read all owners" ON beneficial_owners
  FOR SELECT USING (is_admin(auth.uid()::uuid));

-- Onboarding Sessions
CREATE POLICY "Users can read own sessions" ON onboarding_sessions
  FOR SELECT USING ("clientId" = auth.uid());
CREATE POLICY "Users can manage own sessions" ON onboarding_sessions
  FOR ALL USING ("clientId" = auth.uid());

-- Client Management Actions
CREATE POLICY "Admins can read client actions" ON client_management_actions
  FOR SELECT USING (is_admin(auth.uid()::uuid));
CREATE POLICY "Admins can create client actions" ON client_management_actions
  FOR INSERT WITH CHECK (is_admin(auth.uid()::uuid));

-- Owner Addresses
CREATE POLICY "Users can read own owner addresses" ON owner_addresses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM beneficial_owners bo
      WHERE bo.id = "ownerId" AND bo."clientId" = auth.uid()
    )
  );
CREATE POLICY "Users can manage own owner addresses" ON owner_addresses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM beneficial_owners bo
      WHERE bo.id = "ownerId" AND bo."clientId" = auth.uid()
    )
  );
CREATE POLICY "Admins can read all owner addresses" ON owner_addresses
  FOR SELECT USING (is_admin(auth.uid()::uuid));

-- PEP Screening Responses
CREATE POLICY "Users can read own PEP responses" ON pep_screening_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM beneficial_owners bo
      WHERE bo.id = "ownerId" AND bo."clientId" = auth.uid()
    )
  );
CREATE POLICY "Admins can read all PEP responses" ON pep_screening_responses
  FOR SELECT USING (is_admin(auth.uid()::uuid));

-- =====================================================
-- PHASE 6: CREATE DEFAULT ADMIN USER
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '👤 PHASE 6: Creating default admin user...';
END $$;

-- Create the default admin user
SELECT create_initial_admin(
  'Super',           -- first_name
  'Admin',           -- last_name
  'admin@itransfr.com', -- email
  'admin',           -- username
  'SecurePass123!'   -- password
);

-- =====================================================
-- PHASE 7: FINAL VERIFICATION
-- =====================================================

-- Force PostgREST schema cache refresh
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Show all tables created
SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' AND table_name NOT LIKE 'pg_%'
ORDER BY table_name;

-- Verify admin creation
DO $$
DECLARE
    admin_count INTEGER;
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO admin_count FROM admin_credentials WHERE username = 'admin';
    SELECT COUNT(*) INTO table_count FROM information_schema.tables WHERE table_schema = 'public' AND table_name NOT LIKE 'pg_%';

    RAISE NOTICE '';
    RAISE NOTICE '🎉 FINAL PROJECT SETUP COMPLETED!';
    RAISE NOTICE '=====================================';
    RAISE NOTICE '✅ Tables created: %', table_count;
    RAISE NOTICE '✅ Admin user created: %', CASE WHEN admin_count > 0 THEN 'YES' ELSE 'NO' END;
    RAISE NOTICE '';
    RAISE NOTICE '🔑 Admin Login Credentials:';
    RAISE NOTICE '   URL: /admin-login';
    RAISE NOTICE '   Username: admin';
    RAISE NOTICE '   Password: SecurePass123!';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Ready for client demo!';
    RAISE NOTICE '=====================================';
END $$;

