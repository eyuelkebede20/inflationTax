-- Run this in the Supabase SQL editor (Database → SQL Editor → New query).

-- Per-user settings (inflation rate)
create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  inflation_rate numeric not null default 0.152,
  updated_at timestamptz not null default now()
);

-- Saved calculations / history
create table public.calculations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  label text,
  taxable_2017 numeric not null,
  inflation_rate numeric not null,
  taxable_2016 numeric not null,
  profit_tax_2016 numeric not null,
  profit_tax_2017 numeric not null,
  schedule_rate_2016 numeric not null,
  schedule_rate_2017 numeric not null,
  curfew_2016 numeric not null,
  curfew_2017 numeric not null
);

-- Row Level Security
alter table public.user_settings enable row level security;
alter table public.calculations  enable row level security;

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
