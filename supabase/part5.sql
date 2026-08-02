-- Kejalink Part 5 migration — run once in the Supabase SQL Editor.
-- Adds admin_user_id to buildings for strict bidirectional linking.

alter table buildings add column if not exists admin_user_id uuid references auth.users(id) on delete set null;
