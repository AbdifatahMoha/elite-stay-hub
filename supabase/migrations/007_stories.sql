-- EliteStay — Instagram-style hotel stories (public homepage + staff admin)

CREATE TABLE IF NOT EXISTS public.stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_title text,
  author_photo text,
  title text,
  caption text,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
  media_url text NOT NULL,
  thumbnail_url text,
  duration_sec int NOT NULL DEFAULT 15 CHECK (duration_sec BETWEEN 1 AND 30),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stories_active_created_idx ON public.stories (is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS stories_author_idx ON public.stories (author_id, created_at DESC);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active stories" ON public.stories;
CREATE POLICY "Public read active stories" ON public.stories
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Staff read all stories" ON public.stories;
CREATE POLICY "Staff read all stories" ON public.stories
  FOR SELECT USING (public.is_hotel_staff());

DROP POLICY IF EXISTS "Staff insert stories" ON public.stories;
CREATE POLICY "Staff insert stories" ON public.stories
  FOR INSERT WITH CHECK (public.is_hotel_staff() AND author_id = auth.uid());

DROP POLICY IF EXISTS "Staff update stories" ON public.stories;
CREATE POLICY "Staff update stories" ON public.stories
  FOR UPDATE USING (public.is_hotel_staff());

DROP POLICY IF EXISTS "Staff delete stories" ON public.stories;
CREATE POLICY "Staff delete stories" ON public.stories
  FOR DELETE USING (public.is_hotel_staff());

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hotel-stories',
  'hotel-stories',
  true,
  52428800,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read hotel stories" ON storage.objects;
CREATE POLICY "Public read hotel stories" ON storage.objects
  FOR SELECT USING (bucket_id = 'hotel-stories');

DROP POLICY IF EXISTS "Staff upload hotel stories" ON storage.objects;
CREATE POLICY "Staff upload hotel stories" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'hotel-stories' AND public.is_hotel_staff());

DROP POLICY IF EXISTS "Staff update hotel stories" ON storage.objects;
CREATE POLICY "Staff update hotel stories" ON storage.objects
  FOR UPDATE USING (bucket_id = 'hotel-stories' AND public.is_hotel_staff());

DROP POLICY IF EXISTS "Staff delete hotel stories" ON storage.objects;
CREATE POLICY "Staff delete hotel stories" ON storage.objects
  FOR DELETE USING (bucket_id = 'hotel-stories' AND public.is_hotel_staff());
