-- Idempotent initial schema for Supabase Postgres
-- No destructive statements. Run multiple times safely.

-- Extensions
create extension if not exists "uuid-ossp";

-- Tables
-- Users profile table extending auth.users
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text unique,
  image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listings (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  image_src text,
  created_at timestamptz not null default now(),
  category text,
  room_count int,
  bathroom_count int,
  guest_count int,
  location_value text,
  user_id uuid not null,
  price int not null default 0
);

create table if not exists public.reservations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  listing_id uuid not null,
  start_date date not null,
  end_date date not null,
  total_price int not null,
  created_at timestamptz not null default now(),
  constraint fk_res_user foreign key (user_id) references auth.users (id) on delete cascade,
  constraint fk_res_listing foreign key (listing_id) references public.listings (id) on delete cascade
);

-- Favorites (many-to-many)
create table if not exists public.user_favorites (
  user_id uuid not null,
  listing_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id),
  constraint fk_fav_user foreign key (user_id) references auth.users (id) on delete cascade,
  constraint fk_fav_listing foreign key (listing_id) references public.listings (id) on delete cascade
);

-- Indexes
create index if not exists idx_listings_user on public.listings(user_id);
create index if not exists idx_listings_created on public.listings(created_at desc);
create index if not exists idx_reservations_user on public.reservations(user_id);
create index if not exists idx_reservations_listing on public.reservations(listing_id);
create index if not exists idx_user_favorites_user on public.user_favorites(user_id);
create index if not exists idx_user_favorites_listing on public.user_favorites(listing_id);

-- RLS
alter table public.listings enable row level security;
alter table public.reservations enable row level security;
alter table public.users enable row level security;
alter table public.user_favorites enable row level security;

-- Policies for listings: anyone can read; only owner can insert/update/delete
create policy if not exists listings_select_all on public.listings
  for select using (true);

create policy if not exists listings_insert_owner on public.listings
  for insert with check (auth.uid() = user_id);

create policy if not exists listings_update_owner on public.listings
  for update using (auth.uid() = user_id);

create policy if not exists listings_delete_owner on public.listings
  for delete using (auth.uid() = user_id);

-- Policies for reservations: only owner can read/write own
create policy if not exists reservations_rw_owner on public.reservations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Policies for users profile
create policy if not exists users_select_all on public.users
  for select using (true);

create policy if not exists users_insert_self on public.users
  for insert with check (auth.uid() = id);

create policy if not exists users_update_self on public.users
  for update using (auth.uid() = id);

-- Policies for favorites
create policy if not exists favorites_select_self on public.user_favorites
  for select using (auth.uid() = user_id);

create policy if not exists favorites_insert_self on public.user_favorites
  for insert with check (auth.uid() = user_id);

create policy if not exists favorites_delete_self on public.user_favorites
  for delete using (auth.uid() = user_id);

-- Trigger to keep users.updated_at in sync
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_users_set_updated_at on public.users;
create trigger trg_users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

-- Trigger to auto create profile on auth.users insert
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, image)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', null), coalesce(new.raw_user_meta_data->>'avatar_url', null))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();


