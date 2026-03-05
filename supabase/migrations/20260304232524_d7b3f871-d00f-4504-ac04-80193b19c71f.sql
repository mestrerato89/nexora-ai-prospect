
-- Disable RLS on all tables to allow operations without auth
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospections DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospect_cache DISABLE ROW LEVEL SECURITY;
