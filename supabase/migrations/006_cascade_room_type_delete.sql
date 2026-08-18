-- Deleting a room type removes its physical rooms.
-- Bookings/payments are cleaned up in app code before room rows are removed
-- (or blocked with a clear error if that fails).

alter table public.rooms
  drop constraint if exists rooms_room_type_id_fkey;

alter table public.rooms
  add constraint rooms_room_type_id_fkey
  foreign key (room_type_id)
  references public.room_types (id)
  on delete cascade;
