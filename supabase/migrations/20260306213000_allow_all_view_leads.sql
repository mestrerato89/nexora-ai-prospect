-- Make the leads table visible to all authenticated users so the CRM is fully shared
DROP POLICY IF EXISTS "Users can view their own or unassigned leads" ON public.leads;

CREATE POLICY "All authenticated users can view all leads"
ON public.leads FOR SELECT TO authenticated
USING (true);
