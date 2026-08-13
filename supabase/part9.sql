-- Kejalink Part 9 migration — tenant reviews & ratings for rooms.
-- Run once in the Supabase SQL Editor. Idempotent: safe to re-run.
-- RLS stays OFF (project-wide stance); writes go through /api/reviews with
-- the service-role key, gated by the tenant phone session cookie.

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  phone text not null,
  tenant_name text not null,
  rating integer not null check (rating between 1 and 5),
  comment text check (char_length(comment) <= 500),
  created_at timestamptz not null default now()
);

-- One review per phone per room. This unique index is the upsert target
-- (onConflict: 'room_id,phone') in /api/reviews.
create unique index if not exists reviews_room_phone_unique on reviews (room_id, phone);

create index if not exists reviews_room_created_idx on reviews (room_id, created_at desc);
