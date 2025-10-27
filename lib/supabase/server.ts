import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
  // Support either ANON or PUBLISHABLE key naming
  const anonOrPublishableKey =
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined) ||
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string | undefined);

  if (!url || !anonOrPublishableKey) {
    throw new Error('Supabase URL or anon/publishable key is not configured in env.');
  }

  return createServerClient(url, anonOrPublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component - safe to ignore
        }
      },
    },
  });
}

/**
 * Creates a Supabase admin client with service role key that bypasses RLS.
 * Use this for server-side operations that need elevated permissions.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;

  if (!url || !serviceRoleKey) {
    throw new Error('Supabase URL or service role key is not configured in env.');
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

