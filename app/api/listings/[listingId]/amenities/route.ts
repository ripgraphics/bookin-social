import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface IParams {
  listingId?: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<IParams> }
) {
  const { listingId } = await params;
  if (!listingId || typeof listingId !== 'string') {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  const supabase = await createClient();
  
  // Fetch all amenities for this listing
  const { data, error } = await supabase
    .from('listing_amenities')
    .select('*')
    .eq('listing_id', listingId);

  if (error) {
    console.error('[GET /api/listings/[listingId]/amenities] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data || []);
}
