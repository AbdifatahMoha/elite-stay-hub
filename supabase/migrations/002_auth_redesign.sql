-- EliteStay Auth Redesign — run after 001_elitestay_schema.sql

-- ---------------------------------------------------------------------------
-- Expanded roles & profile status
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM (
    'ADMIN', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING', 'STAFF', 'PENDING_STAFF', 'GUEST'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.profile_status AS ENUM ('ACTIVE', 'DISABLED', 'PENDING');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS position text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approved_by uuid references public.profiles (id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approved_at timestamptz;

-- Migrate role column from staff_role → user_role (if still staff_role)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles'
      AND column_name = 'role' AND udt_name = 'staff_role'
  ) THEN
    ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;
    ALTER TABLE public.profiles
      ALTER COLUMN role TYPE public.user_role
      USING (
        CASE role::text
          WHEN 'ADMIN' THEN 'ADMIN'::public.user_role
          ELSE 'STAFF'::public.user_role
        END
      );
  END IF;
END $$;

-- Migrate status column from staff_status → profile_status
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles'
      AND column_name = 'status' AND udt_name = 'staff_status'
  ) THEN
    ALTER TABLE public.profiles ALTER COLUMN status DROP DEFAULT;
    ALTER TABLE public.profiles
      ALTER COLUMN status TYPE public.profile_status
      USING (
        CASE status::text
          WHEN 'DISABLED' THEN 'DISABLED'::public.profile_status
          ELSE 'ACTIVE'::public.profile_status
        END
      );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Auth helpers (replace old staff-only helpers)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.status = 'ACTIVE' AND p.role = 'ADMIN'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_hotel_staff()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.status = 'ACTIVE'
      AND p.role IN ('ADMIN', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING', 'STAFF')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_authenticated_staff()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_hotel_staff();
$$;

CREATE OR REPLACE FUNCTION public.is_guest()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.status = 'ACTIVE' AND p.role = 'GUEST'
  );
$$;

-- ---------------------------------------------------------------------------
-- Profile trigger for new auth users
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_role public.user_role;
  v_status public.profile_status;
BEGIN
  v_role := coalesce(
    (new.raw_user_meta_data ->> 'role')::public.user_role,
    'GUEST'::public.user_role
  );
  v_status := CASE
    WHEN v_role = 'PENDING_STAFF' THEN 'PENDING'::public.profile_status
    WHEN (new.raw_user_meta_data ->> 'status') = 'DISABLED' THEN 'DISABLED'::public.profile_status
    ELSE 'ACTIVE'::public.profile_status
  END;

  INSERT INTO public.profiles (id, email, full_name, phone, role, status, position)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    v_role,
    v_status,
    nullif(new.raw_user_meta_data ->> 'position', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = excluded.full_name,
    phone = coalesce(excluded.phone, profiles.phone),
    position = coalesce(excluded.position, profiles.position);

  RETURN new;
END;
$$;

-- ---------------------------------------------------------------------------
-- RLS updates
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Staff read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin manage profiles" ON public.profiles;

CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admin manage all profiles" ON public.profiles
  FOR ALL USING (public.is_admin());

CREATE POLICY "Guest read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
