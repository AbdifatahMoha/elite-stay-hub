-- EliteStay Hotel Management System — Supabase schema + RLS
-- Run in Supabase SQL Editor or via Supabase CLI

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.staff_role as enum ('ADMIN', 'STAFF');
create type public.staff_status as enum ('ACTIVE', 'DISABLED');
create type public.room_status as enum ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE');
create type public.booking_status as enum ('PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED');
create type public.payment_method as enum ('Cash', 'Invoice', 'Stripe', 'Mobile Money');
create type public.payment_status as enum ('PAID', 'PENDING', 'PARTIAL', 'REFUNDED', 'UNPAID');

-- ---------------------------------------------------------------------------
-- Profiles (staff) — linked to auth.users
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text not null,
  phone text,
  role public.staff_role not null default 'STAFF',
  status public.staff_status not null default 'ACTIVE',
  created_at timestamptz not null default now()
);

-- Auto-create profile row when auth user is created (service role / trigger)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data ->> 'role')::public.staff_role, 'STAFF'),
    'ACTIVE'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Hotel settings (single-row config)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Room types
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Rooms
-- ---------------------------------------------------------------------------
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  room_number text not null unique,
  room_type_id uuid not null references public.room_types (id) on delete cascade,
  status public.room_status not null default 'AVAILABLE',
  image_url text,
  image_urls text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Guests
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Bookings
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Payments
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Auth helpers
-- ---------------------------------------------------------------------------
create or replace function public.is_authenticated_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.status = 'ACTIVE'
      and p.role in ('ADMIN', 'STAFF')
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.status = 'ACTIVE'
      and p.role = 'ADMIN'
  );
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.hotel_settings enable row level security;
alter table public.room_types enable row level security;
alter table public.rooms enable row level security;
alter table public.guests enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;

-- Profiles: staff read own; admin manage all
create policy "Staff read own profile" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

create policy "Admin manage profiles" on public.profiles
  for all using (public.is_admin());

-- Hotel settings: public read; staff write
create policy "Public read settings" on public.hotel_settings
  for select using (true);

create policy "Staff update settings" on public.hotel_settings
  for update using (public.is_authenticated_staff());

-- Room types: public read; staff manage
create policy "Public read room types" on public.room_types
  for select using (true);

create policy "Staff manage room types" on public.room_types
  for all using (public.is_authenticated_staff());

-- Rooms: public read; staff manage
create policy "Public read rooms" on public.rooms
  for select using (true);

create policy "Staff manage rooms" on public.rooms
  for all using (public.is_authenticated_staff());

-- Guests: public insert (booking); staff full access
create policy "Public insert guests" on public.guests
  for insert with check (true);

create policy "Public read own guest by id" on public.guests
  for select using (true);

create policy "Staff manage guests" on public.guests
  for all using (public.is_authenticated_staff());

-- Bookings: public insert pending; public read by reference handled in app; staff manage
create policy "Public create bookings" on public.bookings
  for insert with check (status = 'PENDING');

create policy "Public read bookings" on public.bookings
  for select using (true);

create policy "Staff manage bookings" on public.bookings
  for all using (public.is_authenticated_staff());

-- Payments: staff only
create policy "Staff manage payments" on public.payments
  for all using (public.is_authenticated_staff());

create policy "Staff read payments" on public.payments
  for select using (public.is_authenticated_staff());

-- ---------------------------------------------------------------------------
-- Seed room types (optional — run once)
-- ---------------------------------------------------------------------------
-- insert into public.room_types (name, name_so, description, price_per_night, capacity, amenities) values
-- ('Standard Room', 'Qol Caadi Ah', 'Comfortable room with modern amenities.', 89, 2, '["WiFi","Air Conditioning","TV"]'),
-- ('Deluxe Room', 'Qol Deluxe Ah', 'Spacious deluxe room with premium amenities.', 149, 2, '["WiFi","Smart TV","Breakfast"]'),
-- ('Executive Suite', 'Qol Sare Executive', 'Signature suite with living area.', 249, 3, '["WiFi","Mini Bar","Sea View"]'),
-- ('Family Room', 'Qol Qoyska', 'Ideal for families.', 179, 4, '["WiFi","Breakfast","Parking"]');
