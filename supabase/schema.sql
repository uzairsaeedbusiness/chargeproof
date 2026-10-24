-- ==============================================================================
-- ChargeProof Database Schema (Supabase PostgreSQL with Row Level Security)
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (syncs with Supabase Auth users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  business_name text,
  subscription_status text not null default 'free' check (subscription_status in ('free', 'active', 'past_due', 'canceled')),
  lemon_squeezy_customer_id text,
  lemon_squeezy_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Usage Credits Table ("Win First" Model: 2 Free Credits upfront)
create table if not exists public.usage_credits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade unique,
  free_credits_remaining integer not null default 2 check (free_credits_remaining >= 0),
  is_unlimited boolean not null default false,
  total_dossiers_generated integer not null default 0,
  updated_at timestamptz not null default now()
);

-- 3. Disputes Table
create table if not exists public.disputes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_number text not null,
  customer_name text not null,
  dispute_amount numeric(10, 2) not null,
  currency text not null default 'USD',
  reason_code text not null check (reason_code in ('product_not_received', 'fraudulent', 'unrecognized', 'other')),
  carrier text,
  tracking_number text,
  delivery_status text,
  status text not null default 'generated' check (status in ('draft', 'generated', 'submitted', 'won', 'lost')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Evidence Dossiers Table (Structured JSON and rendered PDF path)
create table if not exists public.evidence_dossiers (
  id uuid primary key default uuid_generate_v4(),
  dispute_id uuid not null references public.disputes(id) on delete cascade unique,
  user_id uuid not null references public.profiles(id) on delete cascade,
  pdf_storage_path text,
  structured_summary jsonb not null,
  form_snippets jsonb not null,
  created_at timestamptz not null default now()
);

-- 5. Auto-Provisioning Trigger on New User Signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, business_name)
  values (new.id, new.email, split_part(new.email, '@', 1))
  on conflict (id) do nothing;

  insert into public.usage_credits (user_id, free_credits_remaining, is_unlimited)
  values (new.id, 2, false)
  on conflict (user_id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

-- Attach trigger to auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6. Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.usage_credits enable row level security;
alter table public.disputes enable row level security;
alter table public.evidence_dossiers enable row level security;

create policy "Users can view and edit own profile"
  on public.profiles for all
  using (auth.uid() = id);

create policy "Users can view own usage credits"
  on public.usage_credits for select
  using (auth.uid() = user_id);

create policy "Users can CRUD own disputes"
  on public.disputes for all
  using (auth.uid() = user_id);

create policy "Users can CRUD own dossiers"
  on public.evidence_dossiers for all
  using (auth.uid() = user_id);

-- 7. Supabase Storage: Dispute Dossiers Bucket with 90-Day Retention Notice
insert into storage.buckets (id, name, public)
values ('dispute-dossiers', 'dispute-dossiers', false)
on conflict (id) do nothing;

create policy "Authenticated users can upload dispute PDFs"
  on storage.objects for insert
  with check (bucket_id = 'dispute-dossiers' and auth.role() = 'authenticated');

create policy "Authenticated users can read own dispute PDFs"
  on storage.objects for select
  using (bucket_id = 'dispute-dossiers' and auth.uid()::text = (storage.foldername(name))[1]);

-- Retention Cleanup Function: Purges dossiers older than 90 days
create or replace function public.purge_expired_dossiers()
returns void as $$
begin
  delete from public.evidence_dossiers
  where created_at < now() - interval '90 days';
end;
$$ language plpgsql security definer;
