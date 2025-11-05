-- Create storage bucket for ASMR cache
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('asmr-cache', 'asmr-cache', true, 52428800, ARRAY['audio/mpeg']);

-- Create policies for public read access
CREATE POLICY "Public read access for ASMR cache"
ON storage.objects FOR SELECT
USING (bucket_id = 'asmr-cache');

-- Create policy for service role to insert
CREATE POLICY "Service role can insert ASMR files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'asmr-cache');

-- Create table to track ASMR sessions
CREATE TABLE public.asmr_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mood TEXT NOT NULL CHECK (mood IN ('relax', 'sleep', 'focus', 'gratitude')),
  ambient TEXT NOT NULL CHECK (ambient IN ('rain', 'ocean', 'forest', 'fireplace', 'white-noise')),
  audio_url TEXT NOT NULL,
  week_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  times_played INTEGER DEFAULT 0,
  UNIQUE(mood, ambient, week_key)
);

-- Enable RLS
ALTER TABLE public.asmr_sessions ENABLE ROW LEVEL SECURITY;

-- Allow public read
CREATE POLICY "Public can read ASMR sessions"
ON public.asmr_sessions FOR SELECT
USING (true);

-- Allow service role to insert/update
CREATE POLICY "Service role can manage ASMR sessions"
ON public.asmr_sessions FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_asmr_sessions_lookup ON public.asmr_sessions(mood, ambient, week_key);