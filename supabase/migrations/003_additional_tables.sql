-- EliteStay — additional tables (run after 001 + 002)

-- ---------------------------------------------------------------------------
-- staff_users — staff-specific metadata linked to profiles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.staff_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE REFERENCES public.profiles (id) ON DELETE CASCADE,
  employee_code text,
  department text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS staff_users_profile_id_idx ON public.staff_users (profile_id);

-- Keep staff_users in sync when hotel staff profiles are created or approved
CREATE OR REPLACE FUNCTION public.sync_staff_user_from_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IN ('ADMIN', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING', 'STAFF')
     AND NEW.status = 'ACTIVE' THEN
    INSERT INTO public.staff_users (profile_id, department)
    VALUES (NEW.id, COALESCE(NEW.position, 'General'))
    ON CONFLICT (profile_id) DO UPDATE SET
      department = COALESCE(EXCLUDED.department, staff_users.department),
      updated_at = now();
  ELSIF NEW.role = 'PENDING_STAFF' OR NEW.status IN ('DISABLED', 'PENDING') THEN
    DELETE FROM public.staff_users WHERE profile_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_staff_user_on_profile ON public.profiles;
CREATE TRIGGER sync_staff_user_on_profile
  AFTER INSERT OR UPDATE OF role, status, position ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_staff_user_from_profile();

-- Backfill existing active hotel staff
INSERT INTO public.staff_users (profile_id, department)
SELECT p.id, COALESCE(p.position, 'General')
FROM public.profiles p
WHERE p.role IN ('ADMIN', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING', 'STAFF')
  AND p.status = 'ACTIVE'
ON CONFLICT (profile_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- contact_messages — public contact form submissions
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.contact_message_status AS ENUM ('NEW', 'READ', 'REPLIED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text NOT NULL,
  status public.contact_message_status NOT NULL DEFAULT 'NEW',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contact_messages_status_idx ON public.contact_messages (status);
CREATE INDEX IF NOT EXISTS contact_messages_created_at_idx ON public.contact_messages (created_at DESC);

-- ---------------------------------------------------------------------------
-- activity_logs — audit trail for admin actions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS activity_logs_actor_id_idx ON public.activity_logs (actor_id);
CREATE INDEX IF NOT EXISTS activity_logs_entity_idx ON public.activity_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS activity_logs_created_at_idx ON public.activity_logs (created_at DESC);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff read staff_users" ON public.staff_users;
CREATE POLICY "Staff read staff_users" ON public.staff_users
  FOR SELECT USING (public.is_hotel_staff());

DROP POLICY IF EXISTS "Admin manage staff_users" ON public.staff_users;
CREATE POLICY "Admin manage staff_users" ON public.staff_users
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Public insert contact messages" ON public.contact_messages;
CREATE POLICY "Public insert contact messages" ON public.contact_messages
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Staff read contact messages" ON public.contact_messages;
CREATE POLICY "Staff read contact messages" ON public.contact_messages
  FOR SELECT USING (public.is_hotel_staff());

DROP POLICY IF EXISTS "Staff update contact messages" ON public.contact_messages;
CREATE POLICY "Staff update contact messages" ON public.contact_messages
  FOR UPDATE USING (public.is_hotel_staff());

DROP POLICY IF EXISTS "Staff insert activity logs" ON public.activity_logs;
CREATE POLICY "Staff insert activity logs" ON public.activity_logs
  FOR INSERT WITH CHECK (public.is_hotel_staff() AND (actor_id IS NULL OR actor_id = auth.uid()));

DROP POLICY IF EXISTS "Staff read activity logs" ON public.activity_logs;
CREATE POLICY "Staff read activity logs" ON public.activity_logs
  FOR SELECT USING (public.is_hotel_staff());
