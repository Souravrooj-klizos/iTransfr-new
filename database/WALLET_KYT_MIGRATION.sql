-- =====================================================
-- WALLET & KYT INTEGRATION MIGRATION
-- iTransfr - Turnkey Wallet & AMLBot KYT Support
-- Created: 2026-01-06
-- =====================================================

-- =====================================================
-- PHASE 1: ENHANCE WALLETS TABLE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '📋 Starting Wallet & KYT Migration...';
END $$;

-- Add new columns to existing wallets table
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS network TEXT;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS wallet_type TEXT DEFAULT 'client' CHECK (wallet_type IN ('master', 'client', 'client_external'));
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS label TEXT;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending_deletion'));

-- KYT/AML fields
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS aml_risk_score DECIMAL(5,2);
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS aml_status TEXT DEFAULT 'not_checked' CHECK (aml_status IN ('not_checked', 'clear', 'warning', 'critical', 'blacklisted'));
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS aml_monitoring_enabled BOOLEAN DEFAULT false;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS aml_monitoring_uid TEXT;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS aml_alert_threshold DECIMAL(5,2) DEFAULT 35;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS aml_critical_threshold DECIMAL(5,2) DEFAULT 47;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS aml_last_checked TIMESTAMP WITH TIME ZONE;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS aml_last_signals JSONB;

-- Balance fields for multi-token support
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS usdc_balance DECIMAL(20,8) DEFAULT 0;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS usdt_balance DECIMAL(20,8) DEFAULT 0;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS native_balance DECIMAL(20,8) DEFAULT 0;

-- Dual-control deletion fields
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS deletion_status TEXT DEFAULT 'none' CHECK (deletion_status IN ('none', 'pending', 'approved', 'rejected'));
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS deletion_requested_by UUID REFERENCES admin_profiles(id);
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS deletion_approved_by UUID REFERENCES admin_profiles(id);
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS deletion_approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- Create indexes for wallet queries
CREATE INDEX IF NOT EXISTS idx_wallets_network ON wallets(network);
CREATE INDEX IF NOT EXISTS idx_wallets_address ON wallets(address);
CREATE INDEX IF NOT EXISTS idx_wallets_wallet_type ON wallets(wallet_type);
CREATE INDEX IF NOT EXISTS idx_wallets_aml_status ON wallets(aml_status);
CREATE INDEX IF NOT EXISTS idx_wallets_aml_monitoring ON wallets(aml_monitoring_enabled);

DO $$
BEGIN
    RAISE NOTICE '✅ Wallets table enhanced';
END $$;

-- =====================================================
-- PHASE 2: CREATE CLIENT-WALLET LINKS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS client_wallet_links (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  client_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  wallet_id TEXT NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  linked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  linked_by UUID REFERENCES admin_profiles(id),
  CONSTRAINT unique_client_wallet UNIQUE (client_id, wallet_id)
);

CREATE INDEX IF NOT EXISTS idx_client_wallet_links_client ON client_wallet_links(client_id);
CREATE INDEX IF NOT EXISTS idx_client_wallet_links_wallet ON client_wallet_links(wallet_id);

DO $$
BEGIN
    RAISE NOTICE '✅ Client-Wallet Links table created';
END $$;

-- =====================================================
-- PHASE 3: CREATE AML ALERTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS aml_alerts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  wallet_id TEXT REFERENCES wallets(id) ON DELETE SET NULL,
  address TEXT NOT NULL,
  network TEXT NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('risk_increase', 'threshold_exceeded', 'blacklisted', 'suspicious_activity')),
  previous_risk_score DECIMAL(5,2),
  new_risk_score DECIMAL(5,2),
  risk_signals JSONB,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  amlbot_uid TEXT,
  amlbot_payload JSONB,
  status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES admin_profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aml_alerts_wallet ON aml_alerts(wallet_id);
CREATE INDEX IF NOT EXISTS idx_aml_alerts_address ON aml_alerts(address);
CREATE INDEX IF NOT EXISTS idx_aml_alerts_status ON aml_alerts(status);
CREATE INDEX IF NOT EXISTS idx_aml_alerts_severity ON aml_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_aml_alerts_created ON aml_alerts(created_at DESC);

DO $$
BEGIN
    RAISE NOTICE '✅ AML Alerts table created';
END $$;

-- =====================================================
-- PHASE 4: CREATE AML SCREENINGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS aml_screenings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  wallet_id TEXT REFERENCES wallets(id) ON DELETE SET NULL,
  address TEXT NOT NULL,
  network TEXT NOT NULL,
  risk_score DECIMAL(5,2),
  risk_signals JSONB,
  is_blacklisted BOOLEAN DEFAULT false,
  amlbot_uid TEXT,
  amlbot_response JSONB,
  check_type TEXT DEFAULT 'manual' CHECK (check_type IN ('manual', 'automatic', 'monitoring', 'onboarding')),
  triggered_by UUID REFERENCES admin_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aml_screenings_wallet ON aml_screenings(wallet_id);
