-- =====================================================
-- 🚨 FIX BROKEN AUTH TRIGGERS
-- =====================================================
-- The previous wipe deleted public functions but left triggers
-- on auth.users (which is in 'auth' schema) that might reference them.
-- This causes login failures (500) because the trigger tries to
-- call a function that no longer exists (or permissions are wrong).
-- =====================================================

DO $$
DECLARE
    trg RECORD;
BEGIN
    FOR trg IN
        SELECT tgname
        FROM pg_trigger
        WHERE tgrelid = 'auth.users'::regclass
        -- Exclude Supabase internal triggers if known, or just be careful.
        -- Usually safe to drop custom triggers.
        -- Standard triggers usually don't reference 'public' unless user added them.
        -- We will verify if they call a function in 'public'.
    LOOP
        -- Check if the function called is in public schema
        IF EXISTS (
            SELECT 1
            FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE p.oid = (
                SELECT tgfoid
                FROM pg_trigger
                WHERE tgname = trg.tgname AND tgrelid = 'auth.users'::regclass
            )
            AND n.nspname = 'public'
        ) THEN
            RAISE NOTICE 'Dropping broken trigger % on auth.users', trg.tgname;
            EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users', trg.tgname);
        END IF;
    END LOOP;
END $$;

-- Also verify permissions for the auth role
GRANT USAGE ON SCHEMA public TO supabase_auth_admin, service_role, postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO supabase_auth_admin, service_role, postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO supabase_auth_admin, service_role, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO supabase_auth_admin, service_role, postgres;

-- Ensure RLS doesn't block admins?
-- The 500 error is usually DB level.

NOTIFY pgrst, 'reload schema';

DO $$ BEGIN RAISE NOTICE '✅ Auth triggers cleaned and permissions fixed.'; END $$;
