# EliteStay migrations

Run in order on a **fresh** Supabase project:

1. `001_elitestay_schema.sql` — core tables, RLS, auth trigger
2. `002_auth_redesign.sql` — expanded roles and profile columns
3. `003_additional_tables.sql` — `staff_users`, `contact_messages`, `activity_logs`
4. `004_storage_hotel_assets.sql` — public `hotel-assets` storage bucket
5. `005_room_image_urls.sql` — multi-photo `image_urls` on rooms and room types
6. `006_cascade_room_type_delete.sql` — deleting a room type removes its rooms
7. `007_stories.sql` — homepage stories table + `hotel-stories` storage bucket

## Option A — Supabase SQL Editor

Open each file, paste its contents into **SQL Editor → New query**, and run in order.

## Option B — CLI script (requires database URI)

Add `SUPABASE_DB_URL` to `.env` (Dashboard → Database → Connection string URI), then:

```bash
npm run db:migrate
```

## Verify

After migrations and valid `.env` keys:

```bash
npm run db:verify
```

## First admin

See `supabase/seed/001_first_admin.sql`.
