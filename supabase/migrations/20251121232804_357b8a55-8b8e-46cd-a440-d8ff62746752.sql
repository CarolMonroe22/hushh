-- Table to track system operations that should run only once
CREATE TABLE IF NOT EXISTS public.system_flags (
  flag_key text PRIMARY KEY,
  is_completed boolean DEFAULT false,
  completed_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_flags ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write flags
CREATE POLICY "Service role can manage system flags"
ON public.system_flags FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Authenticated users can view flags
CREATE POLICY "Authenticated users can view system flags"
ON public.system_flags FOR SELECT
TO authenticated
USING (true);

-- Insert the flag for example audios setup
INSERT INTO public.system_flags (flag_key, is_completed, metadata)
VALUES (
  'examples_audio_setup',
  false,
  '{"description": "Setup example audio files in storage"}'::jsonb
);

-- Trigger to update updated_at
CREATE TRIGGER update_system_flags_updated_at
  BEFORE UPDATE ON public.system_flags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();