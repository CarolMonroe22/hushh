-- Remove overly permissive RLS policies that allow users to bypass rate limits
-- Edge functions use SUPABASE_SERVICE_ROLE_KEY which bypasses RLS entirely
-- These policies are not needed for edge functions and only create security vulnerabilities

-- Drop dangerous policy on rate_limits table
-- This policy allows ANY user to delete/modify rate limit records
DROP POLICY IF EXISTS "Service role can manage rate limits" ON public.rate_limits;

-- Drop dangerous policy on usage_analytics table  
-- This policy allows ANY user to insert fake analytics data
DROP POLICY IF EXISTS "Service role can insert analytics" ON public.usage_analytics;

-- Drop dangerous policy on asmr_sessions table
-- This policy allows ANY user to delete/modify cached audio sessions
DROP POLICY IF EXISTS "Service role can manage ASMR sessions" ON public.asmr_sessions;

-- Remaining policies after this migration:
-- ✅ rate_limits: "Users can view own rate limits" (read-only, scoped to user_id)
-- ✅ usage_analytics: "Users view own analytics" (read-only, scoped to user_id)  
-- ✅ asmr_sessions: "Public can read ASMR sessions" (read-only, public access)

-- Edge functions will continue to work because they use the service role key
-- which bypasses RLS entirely and has full database access