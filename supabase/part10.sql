-- Kejalink Part 10 migration — in-app notifications for caretakers.
-- Run once in the Supabase SQL Editor. Idempotent: safe to re-run.
-- Notification rows are created by DB triggers (not API routes) so every
-- booking/room write path notifies the caretaker. Trigger functions are
-- security definer so they work regardless of the caller's role; RLS stays
-- OFF per the project stance, and /api/notifications reads via the
-- service-role key.

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_read_created_idx
  on notifications (user_id, read, created_at desc);

-- a) New booking → notify the caretaker of that room's building.
create or replace function notify_caretaker_new_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid;
  v_room_name text;
begin
  select b.admin_user_id, r.name
    into v_admin_id, v_room_name
  from rooms r
  join buildings b on b.id = r.building_id
  where r.id = NEW.room_id;

  if v_admin_id is null then
    return NEW;
  end if;

  insert into notifications (user_id, type, title, body, link)
  values (
    v_admin_id,
    'booking',
    'New booking ' || NEW.ref_code,
    NEW.tenant_name || ' booked ' || coalesce(v_room_name, 'a room') || '.',
    '/dashboard/bookings'
  );

  return NEW;
end;
$$;

drop trigger if exists bookings_notify_caretaker_insert on bookings;
create trigger bookings_notify_caretaker_insert
  after insert on bookings
  for each row execute function notify_caretaker_new_booking();

-- b) Booking confirmed/cancelled → notify the caretaker.
create or replace function notify_caretaker_booking_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid;
  v_room_name text;
begin
  if NEW.status = OLD.status then
    return NEW;
  end if;

  if NEW.status not in ('confirmed', 'cancelled') then
    return NEW;
  end if;

  select b.admin_user_id, r.name
    into v_admin_id, v_room_name
  from rooms r
  join buildings b on b.id = r.building_id
  where r.id = NEW.room_id;

  if v_admin_id is null then
    return NEW;
  end if;

  insert into notifications (user_id, type, title, body, link)
  values (
    v_admin_id,
    'booking_status',
    'Booking ' || NEW.ref_code || ' ' || NEW.status,
    NEW.tenant_name || '''s booking for ' || coalesce(v_room_name, 'a room') ||
      ' was ' || NEW.status || '.',
    '/dashboard/bookings'
  );

  return NEW;
end;
$$;

drop trigger if exists bookings_notify_caretaker_status on bookings;
create trigger bookings_notify_caretaker_status
  after update of status on bookings
  for each row execute function notify_caretaker_booking_status();

-- c) Room goes live/hidden → notify the building's caretaker.
create or replace function notify_caretaker_room_state()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid;
begin
  if NEW.state = OLD.state then
    return NEW;
  end if;

  if NEW.state not in ('live', 'hidden') then
    return NEW;
  end if;

  select b.admin_user_id
    into v_admin_id
  from buildings b
  where b.id = NEW.building_id;

  if v_admin_id is null then
    return NEW;
  end if;

  insert into notifications (user_id, type, title, body, link)
  values (
    v_admin_id,
    'room_state',
    'Room ' || NEW.state,
    'Room "' || NEW.name || '" is now ' || NEW.state || '.',
    '/dashboard'
  );

  return NEW;
end;
$$;

drop trigger if exists rooms_notify_caretaker_state on rooms;
create trigger rooms_notify_caretaker_state
  after update of state on rooms
  for each row execute function notify_caretaker_room_state();
