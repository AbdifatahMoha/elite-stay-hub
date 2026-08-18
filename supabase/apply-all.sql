-- EliteStay — run this entire file once in Supabase SQL Editor
-- Dashboard → SQL → New query → paste → Run

-- ========== 001_elitestay_schema.sql ==========

create type public.staff_role as enum ('ADMIN', 'STAFF');
create type public.staff_status as enum ('ACTIVE', 'DISABLED');
create type public.room_status as enum ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE');
create type public.booking_status as enum ('PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED');
create type public.payment_method as enum ('Cash', 'Invoice', 'Stripe', 'Mobile Money');
create type public.payment_status as enum ('PAID', 'PENDING', 'PARTIAL', 'REFUNDED', 'UNPAID');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text not null,
  phone text,
  role public.staff_role not null default 'STAFF',
  status public.staff_status not null default 'ACTIVE',
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role, status)
  values (
    new.id, new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data ->> 'role')::public.staff_role, 'STAFF'),
    'ACTIVE'
  ) on conflict (id) do nothing;
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

create table public.hotel_settings (
  id uuid primary key default gen_random_uuid(),
  hotel_name text not null default 'EliteStay Hotel',
  logo_url text,
  address text default 'Waddada Maka Al Mukarama, Mogadishu',
  phone text default '+252 61 000 0000',
  email text default 'hello@elitestay.com',
  currency text not null default 'USD',
  tax_rate numeric(5, 2) not null default 0,
  check_in_time time not null default '14:00',
  check_out_time time not null default '11:00',
  languages jsonb not null default '["en", "so"]'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.hotel_settings (hotel_name) values ('EliteStay Hotel');

create table public.room_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_so text not null default '',
  description text not null default '',
  price_per_night numeric(10, 2) not null,
  capacity int not null default 2,
  amenities jsonb not null default '[]'::jsonb,
  image_url text,
  image_urls text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  room_number text not null unique,
  room_type_id uuid not null references public.room_types (id) on delete cascade,
  status public.room_status not null default 'AVAILABLE',
  image_url text,
  image_urls text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.guests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null default '',
  address text not null default '',
  nationality text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index guests_email_idx on public.guests (lower(email));

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  guest_id uuid not null references public.guests (id) on delete restrict,
  room_id uuid not null references public.rooms (id) on delete restrict,
  check_in date not null,
  check_out date not null,
  number_of_guests int not null default 1,
  total_amount numeric(10, 2) not null,
  status public.booking_status not null default 'PENDING',
  special_requests text,
  created_at timestamptz not null default now(),
  constraint bookings_dates_check check (check_out > check_in)
);

create index bookings_status_idx on public.bookings (status);
create index bookings_check_in_idx on public.bookings (check_in);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete restrict,
  amount numeric(10, 2) not null,
  method public.payment_method not null default 'Cash',
  status public.payment_status not null default 'PENDING',
  reference_number text,
  payment_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

create or replace function public.is_authenticated_staff() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'ACTIVE' and p.role in ('ADMIN', 'STAFF'));
$$;

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'ACTIVE' and p.role = 'ADMIN');
$$;

alter table public.profiles enable row level security;
alter table public.hotel_settings enable row level security;
alter table public.room_types enable row level security;
alter table public.rooms enable row level security;
alter table public.guests enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;

create policy "Staff read own profile" on public.profiles for select using (auth.uid() = id or public.is_admin());
create policy "Admin manage profiles" on public.profiles for all using (public.is_admin());
create policy "Public read settings" on public.hotel_settings for select using (true);
create policy "Staff update settings" on public.hotel_settings for update using (public.is_authenticated_staff());
create policy "Public read room types" on public.room_types for select using (true);
create policy "Staff manage room types" on public.room_types for all using (public.is_authenticated_staff());
create policy "Public read rooms" on public.rooms for select using (true);
create policy "Staff manage rooms" on public.rooms for all using (public.is_authenticated_staff());
create policy "Public insert guests" on public.guests for insert with check (true);
create policy "Public read own guest by id" on public.guests for select using (true);
create policy "Staff manage guests" on public.guests for all using (public.is_authenticated_staff());
create policy "Public create bookings" on public.bookings for insert with check (status = 'PENDING');
create policy "Public read bookings" on public.bookings for select using (true);
create policy "Staff manage bookings" on public.bookings for all using (public.is_authenticated_staff());
create policy "Staff manage payments" on public.payments for all using (public.is_authenticated_staff());
create policy "Staff read payments" on public.payments for select using (public.is_authenticated_staff());

-- ========== 002_auth_redesign.sql ==========

DO $$ BEGIN CREATE TYPE public.user_role AS ENUM ('ADMIN', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING', 'STAFF', 'PENDING_STAFF', 'GUEST');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public.profile_status AS ENUM ('ACTIVE', 'DISABLED', 'PENDING');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS position text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approved_by uuid references public.profiles (id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approved_at timestamptz;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role' AND udt_name = 'staff_role') THEN
    ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;
    ALTER TABLE public.profiles ALTER COLUMN role TYPE public.user_role USING (CASE role::text WHEN 'ADMIN' THEN 'ADMIN'::public.user_role ELSE 'STAFF'::public.user_role END);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'status' AND udt_name = 'staff_status') THEN
    ALTER TABLE public.profiles ALTER COLUMN status DROP DEFAULT;
    ALTER TABLE public.profiles ALTER COLUMN status TYPE public.profile_status USING (CASE status::text WHEN 'DISABLED' THEN 'DISABLED'::public.profile_status ELSE 'ACTIVE'::public.profile_status END);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.status = 'ACTIVE' AND p.role = 'ADMIN');
