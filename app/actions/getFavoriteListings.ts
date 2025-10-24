import { createClient } from "@/lib/supabase/server";
import getCurrentUser from "./getCurrentUser";

export default async function getFavoriteListings() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.id) return [];

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("user_favorites")
      .select("listings(*)")
      .eq("user_id", currentUser.id);

    if (error) throw new Error(error.message);
    return (data || []).map((row: any) => ({
      ...row.listings,
      createdAt: row.listings?.created_at,
    }));
  } catch (error: any) {
    throw new Error(error);
  }
}
