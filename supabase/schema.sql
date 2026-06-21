-- Run this in the Supabase SQL editor (Database -> SQL Editor -> New query).
-- Safe to re-run: the calculations table is dropped and recreated.

-- Per-user settings (inflation rate)
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  inflation_rate numeric not null default 0.152,
  updated_at timestamptz not null default now()
);

-- Saved calculations / history (one row per business entry)
drop table if exists public.calculations cascade;
create table public.calculations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  business_type text,                       -- Gosa daldala
  tax_2017_paid numeric not null,           -- Taaksii waliigala bara 2017 kafale
  sales_before numeric not null,            -- sales before inflation
  inflation_rate numeric not null,
  rate_before numeric not null,             -- bracket rate on sales_before
  tax_before numeric not null,              -- sales_before * rate_before
  sales_with numeric not null,              -- sales_before * (1 + inflation_rate)
  rate_with numeric not null,               -- bracket rate on sales_with
  tax_with numeric not null,                -- sales_with * rate_with
  difference numeric not null,              -- Garaagaruma = tax_with - tax_before
  tax_2018 numeric not null                 -- Taaksii Bara 2018 = tax_2017_paid + difference
);

-- Row Level Security
alter table public.user_settings enable row level security;
alter table public.calculations  enable row level security;

drop policy if exists "own settings - select" on public.user_settings;
drop policy if exists "own settings - upsert" on public.user_settings;
drop policy if exists "own settings - update" on public.user_settings;
create policy "own settings - select" on public.user_settings
  for select using (auth.uid() = user_id);
create policy "own settings - upsert" on public.user_settings
  for insert with check (auth.uid() = user_id);
create policy "own settings - update" on public.user_settings
  for update using (auth.uid() = user_id);

create policy "own calcs - select" on public.calculations
  for select using (auth.uid() = user_id);
create policy "own calcs - insert" on public.calculations
  for insert with check (auth.uid() = user_id);
create policy "own calcs - delete" on public.calculations
  for delete using (auth.uid() = user_id);

create index calculations_user_created_idx
  on public.calculations (user_id, created_at desc);
