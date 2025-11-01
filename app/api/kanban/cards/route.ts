import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { column_id, title, description, position } = body;

    const { data: card, error } = await supabase
      .from("kanban_cards")
      .insert({
        column_id,
        title,
        description,
        position
      })
      .select()
      .single();

    if (error) {
      console.error("[POST /api/kanban/cards] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(card, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/kanban/cards] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

