-- Add column for lead viewing permission to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS can_view_all_leads BOOLEAN DEFAULT FALSE;

-- Update existing admins and heads to have permission by default
UPDATE public.profiles SET can_view_all_leads = TRUE WHERE role IN ('admin', 'head_operacional');
