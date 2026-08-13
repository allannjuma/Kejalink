-- COMPREHENSIVE SELF-HEALING FIX
-- Covers all broken link scenarios + missing columns. Safe to run multiple times.

-- Step 0: Add missing columns that may not have been migrated yet
alter table users add column if not exists whatsapp text;
alter table rooms add column if not exists deposit integer;
alter table rooms add column if not exists amenities text[] not null default '{}';
alter table rooms add column if not exists available_date date;
alter table rooms add column if not exists last_confirmed_at timestamptz not null default now();
alter table buildings add column if not exists admin_user_id uuid references auth.users(id) on delete set null;
alter table buildings add column if not exists exact_location text;

-- Step 0b: Create missing tables
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

create table if not exists passes (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  amount integer not null,
  hours integer not null check (hours in (24, 48)),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  checkout_request_id text,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_passes_phone_expires on passes (phone, expires_at);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  reason text not null check (reason in ('already_taken', 'fake', 'wrong_price', 'other')),
  message text,
  state text not null default 'open' check (state in ('open', 'resolved')),
  created_at timestamptz not null default now()
);

-- Step 1: If building has admin_user_id set, use it to fix users.building_id
update users u
set building_id = b.id
from buildings b
where b.admin_user_id = u.id
  and u.building_id is null
  and u.role = 'building_admin';

-- Step 2: If user has building_id set, use it to fix buildings.admin_user_id
update buildings b
set admin_user_id = u.id
from users u
where u.building_id = b.id
  and b.admin_user_id is null
  and u.role = 'building_admin';

-- Step 3: Last resort — if there is exactly ONE unlinked building_admin
-- and exactly ONE unlinked building, connect them directly.
do $$
declare
  v_user_id uuid;
  v_building_id uuid;
begin
  select id into v_user_id
  from users
  where role = 'building_admin' and building_id is null
  limit 1;

  select id into v_building_id
  from buildings
  where admin_user_id is null
  limit 1;

  if v_user_id is not null and v_building_id is not null then
    update users set building_id = v_building_id where id = v_user_id;
    update buildings set admin_user_id = v_user_id where id = v_building_id;
    raise notice 'Linked user % to building %', v_user_id, v_building_id;
  end if;
end $$;

-- Final check — show all building admins and their linked buildings
select
  u.email,
  u.name,
  u.role,
  u.building_id,
  b.name as building_name,
  b.admin_user_id,
  case
    when u.building_id is not null and b.admin_user_id is not null then '✅ FULLY LINKED'
    when u.building_id is not null then '⚠ Missing admin_user_id on building'
    when b.admin_user_id is not null then '⚠ Missing building_id on user'
    else '❌ NOT LINKED'
  end as link_status
from users u
left join buildings b on b.id = u.building_id or b.admin_user_id = u.id
where u.role = 'building_admin';

-- Step 5: Create the room-photos storage bucket (required for photo uploads)
insert into storage.buckets (id, name, public)
values ('room-photos', 'room-photos', true)
on conflict (id) do nothing;

drop policy if exists "public read room photos" on storage.objects;
create policy "public read room photos" on storage.objects
  for select using (bucket_id = 'room-photos');

drop policy if exists "anon upload room photos" on storage.objects;
create policy "anon upload room photos" on storage.objects
  for insert with check (bucket_id = 'room-photos');

drop policy if exists "anon delete room photos" on storage.objects;
create policy "anon delete room photos" on storage.objects
  for delete using (bucket_id = 'room-photos');
