-- Create user_sessions table for personal session history
CREATE TABLE public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_type text NOT NULL, -- 'preset', 'creator', 'binaural', 'voice'
  
  -- For preset sessions (mood + ambient)
  mood text,
  ambient text,
  
  -- For creator sessions (custom vibe)
  vibe_description text,
  
  -- For binaural experiences
  binaural_experience text,
  
  -- For voice journeys
  voice_journey text,
  voice_gender text,
  
  -- Audio and metadata
  audio_url text NOT NULL,
  duration_seconds integer DEFAULT 60,
  
  -- Statistics
  times_played integer DEFAULT 0,
  last_played_at timestamp with time zone,
  is_favorite boolean DEFAULT false,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_created_at ON public.user_sessions(created_at DESC);
CREATE INDEX idx_user_sessions_favorites ON public.user_sessions(user_id, is_favorite) WHERE is_favorite = true;

-- Enable Row Level Security
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only view their own sessions
CREATE POLICY "Users can view own sessions"
  ON public.user_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can insert own sessions"
  ON public.user_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions"
  ON public.user_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own sessions
CREATE POLICY "Users can delete own sessions"
  ON public.user_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_user_sessions_updated_at
  BEFORE UPDATE ON public.user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Database function to increment play count
CREATE OR REPLACE FUNCTION public.increment_session_play_count(session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.user_sessions
  SET 
    times_played = times_played + 1,
    last_played_at = now()
  WHERE id = session_id;
END;
$$;