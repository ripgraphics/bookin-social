import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
  const anonOrPublishableKey =
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined) ||
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string | undefined);

  if (!url || !anonOrPublishableKey) {
    return response;
  }

  const supabase = createServerClient(url, anonOrPublishableKey, {
    auth: { persistSession: false },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.getUser();
  return response;
}


