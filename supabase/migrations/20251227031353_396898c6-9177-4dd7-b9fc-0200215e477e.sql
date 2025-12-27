-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Schedule daily cleanup of old rate limits at 3 AM UTC
SELECT cron.schedule(
  'cleanup-old-rate-limits',
  '0 3 * * *',
  'SELECT public.cleanup_old_rate_limits()'
);