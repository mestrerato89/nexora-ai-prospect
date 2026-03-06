
-- Make user_id optional to allow unassigned leads (pool of leads)
ALTER TABLE public.leads ALTER COLUMN user_id DROP NOT NULL;

-- Drop restrictive policies on leads
DROP POLICY IF EXISTS "Users can delete their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can insert their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;

-- Recreate policies to allow unassigned leads and admin access
CREATE POLICY "Users can view their own or unassigned leads"
ON public.leads FOR SELECT TO authenticated
USING (
  auth.uid() = user_id 
  OR user_id IS NULL 
  OR (SELECT (raw_user_meta_data->>'role') FROM auth.users WHERE id = auth.uid()) = 'admin'
  OR (SELECT (raw_user_meta_data->>'role') FROM auth.users WHERE id = auth.uid()) = 'head_operacional'
);

CREATE POLICY "Users can insert their own or unassigned leads"
ON public.leads FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  OR user_id IS NULL
);

CREATE POLICY "Users can update their own or unassigned leads"
ON public.leads FOR UPDATE TO authenticated
USING (
  auth.uid() = user_id 
  OR user_id IS NULL 
  OR (SELECT (raw_user_meta_data->>'role') FROM auth.users WHERE id = auth.uid()) = 'admin'
  OR (SELECT (raw_user_meta_data->>'role') FROM auth.users WHERE id = auth.uid()) = 'head_operacional'
);

CREATE POLICY "Users can delete their own leads or if admin"
ON public.leads FOR DELETE TO authenticated
USING (
  auth.uid() = user_id 
  OR (SELECT (raw_user_meta_data->>'role') FROM auth.users WHERE id = auth.uid()) = 'admin'
);
