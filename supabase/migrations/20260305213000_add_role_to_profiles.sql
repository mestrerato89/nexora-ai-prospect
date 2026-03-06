-- Add role column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'employee';

-- Update RLS for profiles to allow admins to see all profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Profiles are viewable by owners and admins"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id OR (SELECT (raw_user_meta_data->>'role') FROM auth.users WHERE id = auth.uid()) = 'admin');

-- Also allow admins to update profiles
CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE
USING ((SELECT (raw_user_meta_data->>'role') FROM auth.users WHERE id = auth.uid()) = 'admin');
