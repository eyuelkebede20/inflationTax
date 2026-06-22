-- ===========================================================================
-- InflaTax — Schedule "B" 2018, multi-tenant (branches) + roles.
-- Run in the Supabase SQL editor. Safe to re-run.
--
-- Roles: 'user' (enters taxpayers), 'admin' (owns a branch, can void locked
-- rows), 'superadmin' (everything + global rates + void feed). The frontend
-- has AUTH_ENABLED=false today; this is the scaffolding to switch on.
-- ===========================================================================

create extension if not exists pgcrypto;

-- ---- Branches --------------------------------------------------------------
create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- ---- Profiles (role + branch per user) ------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'user' check (role in ('user','admin','superadmin')),
  branch_id uuid references public.branches(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Auto-create a profile (role 'user') whenever an auth user is created.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Role/branch helpers (security definer to dodge RLS recursion on profiles).
create or replace function public.my_role()
returns text language sql stable security definer set search_path = public as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'user');
$$;

create or replace function public.my_branch()
returns uuid language sql stable security definer set search_path = public as $$
  select branch_id from public.profiles where id = auth.uid();
$$;

-- ---- Global app settings (singleton) --------------------------------------
create table if not exists public.app_settings (
  id int primary key default 1 check (id = 1),
  inflation_rate numeric not null default 0.152,
  rental_share numeric not null default 0.5,
  updated_at timestamptz not null default now()
);
insert into public.app_settings (id) values (1) on conflict (id) do nothing;

-- ---- Calculations ----------------------------------------------------------
drop table if exists public.calculations cascade;
create table public.calculations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  created_at timestamptz not null default now(),
  name text,                          -- Maqaa Kafalaa Gibiraa
  tin text,
  business_type text,                 -- Gosa daldala (optional)
  kind text not null default 'tax' check (kind in ('tax','rental')),
  turnover numeric not null,          -- sales as entered
  last_year_tax numeric not null,     -- col E (tax paid 2017)
  inflation_rate numeric not null,
  rental_share numeric not null,
  base numeric not null,              -- effective amount fed to the algorithm
  curfew_rate_before numeric not null,
  tax_before numeric not null,        -- col G
  sales_with numeric not null,        -- col H
  curfew_rate_with numeric not null,
  tax_with numeric not null,          -- col I
  garaagaruma numeric not null,       -- col J = I - G
  taaksii_2018 numeric not null,      -- col K = E + J
  owner_id text,                      -- reference to the signer (auth uid)
  owner_name text,                    -- employee who created the entry
  locked boolean not null default false,   -- fixed once printed
  printed_at timestamptz,
  voided boolean not null default false,
  void_reason text,
  voided_by uuid references auth.users(id),
  voided_at timestamptz
);

-- Indexes for 100+ users: branch dashboards + per-user history, newest first.
create index calculations_user_created_idx on public.calculations (user_id, created_at desc);
create index calculations_branch_created_idx on public.calculations (branch_id, created_at desc);

-- ---- Void requests + approval flow ----------------------------------------
-- An employee REQUESTS a void on a locked row; their branch admin APPROVES or
-- REJECTS; the superadmin sees every request overall. Admins may also void
-- directly (recorded as a self-approved request).
create table if not exists public.void_requests (
  id uuid primary key default gen_random_uuid(),
  calc_id uuid not null references public.calculations(id) on delete cascade,
  branch_id uuid,
  calc_name text,
  reason text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  requested_by uuid references auth.users(id),
  requested_by_name text,
  decided_by uuid references auth.users(id),
  decided_by_name text,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);
create index void_requests_branch_idx on public.void_requests (branch_id, status, created_at desc);

