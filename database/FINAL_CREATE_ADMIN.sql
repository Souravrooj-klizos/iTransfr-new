-- =====================================================
-- 🚨 FINAL ADMIN CREATOR (CLEAN & ROBUST)
-- =====================================================
-- Strategy:
-- 1. CLEANUP: Wipe any existing user with this email (auth & profiles)
-- 2. CREATE USER: Insert into auth.users with proper hashing and metadata
-- 3. CREATE IDENTITY: Insert into auth.identities (CRITICAL for login)
-- 4. CREATE PROFILE: Insert into public.admin_profiles
-- 5. VERIFY: Return the created data
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    -- CONFIGURATION
    target_email TEXT := 'admin@klizos.com';
    target_password TEXT := 'Password12@';

    -- VARIABLES
    new_user_id UUID;
BEGIN
    RAISE NOTICE '🚀 Starting Admin Creation for: %', target_email;

    -- 1. CLEANUP: Remove any existing user with this email
    -- This ensures we don't have partial/corrupted states
    DECLARE
        existing_id UUID;
    BEGIN
        SELECT id INTO existing_id FROM auth.users WHERE email = target_email;

        IF existing_id IS NOT NULL THEN
            RAISE NOTICE '🗑️ Found existing user. Deleting to ensure clean slate...';
            -- Delete from public profiles first (FK constraints)
            DELETE FROM public.admin_profiles WHERE id = existing_id;
            DELETE FROM public.client_profiles WHERE id = existing_id;

            -- Delete from auth tables
            DELETE FROM auth.identities WHERE user_id = existing_id;
            DELETE FROM auth.users WHERE id = existing_id;
            RAISE NOTICE '✅ Cleanup complete.';
        END IF;
    END;

    -- 2. CREATE USER in auth.users
    new_user_id := gen_random_uuid();

    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        new_user_id,
        'authenticated',
        'authenticated',
        target_email,
        crypt(target_password, gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"full_name": "Super Admin"}'::jsonb,
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    );

    RAISE NOTICE '✅ User created in auth.users (ID: %)', new_user_id;

    -- 3. CREATE IDENTITY in auth.identities
    -- This is essential for the "Database error querying schema" 500 error
    -- which often stems from missing identity or provider linkage
    INSERT INTO auth.identities (
        id,
        user_id,
        provider_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        new_user_id,
        new_user_id::text, -- Correct for email provider
        jsonb_build_object('sub', new_user_id, 'email', target_email),
        'email',
        NOW(),
        NOW(),
        NOW()
    );

    RAISE NOTICE '✅ Identity created in auth.identities';

    -- 4. CREATE ADMIN PROFILE
    INSERT INTO public.admin_profiles (
        id,
        first_name,
        last_name,
        role,
        department
    ) VALUES (
        new_user_id,
        'Super',
        'Admin',
        'super_admin',
        'Headquarters'
    );

    RAISE NOTICE '✅ Profile created in public.admin_profiles';

    -- FINAL SUCCESS MESSAGE
    RAISE NOTICE '';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '✅ ADMIN CREATION SUCCESSFUL';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Email:    %', target_email;
    RAISE NOTICE 'Password: %', target_password;
    RAISE NOTICE 'User ID:  %', new_user_id;
    RAISE NOTICE '=====================================================';

END $$;

-- 5. REFRESH SCHEMA CACHE
-- Just in case any permissions/schema info is stale
NOTIFY pgrst, 'reload schema';
