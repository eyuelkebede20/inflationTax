-- Run this in the Supabase SQL editor (Database -> SQL Editor -> New query).
-- Safe to re-run: the calculations table is dropped and recreated.

-- Per-user settings (inflation rate, TOT rate, profit margin)
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  inflation_rate numeric not null default 0.152,
  tot_rate numeric not null default 0.10,
  profit_margin numeric not null default 0.10,
  updated_at timestamptz not null default now()
);
-- add columns if upgrading an older table
alter table public.user_settings add column if not exists tot_rate numeric not null default 0.10;
alter table public.user_settings add column if not exists profit_margin numeric not null default 0.10;

-- Saved calculations / history (one row per taxpayer entry)
drop table if exists public.calculations cascade;
create table public.calculations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  name text,                              -- Maqaa Kafalaa Gibiraa
  tin text,
  business_type text,                     -- Gosa daldala
  turnover numeric not null,              -- taxable income / gross
  inflation_rate numeric not null,
  tot_rate numeric not null,
  profit_margin numeric not null,
  is_service boolean not null default true, -- TOT applies only to services
  profit_base numeric not null,           -- turnover * profit_margin
  profit_tax_amt numeric not null,        -- profitTax(profit_base)
  tot numeric not null,                   -- turnover * tot_rate
  last_year_tax numeric not null,         -- tot + profit_tax_amt (or manual)
  last_year_tax_manual boolean not null default false,
  curfew_rate_before numeric not null,
  tax_before numeric not null,            -- turnover * curfew rate
  sales_with numeric not null,            -- turnover * (1 + inflation)
  curfew_rate_with numeric not null,
  tax_with numeric not null,              -- sales_with * curfew rate
  garaagaruma numeric not null,           -- tax_with - tax_before
  taaksii_2018 numeric not null           -- last_year_tax + garaagaruma
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
