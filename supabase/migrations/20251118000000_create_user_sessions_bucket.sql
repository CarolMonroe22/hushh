-- Create storage bucket for user sessions (private, user-owned audio files)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('user-sessions', 'user-sessions', false, 52428800, ARRAY['audio/mpeg']);

-- RLS Policies for user-sessions bucket
-- Users can only read their own session files
CREATE POLICY "Users can read own session files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-sessions'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can insert their own session files
CREATE POLICY "Users can insert own session files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-sessions'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own session files
CREATE POLICY "Users can update own session files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-sessions'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own session files
CREATE POLICY "Users can delete own session files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-sessions'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Service role has full access (for edge functions to save files)
CREATE POLICY "Service role can manage all user session files"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'user-sessions')
WITH CHECK (bucket_id = 'user-sessions');
