import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
  // Support either ANON or PUBLISHABLE key naming
  const anonOrPublishableKey =
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined) ||
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string | undefined);

  if (!url || !anonOrPublishableKey) {
    throw new Error('Supabase URL or anon/publishable key is not configured in env.');
  }

  return createBrowserClient(url, anonOrPublishableKey);
}


