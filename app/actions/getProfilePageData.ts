import { performance } from "perf_hooks";
import { query } from "@/lib/db/pool";
import { getSessionUser } from "@/lib/auth/session";

/**
 * Fetch all data needed for the profile page in a single server-side call
 * This eliminates duplicate API calls and improves performance
 */
export default async function getProfilePageData() {
  try {
    const timings: { label: string; duration: number }[] = [];
    const totalStart = performance.now();

    const sessionStart = performance.now();
    const sessionUser = await getSessionUser();
    timings.push({ label: "decodeSession", duration: performance.now() - sessionStart });
    
    if (!sessionUser) {
      if (process.env.NODE_ENV === "development") {
        timings.push({ label: "total", duration: performance.now() - totalStart });
        console.log("[perf] getProfilePageData", timings);
      }
      return null;
    }

    // Get the user's public.users id
    const userQueryStart = performance.now();
    const { rows: publicUserRows } = await query(
      `SELECT id, first_name, last_name, email
       FROM public.users
       WHERE auth_user_id = $1
       LIMIT 1`,
      [sessionUser.id]
    );
    timings.push({ label: "users query", duration: performance.now() - userQueryStart });

    const publicUser = publicUserRows[0];

    if (!publicUser) {
      if (process.env.NODE_ENV === "development") {
        timings.push({ label: "total", duration: performance.now() - totalStart });
        console.log("[perf] getProfilePageData", timings);
      }
      return null;
    }

    const authUserPromise = (async () => {
      const start = performance.now();
      const { rows } = await query(
        `SELECT email_confirmed_at FROM auth.users WHERE id = $1 LIMIT 1`,
        [sessionUser.id]
      );
      timings.push({ label: "auth.users query", duration: performance.now() - start });
      return rows[0] || null;
    })();

    // Parallelize all profile data fetching for maximum performance
    const profilePromise = (async () => {
      const start = performance.now();
      const { rows } = await query(
        `SELECT * FROM public.profiles WHERE user_id = $1 LIMIT 1`,
        [publicUser.id]
      );
      timings.push({ label: "profiles query", duration: performance.now() - start });
      return rows[0] || null;
    })();

    const preferencesPromise = (async () => {
      const start = performance.now();
      const { rows } = await query(
        `SELECT * FROM public.user_preferences WHERE user_id = $1 LIMIT 1`,
        [publicUser.id]
      );
      timings.push({ label: "user_preferences query", duration: performance.now() - start });
      return rows[0] || null;
    })();

    const twoFactorPromise = (async () => {
      const start = performance.now();
      const { rows } = await query(
        `SELECT enabled FROM public.two_factor_auth WHERE user_id = $1 LIMIT 1`,
        [publicUser.id]
      );
      timings.push({ label: "two_factor_auth query", duration: performance.now() - start });
      return rows[0] || null;
    })();

    const postsPromise = (async () => {
      const start = performance.now();
      const { rows } = await query(
        `SELECT * FROM public.user_posts WHERE user_id = $1 ORDER BY created_at DESC`,
        [publicUser.id]
      );
      timings.push({ label: "user_posts query", duration: performance.now() - start });
      return rows;
    })();

    const [
      profile,
      preferences,
      twoFactor,
      posts,
      authUser
    ] = await Promise.all([profilePromise, preferencesPromise, twoFactorPromise, postsPromise, authUserPromise]);

    // Calculate profile completion
    const profileData = {
      ...(profile || {}),
      email_verified: authUser?.email_confirmed_at !== null,
      two_factor_enabled: twoFactor?.enabled || false,
    };
    
    // Calculate profile completion
    const completionPercentage = calculateProfileCompletionLocal(profileData);

    if (process.env.NODE_ENV === "development") {
      timings.push({ label: "total", duration: performance.now() - totalStart });
      console.log("[perf] getProfilePageData", timings);
    }

    return {
      id: publicUser.id,
      first_name: publicUser.first_name,
      last_name: publicUser.last_name,
      email: publicUser.email,
      profile: profile || {},
      preferences: preferences || {},
      posts: posts || [],
      profile_completion_percentage: completionPercentage,
      two_factor_enabled: twoFactor?.enabled || false,
    };
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[getProfilePageData] Error:', error instanceof Error ? error.message : String(error));
    }
    return null;
  }
}

/**
 * Simplified profile completion calculation (avoids importing client-side utils)
 */
function calculateProfileCompletionLocal(data: any): number {
  const fields = {
    first_name: data.first_name ? 10 : 0,
    last_name: data.last_name ? 10 : 0,
    email: data.email ? 10 : 0,
    bio: data.bio ? 10 : 0,
    phone: data.phone ? 10 : 0,
    location: data.location ? 10 : 0,
    website: data.website ? 10 : 0,
    job_title: data.job_title ? 10 : 0,
    company: data.company ? 10 : 0,
    avatar_image_id: data.avatar_image_id ? 10 : 0,
  };

  const total = Object.values(fields).reduce((sum, value) => sum + value, 0);
  return Math.min(100, total);
}
