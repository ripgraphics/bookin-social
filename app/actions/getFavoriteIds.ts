import { performance } from "perf_hooks";
import { query } from "@/lib/db/pool";
import { getSessionUser } from "@/lib/auth/session";

export default async function getFavoriteIds(): Promise<string[]> {
  try {
    const timings: { label: string; duration: number }[] = [];
    const totalStart = performance.now();

    const sessionStart = performance.now();
    const sessionUser = await getSessionUser();
    timings.push({ label: "decodeSession", duration: performance.now() - sessionStart });

    if (!sessionUser?.id) {
      if (process.env.NODE_ENV === "development") {
        timings.push({ label: "total", duration: performance.now() - totalStart });
        console.log("[perf] getFavoriteIds", timings);
      }
      return [];
    }

    const queryStart = performance.now();
    const { rows } = await query(
      `SELECT listing_id FROM public.user_favorites WHERE user_id = $1`,
      [sessionUser.id]
    );
    timings.push({ label: "favorites query", duration: performance.now() - queryStart });

    if (process.env.NODE_ENV === "development") {
      timings.push({ label: "total", duration: performance.now() - totalStart });
      console.log("[perf] getFavoriteIds", timings);
    }

    return rows.map((row: any) => row.listing_id as string);
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[getFavoriteIds] Error:', error instanceof Error ? error.message : String(error));
    }
    return [];
  }
}

