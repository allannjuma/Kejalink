-- Kejalink Part 7 migration — run once in the Supabase SQL Editor.
-- The bookings table got RLS enabled at some point (not via these migration
-- files), which silently hid all rows from the caretaker dashboard and
-- blocked confirm/cancel updates. Schema stance: RLS stays OFF until the
-- auth + RLS hardening pass lands. Booking writes go through /api/bookings
-- with the service-role key, which bypasses RLS either way.

alter table bookings disable row level security;
