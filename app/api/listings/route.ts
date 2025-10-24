import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import getCurrentUser from "@/app/actions/getCurrentUser";

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    title,
    description,
    imageSrc,
    category,
    roomCount,
    bathroomCount,
    guestCount,
    location,
    price,
  } = body || {};

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .insert({
      title,
      description,
      image_src: imageSrc,
      category,
      room_count: roomCount,
      bathroom_count: bathroomCount,
      guest_count: guestCount,
      location_value: location?.value,
      price: parseInt(price, 10),
      user_id: currentUser.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
