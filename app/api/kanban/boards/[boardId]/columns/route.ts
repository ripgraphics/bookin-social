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

    const { data: columns, error } = await supabase
      .from("kanban_columns")
      .select("*")
      .eq("board_id", boardId)
      .order("position", { ascending: true });

    if (error) {
      console.error("[GET /api/kanban/boards/[boardId]/columns] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(columns || []);
  } catch (error: any) {
    console.error("[GET /api/kanban/boards/[boardId]/columns] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
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

    const body = await request.json();
    const { name, position } = body;

    const { data: column, error } = await supabase
      .from("kanban_columns")
      .insert({
        board_id: boardId,
        name,
        position
      })
      .select()
      .single();

    if (error) {
      console.error("[POST /api/kanban/boards/[boardId]/columns] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(column, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/kanban/boards/[boardId]/columns] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

