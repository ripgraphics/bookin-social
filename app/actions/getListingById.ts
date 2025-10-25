import { createClient } from "@/lib/supabase/server";

interface IParams {
  listingId?: string;
}

export default async function getListingById(
  params: IParams
) {
  try {
    const { listingId } = params;
    if (!listingId) return null;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("listings")
      .select(`
        *,
        user:users!user_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq("id", listingId)
      .single();

    if (error || !data) return null;

    // Debug: Log the user data to see what we're getting
    console.log(`[getListingById] Raw data for listing ${listingId}:`, {
      user: data.user,
      user_id: data.user_id,
      hasUser: !!data.user
    });

    // Parse imageSrc if it's a JSON string array
    let imageSrc = data.image_src || '';
    if (typeof imageSrc === 'string' && imageSrc.startsWith('[')) {
      try {
        imageSrc = JSON.parse(imageSrc);
      } catch (e) {
        console.log(`[getListingById] Failed to parse imageSrc for listing ${listingId}`);
      }
    }

    return {
      ...data,
      image_src: imageSrc,
      imageSrc: imageSrc, // Also set camelCase version
      createdAt: data.created_at,
      user: data.user ? {
        id: data.user.id,
        firstName: data.user.first_name,
        lastName: data.user.last_name,
        email: data.user.email,
      } : null,
    } as any;
  } catch (error: any) {
    throw new Error(error);
  }
}
