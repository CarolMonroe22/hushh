-- Create table for public example sessions
CREATE TABLE IF NOT EXISTS public.example_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  example_key text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  session_type text NOT NULL,
  
  -- Session type specific fields
  binaural_experience text,
  vibe_description text,
  mood text,
  ambient text,
  
  -- Audio metadata
  audio_url text NOT NULL DEFAULT '',
  duration_seconds integer DEFAULT 60,
  
  -- Display metadata
  is_featured boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX idx_example_sessions_key ON public.example_sessions(example_key);
CREATE INDEX idx_example_sessions_featured ON public.example_sessions(is_featured, display_order);

-- Enable RLS
ALTER TABLE public.example_sessions ENABLE ROW LEVEL SECURITY;

-- Allow public read access (no authentication required)
CREATE POLICY "Anyone can read example sessions"
  ON public.example_sessions
  FOR SELECT
  TO public
  USING (true);

-- Add comment
COMMENT ON TABLE public.example_sessions IS 'Public example audio sessions for demo purposes';

-- Insert initial example data
INSERT INTO public.example_sessions (
  example_key,
  title,
  description,
  session_type,
  binaural_experience,
  audio_url,
  duration_seconds,
  display_order
) VALUES (
  'spa',
  'Spa Vibes',
  'Immersive 3D binaural spa experience with gentle whispers and soothing ambience',
  'binaural',
  'spa',
  '',
  60,
  1
);

INSERT INTO public.example_sessions (
  example_key,
  title,
  description,
  session_type,
  vibe_description,
  audio_url,
  duration_seconds,
  display_order
) VALUES (
  'sleep',
  'Sleep Helper',
  'Gentle voice guidance with calming rain and ocean waves to help you drift into peaceful sleep',
  'creator',
  'help me fall asleep peacefully with calming ambience',
  '',
  120,
  2
);