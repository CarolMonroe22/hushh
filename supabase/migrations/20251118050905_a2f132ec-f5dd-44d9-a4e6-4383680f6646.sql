-- Create user-sessions storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-sessions', 'user-sessions', true);

-- Policy: Users can upload to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-sessions' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can read their own files
CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-sessions' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Public can read files (for audio playback)
CREATE POLICY "Public can read files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-sessions');