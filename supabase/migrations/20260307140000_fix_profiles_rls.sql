-- Allow all authenticated users to view all profiles (needed for BDR names in CRM)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "All authenticated users can view profiles"
ON public.profiles FOR SELECT TO authenticated
USING (true);

-- Allow users to insert their own profile (for auto-creation when missing)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Keep update policy as-is (users can only update their own profile)
