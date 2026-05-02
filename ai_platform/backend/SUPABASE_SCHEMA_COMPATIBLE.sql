-- ============================================================
-- Imagyn / ComfyUI Studio - Supabase schema
-- Created to match the current backend code in ai_platform/backend/app
-- Safe to run in the Supabase SQL editor on a fresh project
-- ============================================================

begin;

create extension if not exists pgcrypto;

-- ============================================================
-- Helper functions
-- ============================================================

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, name, credits, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(coalesce(new.email, 'User'), '@', 1), 'User'),
    100,
    'user'
  )
  on conflict (id) do update
  set email = excluded.email,
      name = coalesce(excluded.name, public.users.name);

  return new;
end;
$$;

create or replace function public.deduct_credits(
  user_id_param uuid,
  credits_param integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_credits integer;
begin
  select credits
    into current_credits
  from public.users
  where id = user_id_param
  for update;

  if current_credits is null then
    return false;
  end if;

  if current_credits < credits_param then
    return false;
  end if;

  update public.users
  set credits = credits - credits_param,
      updated_at = timezone('utc', now())
  where id = user_id_param;

  return true;
end;
$$;

create or replace function public.add_credits(
  user_id_param uuid,
  credits_param integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users
  set credits = credits + credits_param,
      updated_at = timezone('utc', now())
  where id = user_id_param;

  return found;
end;
$$;

-- ============================================================
-- Tables
-- ============================================================

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null unique,
  price numeric(10, 2) not null check (price >= 0),
  credits integer not null check (credits > 0),
  duration_days integer not null check (duration_days > 0),
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name varchar(100) not null default 'User',
  email varchar(255) not null unique,
  credits integer not null default 100 check (credits >= 0),
  role varchar(20) not null default 'user' check (role in ('user', 'admin')),
  plan_id uuid references public.plans(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_login timestamptz
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  prompt text not null,
  model_name varchar(255) not null default 'dreamshaperXL_lightningDPMSDE.safetensors',
  image_url text,
  gpu_time double precision,
  status varchar(20) not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  started_at timestamptz,
  finished_at timestamptz,
  error_message text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  prompt text not null,
  image_url text not null,
  model_used varchar(255),
  status varchar(20) not null default 'completed' check (status in ('pending', 'processing', 'completed', 'failed')),
  generation_time double precision,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  amount numeric(10, 2) not null default 0 check (amount >= 0),
  credits_added integer not null check (credits_added <> 0),
  type varchar(20) not null check (type in ('purchase', 'refund', 'bonus', 'deduction')),
  status varchar(20) not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.users add column if not exists updated_at timestamptz not null default timezone('utc', now());
alter table public.jobs add column if not exists image_url text;
alter table public.jobs add column if not exists updated_at timestamptz not null default timezone('utc', now());
alter table public.images add column if not exists updated_at timestamptz not null default timezone('utc', now());
alter table public.plans add column if not exists updated_at timestamptz not null default timezone('utc', now());

create or replace function public.is_admin(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = check_user_id
      and role = 'admin'
  );
$$;

-- ============================================================
-- Triggers
-- ============================================================

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
before update on public.users
for each row
execute function public.update_updated_at_column();

drop trigger if exists plans_set_updated_at on public.plans;
create trigger plans_set_updated_at
before update on public.plans
for each row
execute function public.update_updated_at_column();

drop trigger if exists jobs_set_updated_at on public.jobs;
create trigger jobs_set_updated_at
before update on public.jobs
for each row
execute function public.update_updated_at_column();

drop trigger if exists images_set_updated_at on public.images;
create trigger images_set_updated_at
before update on public.images
for each row
execute function public.update_updated_at_column();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- Sync any auth users that already exist.
insert into public.users (id, email, name, credits, role)
select
  au.id,
  au.email,
  coalesce(au.raw_user_meta_data->>'name', split_part(coalesce(au.email, 'User'), '@', 1), 'User'),
  100,
  'user'
from auth.users au
on conflict (id) do update
set email = excluded.email,
    name = coalesce(excluded.name, public.users.name);

-- ============================================================
-- Indexes
-- ============================================================

create index if not exists idx_users_email on public.users(email);
create index if not exists idx_users_role on public.users(role);
create index if not exists idx_users_plan_id on public.users(plan_id);
create index if not exists idx_users_created_at on public.users(created_at desc);

create index if not exists idx_jobs_user_id on public.jobs(user_id);
create index if not exists idx_jobs_status on public.jobs(status);
create index if not exists idx_jobs_created_at on public.jobs(created_at desc);

create index if not exists idx_images_user_id on public.images(user_id);
create index if not exists idx_images_job_id on public.images(job_id);
create index if not exists idx_images_status on public.images(status);
create index if not exists idx_images_created_at on public.images(created_at desc);

create index if not exists idx_transactions_user_id on public.transactions(user_id);
create index if not exists idx_transactions_status on public.transactions(status);
create index if not exists idx_transactions_created_at on public.transactions(created_at desc);

create index if not exists idx_plans_is_active on public.plans(is_active);

-- ============================================================
-- Seed plans
-- ============================================================

insert into public.plans (name, price, credits, duration_days, description, is_active)
values
  ('Starter', 9.99, 100, 30, 'Perfect for trying out the platform.', true),
  ('Pro', 29.99, 500, 30, 'For creators generating regularly.', true),
  ('Business', 99.99, 2000, 30, 'For teams and heavier workloads.', true)
on conflict (name) do update
set price = excluded.price,
    credits = excluded.credits,
    duration_days = excluded.duration_days,
    description = excluded.description,
    is_active = excluded.is_active,
    updated_at = timezone('utc', now());

-- ============================================================
-- RLS
-- ============================================================

alter table public.users enable row level security;
alter table public.plans enable row level security;
alter table public.jobs enable row level security;
alter table public.images enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "users_select_own" on public.users;
create policy "users_select_own"
on public.users
for select
using (auth.uid() = id or public.is_admin(auth.uid()));

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own"
on public.users
for update
using (auth.uid() = id or public.is_admin(auth.uid()))
with check (auth.uid() = id or public.is_admin(auth.uid()));

drop policy if exists "users_insert_self" on public.users;
create policy "users_insert_self"
on public.users
for insert
with check (auth.uid() = id or public.is_admin(auth.uid()));

drop policy if exists "plans_public_read" on public.plans;
create policy "plans_public_read"
on public.plans
for select
using (is_active = true or public.is_admin(auth.uid()));

drop policy if exists "plans_admin_manage" on public.plans;
create policy "plans_admin_manage"
on public.plans
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "jobs_select_own" on public.jobs;
create policy "jobs_select_own"
on public.jobs
for select
using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "jobs_insert_own" on public.jobs;
create policy "jobs_insert_own"
on public.jobs
for insert
with check (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "images_select_own" on public.images;
create policy "images_select_own"
on public.images
for select
using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "images_insert_own" on public.images;
create policy "images_insert_own"
on public.images
for insert
with check (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "images_delete_own" on public.images;
create policy "images_delete_own"
on public.images
for delete
using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "transactions_select_own" on public.transactions;
create policy "transactions_select_own"
on public.transactions
for select
using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "transactions_insert_own" on public.transactions;
create policy "transactions_insert_own"
on public.transactions
for insert
with check (auth.uid() = user_id or public.is_admin(auth.uid()));

-- ============================================================
-- Grants
-- ============================================================

grant usage on schema public to anon, authenticated, service_role;
grant select on public.plans to anon, authenticated;
grant select, insert, update on public.users to authenticated;
grant select, insert on public.jobs to authenticated;
grant select, insert, delete on public.images to authenticated;
grant select, insert on public.transactions to authenticated;
grant execute on function public.deduct_credits(uuid, integer) to authenticated, service_role;
grant execute on function public.add_credits(uuid, integer) to authenticated, service_role;
grant execute on function public.is_admin(uuid) to authenticated, service_role;

commit;

-- ============================================================
-- Quick verification
-- ============================================================
-- select * from public.plans;
-- select * from public.users order by created_at desc;
-- select * from public.jobs order by created_at desc;
-- select * from public.images order by created_at desc;
