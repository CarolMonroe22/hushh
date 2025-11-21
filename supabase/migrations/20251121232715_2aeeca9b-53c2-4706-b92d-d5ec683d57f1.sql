-- Create public storage bucket for example audios
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'asmr-examples', 
  'asmr-examples', 
  true,
  52428800,
  ARRAY['audio/mpeg', 'audio/mp3']
);

-- RLS Policy: Anyone can read examples
CREATE POLICY "Anyone can read example audios"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'asmr-examples');

-- RLS Policy: Only service role can manage (edge functions)
CREATE POLICY "Service role can manage example audios"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'asmr-examples')
WITH CHECK (bucket_id = 'asmr-examples');