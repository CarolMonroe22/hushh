-- Fix RLS policy for votes table to allow anonymous users to insert
DROP POLICY IF EXISTS "Anyone can insert votes" ON public.votes;

-- Create unrestricted insert policy (applies to all roles including anon)
CREATE POLICY "Enable insert for all users"
  ON public.votes
  FOR INSERT
  WITH CHECK (true);