CREATE INDEX IF NOT EXISTS idx_aml_screenings_address ON aml_screenings(address);
CREATE INDEX IF NOT EXISTS idx_aml_screenings_created ON aml_screenings(created_at DESC);

DO $$
BEGIN
    RAISE NOTICE '✅ AML Screenings table created';
END $$;

-- =====================================================
-- PHASE 5: CREATE ADDRESSBOOK TABLE (WHITELISTING)
-- =====================================================

CREATE TABLE IF NOT EXISTS addressbook (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  label TEXT NOT NULL,
  address TEXT NOT NULL,
  network TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending_approval')),
  added_by UUID REFERENCES admin_profiles(id),
  approved_by UUID REFERENCES admin_profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_address_network UNIQUE (address, network)
);

CREATE INDEX IF NOT EXISTS idx_addressbook_address ON addressbook(address);
CREATE INDEX IF NOT EXISTS idx_addressbook_network ON addressbook(network);
CREATE INDEX IF NOT EXISTS idx_addressbook_status ON addressbook(status);

DO $$
BEGIN
    RAISE NOTICE '✅ Addressbook table created';
END $$;

-- =====================================================
-- PHASE 6: CREATE WALLET TRANSACTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  wallet_id TEXT NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  client_id UUID REFERENCES client_profiles(id),
  tx_type TEXT NOT NULL CHECK (tx_type IN ('deposit', 'withdrawal', 'swap', 'fee', 'transfer')),
  network TEXT NOT NULL,
  tx_hash TEXT,
  from_address TEXT,
  to_address TEXT,
  amount DECIMAL(20,8) NOT NULL,
  currency TEXT NOT NULL,
  amount_usd DECIMAL(20,2),
  fee_amount DECIMAL(20,8),
  fee_currency TEXT,
  fee_sponsored BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirming', 'completed', 'failed', 'cancelled')),
  confirmations INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_client ON wallet_transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status ON wallet_transactions(status);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_tx_hash ON wallet_transactions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created ON wallet_transactions(created_at DESC);

DO $$
BEGIN
    RAISE NOTICE '✅ Wallet Transactions table created';
END $$;

-- =====================================================
-- PHASE 7: ENABLE RLS POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE client_wallet_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE aml_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE aml_screenings ENABLE ROW LEVEL SECURITY;
ALTER TABLE addressbook ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access (using DROP IF EXISTS as CREATE IF NOT EXISTS is not supported for policies)

DROP POLICY IF EXISTS "Admin full access to client_wallet_links" ON client_wallet_links;
CREATE POLICY "Admin full access to client_wallet_links" 
ON client_wallet_links FOR ALL 
USING (true);

DROP POLICY IF EXISTS "Admin full access to aml_alerts" ON aml_alerts;
CREATE POLICY "Admin full access to aml_alerts" 
ON aml_alerts FOR ALL 
USING (true);

DROP POLICY IF EXISTS "Admin full access to aml_screenings" ON aml_screenings;
CREATE POLICY "Admin full access to aml_screenings" 
ON aml_screenings FOR ALL 
USING (true);

DROP POLICY IF EXISTS "Admin full access to addressbook" ON addressbook;
CREATE POLICY "Admin full access to addressbook" 
ON addressbook FOR ALL 
USING (true);

DROP POLICY IF EXISTS "Admin full access to wallet_transactions" ON wallet_transactions;
CREATE POLICY "Admin full access to wallet_transactions" 
ON wallet_transactions FOR ALL 
USING (true);

DO $$
BEGIN
    RAISE NOTICE '✅ RLS policies created';
END $$;

-- =====================================================
-- PHASE 8: UPDATE TRIGGERS
-- =====================================================

-- Add updated_at trigger for wallets
CREATE OR REPLACE FUNCTION update_wallet_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS wallet_updated_at ON wallets;
CREATE TRIGGER wallet_updated_at 
  BEFORE UPDATE ON wallets 
  FOR EACH ROW 
  EXECUTE FUNCTION update_wallet_timestamp();

DO $$
BEGIN
    RAISE NOTICE '✅ Triggers created';
END $$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Force PostgREST schema cache refresh
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

DO $$
BEGIN
    RAISE NOTICE '🎉 Wallet & KYT Migration Complete!';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables created/modified:';
    RAISE NOTICE '  - wallets (enhanced with KYT fields)';
    RAISE NOTICE '  - client_wallet_links';
    RAISE NOTICE '  - aml_alerts';
    RAISE NOTICE '  - aml_screenings';
    RAISE NOTICE '  - addressbook';
    RAISE NOTICE '  - wallet_transactions';
END $$;
