-- Kejalink schema — full reference for a FRESH Supabase project.
-- If you already have Part 1 tables, run align.sql instead.
-- RLS is intentionally left OFF for now (early days, no public traffic yet).
-- Auth + RLS policies come in a later part.

create table if not exists buildings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  area text not null,
  town text not null,
  created_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  role text not null check (role in ('super_admin', 'building_admin', 'tenant')),
  verified boolean not null default false,
  building_id uuid references buildings(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references buildings(id) on delete cascade,
  name text not null,
  type text,
  rent integer not null,
  description text,
  photos text[] not null default '{}',
  state text not null default 'pending_approval'
    check (state in ('pending_approval', 'live', 'hidden', 'taken')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  reason text not null check (reason in ('already_taken', 'fake', 'wrong_price', 'other')),
  message text,
  state text not null default 'open' check (state in ('open', 'resolved')),
  created_at timestamptz not null default now()
);

-- Auto-rule: 3 open "already taken" reports on one room -> auto-hide the room.
create or replace function auto_hide_reported_room()
returns trigger
language plpgsql
security definer
as $$
declare
  taken_count integer;
begin
  if new.reason = 'already_taken' then
    select count(*) into taken_count
    from reports
    where room_id = new.room_id
      and reason = 'already_taken'
      and state = 'open';

    if taken_count >= 3 then
      update rooms
      set state = 'hidden', updated_at = now()
      where id = new.room_id;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_auto_hide_reported_room on reports;
create trigger trg_auto_hide_reported_room
  after insert on reports
  for each row execute function auto_hide_reported_room();