-- Employee (or admin) opens a request. Admin opening one is auto-approved.
create or replace function public.request_void(p_calc_id uuid, p_reason text)
returns uuid language plpgsql security definer set search_path = public as $$
declare c public.calculations; r text := public.my_role(); rid uuid;
begin
  select * into c from public.calculations where id = p_calc_id;
  if not found then raise exception 'calculation not found'; end if;

  insert into public.void_requests (calc_id, branch_id, calc_name, reason,
      status, requested_by, requested_by_name)
  values (c.id, c.branch_id, c.name, p_reason,
      case when r in ('admin','superadmin') then 'approved' else 'pending' end,
      auth.uid(),
      (select coalesce(full_name, '') from public.profiles where id = auth.uid()))
  returning id into rid;

  if r in ('admin','superadmin') then
    update public.calculations set voided = true, void_reason = p_reason,
        voided_by = auth.uid(), voided_at = now() where id = c.id;
  end if;
  return rid;
end; $$;

-- Admin/superadmin decides a pending request.
create or replace function public.decide_void(p_request_id uuid, p_approve boolean)
returns void language plpgsql security definer set search_path = public as $$
declare req public.void_requests;
begin
  if public.my_role() not in ('admin','superadmin') then
    raise exception 'not authorized';
  end if;
  select * into req from public.void_requests where id = p_request_id;
  if not found then raise exception 'request not found'; end if;

  update public.void_requests
     set status = case when p_approve then 'approved' else 'rejected' end,
         decided_by = auth.uid(), decided_at = now(),
         decided_by_name = (select full_name from public.profiles where id = auth.uid())
   where id = req.id;

  if p_approve then
    update public.calculations set voided = true, void_reason = req.reason,
        voided_by = auth.uid(), voided_at = now() where id = req.calc_id;
  end if;
end; $$;

-- ===========================================================================
-- Row Level Security
-- ===========================================================================
alter table public.branches      enable row level security;
alter table public.profiles      enable row level security;
alter table public.app_settings  enable row level security;
alter table public.calculations  enable row level security;
alter table public.void_requests enable row level security;

-- branches: everyone signed in can read; only superadmin writes.
drop policy if exists branches_read on public.branches;
create policy branches_read on public.branches for select using (auth.role() = 'authenticated');
drop policy if exists branches_write on public.branches;
create policy branches_write on public.branches for all
  using (public.my_role() = 'superadmin') with check (public.my_role() = 'superadmin');

-- profiles: read own; superadmin reads all; superadmin updates roles/branches.
drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles for select
  using (id = auth.uid() or public.my_role() = 'superadmin');
drop policy if exists profiles_super_write on public.profiles;
create policy profiles_super_write on public.profiles for update
  using (public.my_role() = 'superadmin') with check (public.my_role() = 'superadmin');

-- app_settings: all read; superadmin writes.
drop policy if exists settings_read on public.app_settings;
create policy settings_read on public.app_settings for select using (auth.role() = 'authenticated');
drop policy if exists settings_write on public.app_settings;
create policy settings_write on public.app_settings for all
  using (public.my_role() = 'superadmin') with check (public.my_role() = 'superadmin');

-- calculations:
--   select: own rows, or your branch (admin), or all (superadmin)
--   insert: your own rows
--   delete: own + not locked (printed rows are immutable; admins void instead)
drop policy if exists calc_select on public.calculations;
create policy calc_select on public.calculations for select using (
  user_id = auth.uid()
  or (public.my_role() = 'admin' and branch_id = public.my_branch())
  or public.my_role() = 'superadmin'
);
drop policy if exists calc_insert on public.calculations;
create policy calc_insert on public.calculations for insert with check (user_id = auth.uid());
drop policy if exists calc_update on public.calculations;
create policy calc_update on public.calculations for update
  using (user_id = auth.uid() and not locked);
drop policy if exists calc_delete on public.calculations;
create policy calc_delete on public.calculations for delete
  using (user_id = auth.uid() and not locked);

-- void_requests:
--   select: own requests, your branch (admin), or all (superadmin)
--   insert: employees create their own (decisions go through decide_void RPC)
drop policy if exists void_select on public.void_requests;
create policy void_select on public.void_requests for select using (
  requested_by = auth.uid()
  or (public.my_role() = 'admin' and branch_id = public.my_branch())
  or public.my_role() = 'superadmin'
);
drop policy if exists void_insert on public.void_requests;
create policy void_insert on public.void_requests for insert
  with check (requested_by = auth.uid());
