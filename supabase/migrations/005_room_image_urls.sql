-- Multiple photos per room type and physical room.
-- image_url remains the cover (first gallery image) for backward compatibility.

alter table public.room_types
  add column if not exists image_urls text[] not null default '{}';

alter table public.rooms
  add column if not exists image_urls text[] not null default '{}';

-- Seed galleries from existing single cover images.
update public.room_types
set image_urls = array[image_url]
where image_url is not null
  and btrim(image_url) <> ''
  and cardinality(image_urls) = 0;

update public.rooms
set image_urls = array[image_url]
where image_url is not null
  and btrim(image_url) <> ''
  and cardinality(image_urls) = 0;
