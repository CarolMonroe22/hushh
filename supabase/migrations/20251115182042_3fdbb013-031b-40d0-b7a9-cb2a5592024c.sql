-- Drop the RLS policy that depends on user_id column
DROP POLICY IF EXISTS "Users can view own rate limits" ON rate_limits;

-- Change user_id column type from UUID to TEXT to support IP-based rate limiting
ALTER TABLE rate_limits 
ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- Recreate the RLS policy with TEXT comparison
CREATE POLICY "Users can view own rate limits" 
ON rate_limits 
FOR SELECT 
USING (auth.uid()::TEXT = user_id);

-- Update the increment function to accept TEXT instead of UUID
CREATE OR REPLACE FUNCTION public.increment_rate_limit(
  p_user_id TEXT,
  p_endpoint TEXT,
  p_window_start TIMESTAMPTZ
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.rate_limits (user_id, endpoint, window_start, request_count)
  VALUES (p_user_id, p_endpoint, p_window_start, 1)
  ON CONFLICT (user_id, endpoint, window_start)
  DO UPDATE SET 
    request_count = rate_limits.request_count + 1,
    updated_at = now();
END;
$$;