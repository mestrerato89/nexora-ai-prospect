
-- Remove foreign key constraints on user_id referencing auth.users
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_user_id_fkey;
ALTER TABLE public.prospections DROP CONSTRAINT IF EXISTS prospections_user_id_fkey;
ALTER TABLE public.follow_ups DROP CONSTRAINT IF EXISTS follow_ups_user_id_fkey;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_user_id_fkey;
