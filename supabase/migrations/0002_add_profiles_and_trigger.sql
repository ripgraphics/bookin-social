-- Migration to add profiles table and auto-create user profiles
-- This migration adds a separate profiles table and trigger for automatic profile creation

-- Create profiles table (additional user data, no duplication with users table)
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  bio text,
  phone text,
  location text,
  website text,
  avatar_url text,
  preferences jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Profiles policies: users can read all profiles, but only update their own
create policy if not exists profiles_select_all on public.profiles
  for select using (true);

create policy if not exists profiles_insert_self on public.profiles
  for insert with check (auth.uid() = user_id);

create policy if not exists profiles_update_self on public.profiles
  for update using (auth.uid() = user_id);

-- Create function to handle new user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Insert into public.users table
  insert into public.users (id, email, name, image, created_at, updated_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'image',
    now(),
    now()
  )
  on conflict (id) do update
  set
    email = excluded.email,
    name = coalesce(excluded.name, public.users.name),
    image = coalesce(excluded.image, public.users.image),
    updated_at = now();

  -- Insert into public.profiles table (empty profile, user can fill later)
  insert into public.profiles (user_id, created_at, updated_at)
  values (new.id, now(), now())
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Create trigger to automatically create user profile on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create index on profiles
create index if not exists idx_profiles_user on public.profiles(user_id);

-- Add updated_at trigger for profiles table
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists update_profiles_updated_at on public.profiles;
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at_column();

-- Also add updated_at trigger for users table
drop trigger if exists update_users_updated_at on public.users;
create trigger update_users_updated_at
  before update on public.users
  for each row execute procedure public.update_updated_at_column();

