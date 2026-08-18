-- EliteStay — first ADMIN account (run after migrations 001, 002, 003)
--
-- Step 1: Supabase Dashboard → Authentication → Users → Add user
--         Email: admin@elitestay.com (or your chosen admin email)
--         Password: choose a strong password
--         Auto Confirm User: ON (recommended for first admin)
--
-- Step 2: Run this SQL in Supabase SQL Editor (replace email if needed)

DO $$
DECLARE
  v_admin_email text := 'admin@elitestay.com';
  v_admin_name text := 'System Administrator';
BEGIN
  UPDATE public.profiles
  SET
    role = 'ADMIN',
    status = 'ACTIVE',
    full_name = v_admin_name,
    position = 'General Manager',
    approved_at = now()
  WHERE lower(email) = lower(v_admin_email);

  IF NOT FOUND THEN
    RAISE NOTICE 'No profile found for %. Create the auth user first, then re-run this script.', v_admin_email;
  ELSE
    INSERT INTO public.staff_users (profile_id, employee_code, department, notes)
    SELECT id, 'ADM-001', 'Management', 'Initial system administrator'
    FROM public.profiles
    WHERE lower(email) = lower(v_admin_email)
    ON CONFLICT (profile_id) DO UPDATE SET
      employee_code = EXCLUDED.employee_code,
      department = EXCLUDED.department,
      updated_at = now();

    INSERT INTO public.activity_logs (actor_id, action, entity_type, metadata)
    SELECT id, 'admin.bootstrap', 'profiles', jsonb_build_object('email', v_admin_email)
    FROM public.profiles
    WHERE lower(email) = lower(v_admin_email);

    RAISE NOTICE 'Admin promoted: %', v_admin_email;
  END IF;
END $$;
