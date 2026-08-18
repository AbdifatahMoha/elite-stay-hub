-- EliteStay — public storage bucket for room/property images

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hotel-assets',
  'hotel-assets',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read hotel assets" ON storage.objects;
CREATE POLICY "Public read hotel assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'hotel-assets');

DROP POLICY IF EXISTS "Staff upload hotel assets" ON storage.objects;
CREATE POLICY "Staff upload hotel assets" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'hotel-assets' AND public.is_hotel_staff());

DROP POLICY IF EXISTS "Staff update hotel assets" ON storage.objects;
CREATE POLICY "Staff update hotel assets" ON storage.objects
  FOR UPDATE USING (bucket_id = 'hotel-assets' AND public.is_hotel_staff());

DROP POLICY IF EXISTS "Staff delete hotel assets" ON storage.objects;
CREATE POLICY "Staff delete hotel assets" ON storage.objects
  FOR DELETE USING (bucket_id = 'hotel-assets' AND public.is_hotel_staff());
