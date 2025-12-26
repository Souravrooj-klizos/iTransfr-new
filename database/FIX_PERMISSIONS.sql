-- =====================================================
-- 🚨 CRITICAL PERMISSION FIX
-- =====================================================
-- Run this script to fix "permission denied" errors
-- and 500 errors after a database wipe.
-- =====================================================

-- 1. Grant usage on public schema
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- 2. Grant access to all tables for service_role (Admin API)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- 3. Grant access for authenticated users (logged in)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 4. Grant specific access for anon users (Guest/Login/Signup)
GRANT SELECT, INSERT ON TABLE email_verifications TO anon;

-- Optional: If you want anon to read specific public data (e.g. content)
-- GRANT SELECT ON TABLE some_public_table TO anon;

-- 5. Fix ownership (ensure tables are owned by postgres role usually)
-- This loop ensures all tables are owned by the role that has full control
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' OWNER TO postgres';
        EXECUTE 'GRANT ALL ON TABLE public.' || quote_ident(r.tablename) || ' TO postgres';
        EXECUTE 'GRANT ALL ON TABLE public.' || quote_ident(r.tablename) || ' TO service_role';
    END LOOP;
END $$;

-- 6. Ensure RLS is enabled on email_verifications (was missing)
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

-- 7. Add RLS policy for email_verifications so anon can insert/select
-- Allow anon to insert OTPs
DROP POLICY IF EXISTS "Anon can insert email verifications" ON email_verifications;
CREATE POLICY "Anon can insert email verifications" ON email_verifications
  FOR INSERT WITH CHECK (true);

-- Allow anon to read OTPs (risky? usually we only need insert, verification happens serverside via service_role)
-- Ideally, verify logic uses service_role, so anon doesn't need select.
-- But if your client queries it, you need SELECT.
-- The current API implementation uses `supabaseAdmin` (service_role) to verify,
-- implies anon users DO NOT need select access to email_verifications.
-- They only need access if the client calls supabase.from('email_verifications')... directly.
-- Since your logs show "permission denied" in the 'send' route which uses supabaseAdmin,
-- the recursive issue is likely service_role missing grants, which step 2 fixes.

-- 8. Refresh schema cache
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

DO $$ BEGIN RAISE NOTICE '✅ Permissions fixed! Try your request again.'; END $$;
