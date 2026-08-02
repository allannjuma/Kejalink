-- Kejalink Part 3 migration — run once in the Supabase SQL Editor.
-- Caretaker panel: room freshness, bookings, photo uploads. Safe to re-run.

-- 1. Rooms: deposit, amenities, "vacant soon" date, freshness timestamp
alter table rooms add column if not exists deposit integer;
alter table rooms add column if not exists amenities text[] not null default '{}';
alter table rooms add column if not exists available_date date;
alter table rooms add column if not exists last_confirmed_at timestamptz not null default now();

-- 2. Caretaker WhatsApp number (settings page)
alter table users add column if not exists whatsapp text;

-- 3. Booking requests from tenants
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  tenant_name text not null,
  phone text not null,
  viewing_time timestamptz,
  move_in_date date,
  ref_code text not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz not null default now()
);

-- 4. Storage bucket for room photos (public read, anon upload for now —
--    tighten these policies when auth/RLS hardening lands).
insert into storage.buckets (id, name, public)
values ('room-photos', 'room-photos', true)
on conflict (id) do nothing;

drop policy if exists "public read room photos" on storage.objects;
create policy "public read room photos" on storage.objects
  for select using (bucket_id = 'room-photos');

drop policy if exists "anon upload room photos" on storage.objects;
create policy "anon upload room photos" on storage.objects
  for insert with check (bucket_id = 'room-photos');
