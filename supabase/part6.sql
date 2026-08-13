-- Kejalink Part 6 migration — add map coordinates to buildings.
-- Run once in the Supabase SQL Editor.

alter table buildings add column if not exists lat double precision;
alter table buildings add column if not exists lng double precision;
