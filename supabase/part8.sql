-- Kejalink Part 8 migration — run once in the Supabase SQL Editor.
-- Booking ref codes are now generated as `BK-` + 6 random alphanumeric chars
-- and inserted with retry-on-collision in /api/bookings. This backs that
-- contract with a real unique constraint, plus an index for the dashboard's
-- per-room booking lookups.

do $$
begin
  alter table bookings add constraint bookings_ref_code_key unique (ref_code);
exception when duplicate_object then null;
end $$;

create index if not exists bookings_room_id_idx on bookings (room_id);
