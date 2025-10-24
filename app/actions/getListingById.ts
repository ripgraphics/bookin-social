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
      .select("*")
      .eq("id", listingId)
      .single();

    if (error || !data) return null;

    // Parse imageSrc if it's a JSON string array
    let imageSrc = data.image_src;
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
    } as any;
  } catch (error: any) {
    throw new Error(error);
  }
}