$$;

CREATE OR REPLACE FUNCTION public.is_hotel_staff() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.status = 'ACTIVE' AND p.role IN ('ADMIN', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING', 'STAFF'));
$$;

CREATE OR REPLACE FUNCTION public.is_authenticated_staff() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_hotel_staff();
$$;

CREATE OR REPLACE FUNCTION public.is_guest() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.status = 'ACTIVE' AND p.role = 'GUEST');
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_role public.user_role; v_status public.profile_status;
BEGIN
  v_role := coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'GUEST'::public.user_role);
  v_status := CASE WHEN v_role = 'PENDING_STAFF' THEN 'PENDING'::public.profile_status WHEN (new.raw_user_meta_data ->> 'status') = 'DISABLED' THEN 'DISABLED'::public.profile_status ELSE 'ACTIVE'::public.profile_status END;
  INSERT INTO public.profiles (id, email, full_name, phone, role, status, position)
  VALUES (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)), nullif(new.raw_user_meta_data ->> 'phone', ''), v_role, v_status, nullif(new.raw_user_meta_data ->> 'position', ''))
  ON CONFLICT (id) DO UPDATE SET full_name = excluded.full_name, phone = coalesce(excluded.phone, profiles.phone), position = coalesce(excluded.position, profiles.position);
  RETURN new;
END; $$;

DROP POLICY IF EXISTS "Staff read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin manage profiles" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Admin manage all profiles" ON public.profiles FOR ALL USING (public.is_admin());
CREATE POLICY "Guest read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

-- ========== 003_additional_tables.sql ==========

CREATE TABLE IF NOT EXISTS public.staff_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE REFERENCES public.profiles (id) ON DELETE CASCADE,
  employee_code text,
  department text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.sync_staff_user_from_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.role IN ('ADMIN', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING', 'STAFF') AND NEW.status = 'ACTIVE' THEN
    INSERT INTO public.staff_users (profile_id, department) VALUES (NEW.id, COALESCE(NEW.position, 'General'))
    ON CONFLICT (profile_id) DO UPDATE SET department = COALESCE(EXCLUDED.department, staff_users.department), updated_at = now();
  ELSIF NEW.role = 'PENDING_STAFF' OR NEW.status IN ('DISABLED', 'PENDING') THEN
    DELETE FROM public.staff_users WHERE profile_id = NEW.id;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS sync_staff_user_on_profile ON public.profiles;
CREATE TRIGGER sync_staff_user_on_profile AFTER INSERT OR UPDATE OF role, status, position ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.sync_staff_user_from_profile();

DO $$ BEGIN CREATE TYPE public.contact_message_status AS ENUM ('NEW', 'READ', 'REPLIED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text NOT NULL,
  status public.contact_message_status NOT NULL DEFAULT 'NEW',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read staff_users" ON public.staff_users FOR SELECT USING (public.is_hotel_staff());
CREATE POLICY "Admin manage staff_users" ON public.staff_users FOR ALL USING (public.is_admin());
CREATE POLICY "Public insert contact messages" ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff read contact messages" ON public.contact_messages FOR SELECT USING (public.is_hotel_staff());
CREATE POLICY "Staff update contact messages" ON public.contact_messages FOR UPDATE USING (public.is_hotel_staff());
CREATE POLICY "Staff insert activity logs" ON public.activity_logs FOR INSERT WITH CHECK (public.is_hotel_staff() AND (actor_id IS NULL OR actor_id = auth.uid()));
CREATE POLICY "Staff read activity logs" ON public.activity_logs FOR SELECT USING (public.is_hotel_staff());

-- ========== 007_stories.sql ==========

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
CREATE POLICY "Public read active stories" ON public.stories FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Staff read all stories" ON public.stories;
CREATE POLICY "Staff read all stories" ON public.stories FOR SELECT USING (public.is_hotel_staff());
DROP POLICY IF EXISTS "Staff insert stories" ON public.stories;
CREATE POLICY "Staff insert stories" ON public.stories FOR INSERT WITH CHECK (public.is_hotel_staff() AND author_id = auth.uid());
DROP POLICY IF EXISTS "Staff update stories" ON public.stories;
CREATE POLICY "Staff update stories" ON public.stories FOR UPDATE USING (public.is_hotel_staff());
DROP POLICY IF EXISTS "Staff delete stories" ON public.stories;
CREATE POLICY "Staff delete stories" ON public.stories FOR DELETE USING (public.is_hotel_staff());

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hotel-stories',
  'hotel-stories',
  true,
  52428800,
  ARRAY['image/jpeg','image/png','image/webp','image/gif','image/avif','video/mp4','video/webm','video/quicktime']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read hotel stories" ON storage.objects;
CREATE POLICY "Public read hotel stories" ON storage.objects FOR SELECT USING (bucket_id = 'hotel-stories');
DROP POLICY IF EXISTS "Staff upload hotel stories" ON storage.objects;
CREATE POLICY "Staff upload hotel stories" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'hotel-stories' AND public.is_hotel_staff());
DROP POLICY IF EXISTS "Staff update hotel stories" ON storage.objects;
CREATE POLICY "Staff update hotel stories" ON storage.objects FOR UPDATE USING (bucket_id = 'hotel-stories' AND public.is_hotel_staff());
DROP POLICY IF EXISTS "Staff delete hotel stories" ON storage.objects;
CREATE POLICY "Staff delete hotel stories" ON storage.objects FOR DELETE USING (bucket_id = 'hotel-stories' AND public.is_hotel_staff());
