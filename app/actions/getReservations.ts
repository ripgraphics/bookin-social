import { createClient } from "@/lib/supabase/server";

interface IParams {
  listingId?: string;
  userId?: string;
  authorId?: string;
}

export default async function getReservations(
  params: IParams
) {
  try {
    const { listingId, userId, authorId } = params;

    const supabase = await createClient();
    let query = supabase
      .from("reservations")
      .select("*, listings(*)")
      .order("created_at", { ascending: false });

    if (listingId) query = query.eq("listing_id", listingId);
    if (userId) query = query.eq("user_id", userId);
    if (authorId) query = query.eq("listings.user_id", authorId);

    const { data, error } = await query as any;
    if (error) throw new Error(error.message);

    return (data || []).map((row: any) => ({
      ...row,
      createdAt: row.created_at,
      startDate: row.start_date,
      endDate: row.end_date,
      listing: {
        ...row.listings,
        createdAt: row.listings?.created_at,
      }
    }));
  } catch (error: any) {
    throw new Error(error);
  }
}