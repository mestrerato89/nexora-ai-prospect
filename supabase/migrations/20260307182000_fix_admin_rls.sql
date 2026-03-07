-- Fix profiles: allow admins to update ANY profile (for changing roles)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update own profile or admin can update any"
ON public.profiles FOR UPDATE TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role = 'admin'
  )
);

-- Fix leads DELETE: use profiles.role instead of raw_user_meta_data
DROP POLICY IF EXISTS "Users can delete their own leads or if admin" ON public.leads;

CREATE POLICY "Users can delete leads"
ON public.leads FOR DELETE TO authenticated
USING (
  auth.uid() = user_id
  OR user_id IS NULL
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'head_operacional')
  )
);

-- Also fix leads UPDATE policy to use profiles.role
DROP POLICY IF EXISTS "Users can update their own or unassigned leads" ON public.leads;

CREATE POLICY "Users can update leads"
ON public.leads FOR UPDATE TO authenticated
USING (
  auth.uid() = user_id
  OR user_id IS NULL
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'head_operacional')
  )
);
