import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First get all columns for this board
    const { data: columns } = await supabase
      .from("kanban_columns")
      .select("id")
      .eq("board_id", boardId);

    if (!columns || columns.length === 0) {
      return NextResponse.json([]);
    }

    const columnIds = columns.map(c => c.id);

    const { data: cards, error } = await supabase
      .from("kanban_cards")
      .select("*")
      .in("column_id", columnIds)
      .order("position", { ascending: true });

    if (error) {
      console.error("[GET /api/kanban/boards/[boardId]/cards] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(cards || []);
  } catch (error: any) {
    console.error("[GET /api/kanban/boards/[boardId]/cards] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

