-- =====================================================
-- FRESH START MIGRATION FOR CLIENT NOTES feature
-- =====================================================

-- 1. Sync Auth Users to Admin Profiles FIRST
-- This ensures the Foreign Key target exists before we create the table.
-- We do this first to prevent any 'key not present' errors.
INSERT INTO public.admin_profiles (id, email, first_name, last_name, role, department)
SELECT
  id,
  email,
  coalesce(raw_user_meta_data->>'first_name', 'Admin') as first_name,
  coalesce(raw_user_meta_data->>'last_name', 'User') as last_name,
  'admin' as role,
  'Support' as department
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.admin_profiles)
ON CONFLICT (id) DO NOTHING;


-- 2. Drop existing table to remove any bad constraints/state
DROP TABLE IF EXISTS public.client_notes CASCADE;


-- 3. Create client_notes table with Correct FK
CREATE TABLE public.client_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "clientId" UUID NOT NULL REFERENCES public.client_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'General',
  content TEXT NOT NULL,

  -- DIRECT REFERENCE to admin_profiles is required for API joins
  "createdById" UUID REFERENCES public.admin_profiles(id) ON DELETE SET NULL,

  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- 4. Add RLS Policies
ALTER TABLE public.client_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all notes" ON public.client_notes
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can insert notes" ON public.client_notes
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can delete notes" ON public.client_notes
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid()));


-- 5. Create Index
CREATE INDEX idx_client_notes_client_id ON public.client_notes("clientId");


-- 6. Refresh Schema Cache
NOTIFY pgrst, 'reload schema';
