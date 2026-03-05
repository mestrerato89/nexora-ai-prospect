
-- Drop restrictive policies on leads
DROP POLICY IF EXISTS "Users can delete their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can insert their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Users can view their own leads"
ON public.leads FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own leads"
ON public.leads FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads"
ON public.leads FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leads"
ON public.leads FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Fix same issue on prospections table
DROP POLICY IF EXISTS "Users can insert their own prospections" ON public.prospections;
DROP POLICY IF EXISTS "Users can update their own prospections" ON public.prospections;
DROP POLICY IF EXISTS "Users can view their own prospections" ON public.prospections;

CREATE POLICY "Users can view their own prospections"
ON public.prospections FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own prospections"
ON public.prospections FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prospections"
ON public.prospections FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- Fix prospect_cache too
DROP POLICY IF EXISTS "Anon can insert prospect cache" ON public.prospect_cache;
DROP POLICY IF EXISTS "Anon can update prospect cache" ON public.prospect_cache;
DROP POLICY IF EXISTS "Anyone can read prospect cache" ON public.prospect_cache;

CREATE POLICY "Anyone can read prospect cache"
ON public.prospect_cache FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert prospect cache"
ON public.prospect_cache FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update prospect cache"
ON public.prospect_cache FOR UPDATE
USING (true) WITH CHECK (true);

-- Fix follow_ups
DROP POLICY IF EXISTS "Users can delete their own follow_ups" ON public.follow_ups;
DROP POLICY IF EXISTS "Users can insert their own follow_ups" ON public.follow_ups;
DROP POLICY IF EXISTS "Users can update their own follow_ups" ON public.follow_ups;
DROP POLICY IF EXISTS "Users can view their own follow_ups" ON public.follow_ups;

CREATE POLICY "Users can view their own follow_ups"
ON public.follow_ups FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own follow_ups"
ON public.follow_ups FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own follow_ups"
ON public.follow_ups FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own follow_ups"
ON public.follow_ups FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Fix profiles
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- Fix projects
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;

CREATE POLICY "Users can view their own projects"
ON public.projects FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
ON public.projects FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
ON public.projects FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
ON public.projects FOR DELETE TO authenticated
USING (auth.uid() = user_id);
