-- Remove read access to votes table to protect user privacy data (IP addresses and user agents)
-- Users can still insert votes, but no one can read them from the frontend
DROP POLICY IF EXISTS "Only authenticated can read votes" ON public.votes;