-- Remove read access to early_access_emails table to prevent email harvesting
-- Users can still insert emails, but no one can read them from the frontend
DROP POLICY IF EXISTS "Authenticated can read emails" ON public.early_access_emails;