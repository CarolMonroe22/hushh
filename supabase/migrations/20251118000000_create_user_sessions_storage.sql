-- Create storage bucket for user sessions
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('user-sessions', 'user-sessions', true, 104857600, ARRAY['audio/mpeg', 'audio/mp3'])
ON CONFLICT (id) DO NOTHING;

-- Create policies for public read access
CREATE POLICY "Public read access for user sessions"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-sessions');

-- Create policy for authenticated users to insert their own files
CREATE POLICY "Users can upload own session files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-sessions'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Create policy for service role to insert files
CREATE POLICY "Service role can insert user session files"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'user-sessions');

-- Allow users to delete their own session files
CREATE POLICY "Users can delete own session files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-sessions'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow service role to delete files
CREATE POLICY "Service role can delete user session files"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'user-sessions');
