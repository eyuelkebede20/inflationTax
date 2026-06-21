-- Run this in the Supabase SQL editor (Database -> SQL Editor -> New query).
-- Safe to re-run: the calculations table is dropped and recreated.

-- Per-user settings (inflation rate)
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  inflation_rate numeric not null default 0.152,
  updated_at timestamptz not null default now()
);

-- Saved calculations / history (one row per taxable-amount entry)
drop table if exists public.calculations cascade;
create table public.calculations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  business_type text,
  taxable numeric not null,             -- base taxable amount (before inflation)
  inflation_rate numeric not null,
  inflated_amount numeric not null,     -- taxable * (1 + inflation_rate)
  -- before inflation
  profit_tax_base numeric not null,
  curfew_rate_base numeric not null,
  curfew_base numeric not null,
  total_base numeric not null,
  -- with inflation
  profit_tax_infl numeric not null,
  curfew_rate_infl numeric not null,
  curfew_infl numeric not null,
  total_infl numeric not null,
  -- inflation-driven increases
  profit_tax_diff numeric not null,
  curfew_diff numeric not null,
  total_diff numeric not null
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
