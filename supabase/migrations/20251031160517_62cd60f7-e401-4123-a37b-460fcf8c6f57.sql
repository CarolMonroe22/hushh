-- Create votes table to store all votes
CREATE TABLE public.votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  vote text NOT NULL CHECK (vote IN ('yes', 'no')),
  feature text NOT NULL DEFAULT '1hour_ambient',
  session_id text,
  user_agent text,
  ip_address inet
);

-- Indexes for performance
CREATE INDEX idx_votes_created_at ON public.votes(created_at DESC);
CREATE INDEX idx_votes_feature ON public.votes(feature);

-- Enable RLS
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Anyone can insert votes (anonymous or authenticated)
CREATE POLICY "Anyone can insert votes"
  ON public.votes 
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated can read votes (for analytics)
CREATE POLICY "Only authenticated can read votes"
  ON public.votes 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Create early_access_emails table
CREATE TABLE public.early_access_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  email text NOT NULL UNIQUE,
  feature text NOT NULL DEFAULT '1hour_ambient',
  notified boolean DEFAULT false,
  vote_id uuid REFERENCES public.votes(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_early_access_emails_email ON public.early_access_emails(email);
CREATE INDEX idx_early_access_emails_feature ON public.early_access_emails(feature);

-- Enable RLS
ALTER TABLE public.early_access_emails ENABLE ROW LEVEL SECURITY;

-- Anyone can insert their email
CREATE POLICY "Anyone can insert email"
  ON public.early_access_emails 
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated users can read (for admin access)
CREATE POLICY "Authenticated can read emails"
  ON public.early_access_emails 
  FOR SELECT 
  TO authenticated
  USING (true);