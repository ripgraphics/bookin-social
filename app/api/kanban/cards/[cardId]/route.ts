import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const { cardId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const { data: card, error } = await supabase
      .from("kanban_cards")
      .update(body)
      .eq("id", cardId)
      .select()
      .single();

    if (error) {
      console.error("[PATCH /api/kanban/cards/[cardId]] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(card);
  } catch (error: any) {
    console.error("[PATCH /api/kanban/cards/[cardId]] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const { cardId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("kanban_cards")
      .delete()
      .eq("id", cardId);

    if (error) {
      console.error("[DELETE /api/kanban/cards/[cardId]] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/kanban/cards/[cardId]] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

