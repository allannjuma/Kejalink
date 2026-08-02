-- Kejalink Part 4 migration — run once in the Supabase SQL Editor.
-- Public tenant side + M-Pesa unlock passes. Safe to re-run.

-- 1. Unlock passes: one paid pass unlocks ALL rooms for 24/48 hours.
--    Tenants are anonymous — a pass is tied to the M-Pesa phone number.
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

-- 2. Exact location / pin, shown only after unlock.
alter table buildings add column if not exists exact_location text;
