-- Create community_likes table for tracking user likes
CREATE TABLE IF NOT EXISTS public.community_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.user_sessions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, session_id)
);

-- Enable RLS on community_likes
ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_likes
CREATE POLICY "Users can insert own likes"
  ON public.community_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON public.community_likes
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view likes"
  ON public.community_likes
  FOR SELECT
  USING (true);

-- Add likes_count column to user_sessions
ALTER TABLE public.user_sessions 
ADD COLUMN IF NOT EXISTS likes_count integer DEFAULT 0;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_community_likes_session_id ON public.community_likes(session_id);
CREATE INDEX IF NOT EXISTS idx_community_likes_user_id ON public.community_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_likes_count ON public.user_sessions(likes_count DESC);