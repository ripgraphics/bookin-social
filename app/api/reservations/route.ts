import { NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { listingId, startDate, endDate, totalPrice } = body || {};
  if (!listingId || !startDate || !endDate || !totalPrice) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('reservations')
    .insert({
      user_id: currentUser.id,
      listing_id: listingId,
      start_date: startDate,
      end_date: endDate,
      total_price: totalPrice,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}