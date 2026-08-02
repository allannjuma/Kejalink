-- Kejalink alignment migration — run this once in the Supabase SQL Editor.
-- Brings your existing Part 1 tables in line with what the /admin panel needs.
-- Safe to run more than once.

-- 1. reports table (missing)
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  reason text not null check (reason in ('already_taken', 'fake', 'wrong_price', 'other')),
  message text,
  state text not null default 'open' check (state in ('open', 'resolved')),
  created_at timestamptz not null default now()
);

-- 2. users: last-activity timestamp for the overview page
alter table users add column if not exists updated_at timestamptz not null default now();

-- 3. rooms: photo URLs + updated timestamp for the approvals page
alter table rooms add column if not exists photos text[] not null default '{}';
alter table rooms add column if not exists updated_at timestamptz not null default now();

-- 4. Auto-rule: 3 open "already taken" reports on one room -> auto-hide it.
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
