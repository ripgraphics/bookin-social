const { Client } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function exec(client, sql) {
  try {
    await client.query(sql);
    return { ok: true };
  } catch (e) {
    console.error('SQL_ERROR:', e.message);
    console.error('SQL_SNIPPET:', sql.substring(0, 300));
    return { ok: false, error: e };
  }
}

async function main() {
  const cs = process.env.DIRECT_URL || process.env.SUPABASE_CONNECTION_STRING || process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  if (!cs) {
    console.error('No connection string in env');
    process.exit(1);
  }
  const client = new Client({ connectionString: cs, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    // Ensure extension
    await exec(client, `create extension if not exists "uuid-ossp"`);

    // Check existing tables
    const res = await client.query(`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name in ('users','listings','reservations','user_favorites')
      order by table_name
    `);
    const existing = new Set(res.rows.map(r => r.table_name));
    console.log('EXISTING_TABLES', Array.from(existing));

    // Create users table if missing
    if (!existing.has('users')) {
      await exec(client, `
        create table if not exists public.users (
          id uuid primary key references auth.users(id) on delete cascade,
          name text,
          email text unique,
          image text,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        )
      `);
      await exec(client, `alter table public.users enable row level security`);
      // Users policies (idempotent via drop/create)
      await exec(client, `drop policy if exists users_select_all on public.users`);
      await exec(client, `create policy users_select_all on public.users for select using (true)`);
      await exec(client, `drop policy if exists users_insert_self on public.users`);
      await exec(client, `create policy users_insert_self on public.users for insert with check (auth.uid() = id)`);
      await exec(client, `drop policy if exists users_update_self on public.users`);
      await exec(client, `create policy users_update_self on public.users for update using (auth.uid() = id)`);
      // Trigger and function
      await exec(client, `
        create or replace function public.set_updated_at()
        returns trigger as $$
        begin
          new.updated_at = now();
          return new;
        end;
        $$ language plpgsql
      `);
      await exec(client, `drop trigger if exists trg_users_set_updated_at on public.users`);
      await exec(client, `create trigger trg_users_set_updated_at before update on public.users for each row execute function public.set_updated_at()`);
      await exec(client, `
        create or replace function public.handle_new_user()
        returns trigger as $$
        begin
          insert into public.users (id, email, name, image)
          values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', null), coalesce(new.raw_user_meta_data->>'avatar_url', null))
          on conflict (id) do nothing;
          return new;
        end;
        $$ language plpgsql security definer
      `);
      await exec(client, `drop trigger if exists on_auth_user_created on auth.users`);
      await exec(client, `create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user()`);
    }

    // Create favorites table if missing
    if (!existing.has('user_favorites')) {
      // Ensure listings exists since we FK to it
      await exec(client, `
        create table if not exists public.user_favorites (
          user_id uuid not null,
          listing_id uuid not null,
          created_at timestamptz not null default now(),
          primary key (user_id, listing_id),
          constraint fk_fav_user foreign key (user_id) references auth.users (id) on delete cascade,
          constraint fk_fav_listing foreign key (listing_id) references public.listings (id) on delete cascade
        )
      `);
      await exec(client, `alter table public.user_favorites enable row level security`);
      await exec(client, `drop policy if exists favorites_select_self on public.user_favorites`);
      await exec(client, `create policy favorites_select_self on public.user_favorites for select using (auth.uid() = user_id)`);
      await exec(client, `drop policy if exists favorites_insert_self on public.user_favorites`);
      await exec(client, `create policy favorites_insert_self on public.user_favorites for insert with check (auth.uid() = user_id)`);
      await exec(client, `drop policy if exists favorites_delete_self on public.user_favorites`);
      await exec(client, `create policy favorites_delete_self on public.user_favorites for delete using (auth.uid() = user_id)`);
      await exec(client, `create index if not exists idx_user_favorites_user on public.user_favorites(user_id)`);
      await exec(client, `create index if not exists idx_user_favorites_listing on public.user_favorites(listing_id)`);
    }

    // Ensure base RLS and indexes on existing tables
    await exec(client, `alter table public.listings enable row level security`);
    await exec(client, `alter table public.reservations enable row level security`);
    await exec(client, `create index if not exists idx_listings_user on public.listings(user_id)`);
    await exec(client, `create index if not exists idx_listings_created on public.listings(created_at desc)`);
    await exec(client, `create index if not exists idx_reservations_user on public.reservations(user_id)`);
    await exec(client, `create index if not exists idx_reservations_listing on public.reservations(listing_id)`);
    await exec(client, `drop policy if exists listings_select_all on public.listings`);
    await exec(client, `create policy listings_select_all on public.listings for select using (true)`);
    await exec(client, `drop policy if exists listings_insert_owner on public.listings`);
    await exec(client, `create policy listings_insert_owner on public.listings for insert with check (auth.uid() = user_id)`);
    await exec(client, `drop policy if exists listings_update_owner on public.listings`);
    await exec(client, `create policy listings_update_owner on public.listings for update using (auth.uid() = user_id)`);
    await exec(client, `drop policy if exists listings_delete_owner on public.listings`);
    await exec(client, `create policy listings_delete_owner on public.listings for delete using (auth.uid() = user_id)`);
    await exec(client, `drop policy if exists reservations_rw_owner on public.reservations`);
    await exec(client, `create policy reservations_rw_owner on public.reservations for all using (auth.uid() = user_id) with check (auth.uid() = user_id)`);

    console.log('REPAIR_DONE');
  } finally {
    await client.end();
  }
}

main().catch(e => { console.error('ERROR', e.message || e); process.exit(2); });


