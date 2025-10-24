-- Migration to add profiles and images tables with proper foreign key constraints
-- This migration creates a normalized schema separating user data, profiles, and images

-- Step 1: Create images table FIRST (no dependencies)
create table if not exists public.images (
  id uuid primary key default uuid_generate_v4(),
  url text not null,
  alt_text text,
  entity_type text not null check (entity_type in ('avatar', 'cover', 'listing', 'other')),
  entity_id uuid,
  width int,
  height int,
  file_size int,
  mime_type text,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Enable RLS on images
alter table public.images enable row level security;

-- Images policies: anyone can read, only owner/uploader can insert/update/delete
drop policy if exists images_select_all on public.images;
create policy images_select_all on public.images
  for select using (true);

drop policy if exists images_insert_own on public.images;
create policy images_insert_own on public.images
  for insert with check (auth.uid() = uploaded_by);

drop policy if exists images_update_own on public.images;
create policy images_update_own on public.images
  for update using (auth.uid() = uploaded_by);

drop policy if exists images_delete_own on public.images;
create policy images_delete_own on public.images
  for delete using (auth.uid() = uploaded_by);

-- Step 2: Remove image column from users table (if it exists)
alter table public.users drop column if exists image;

-- Step 3: Create profiles table with foreign keys to images
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  bio text,
  phone text,
  location text,
  website text,
  avatar_image_id uuid references public.images(id) on delete set null,
  cover_image_id uuid references public.images(id) on delete set null,
  preferences jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Profiles policies: users can read all profiles, but only update their own
drop policy if exists profiles_select_all on public.profiles;
create policy profiles_select_all on public.profiles
  for select using (true);

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
  for insert with check (auth.uid() = user_id);

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (auth.uid() = user_id);

-- Step 4: Create function to handle new user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Insert into public.users table
  insert into public.users (id, email, name, created_at, updated_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    now(),
    now()
  )
  on conflict (id) do update
  set
    email = excluded.email,
    name = coalesce(excluded.name, public.users.name),
    updated_at = now();

  -- Insert into public.profiles table (empty profile, user can fill later)
  insert into public.profiles (user_id, created_at, updated_at)
  values (new.id, now(), now())
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Step 5: Create trigger to automatically create user profile on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Step 6: Create indexes for performance
create index if not exists idx_images_entity on public.images(entity_type, entity_id);
create index if not exists idx_images_uploaded_by on public.images(uploaded_by);
create index if not exists idx_profiles_user on public.profiles(user_id);
create index if not exists idx_profiles_avatar on public.profiles(avatar_image_id);
create index if not exists idx_profiles_cover on public.profiles(cover_image_id);

-- Step 7: Add updated_at trigger for profiles table
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

-- Also ensure updated_at trigger exists for users table
drop trigger if exists update_users_updated_at on public.users;
create trigger update_users_updated_at
  before update on public.users
  for each row execute procedure public.update_updated_at_column();

-- Step 8: Add constraint names for better error messages
alter table public.profiles 
  drop constraint if exists profiles_user_id_fkey,
  add constraint profiles_user_id_fkey 
    foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.profiles 
  drop constraint if exists profiles_avatar_image_id_fkey,
  add constraint profiles_avatar_image_id_fkey 
    foreign key (avatar_image_id) references public.images(id) on delete set null;

alter table public.profiles 
  drop constraint if exists profiles_cover_image_id_fkey,
  add constraint profiles_cover_image_id_fkey 
    foreign key (cover_image_id) references public.images(id) on delete set null;

alter table public.images 
  drop constraint if exists images_uploaded_by_fkey,
  add constraint images_uploaded_by_fkey 
    foreign key (uploaded_by) references auth.users(id) on delete set null;

