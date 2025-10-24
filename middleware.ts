import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: any) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/trips",
    "/reservations",
    "/properties",
    "/favorites",
  ]
}