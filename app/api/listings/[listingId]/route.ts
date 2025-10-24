import { NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { createClient } from "@/lib/supabase/server";

interface IParams {
  listingId?: string;
}

export async function DELETE(
  request: Request,
  { params }: { params: IParams }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { listingId } = params;
  if (!listingId || typeof listingId !== 'string') {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', listingId)
    .eq('user_id', currentUser.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
