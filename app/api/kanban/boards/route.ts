import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user's public.users id
    const { data: publicUser } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!publicUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { data: boards, error } = await supabase
      .from("kanban_boards")
      .select("*")
      .eq("user_id", publicUser.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[GET /api/kanban/boards] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(boards || []);
  } catch (error: any) {
    console.error("[GET /api/kanban/boards] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user's public.users id
    const { data: publicUser } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!publicUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, description } = body;

    const { data: board, error } = await supabase
      .from("kanban_boards")
      .insert({
        user_id: publicUser.id,
        name,
        description
      })
      .select()
      .single();

    if (error) {
      console.error("[POST /api/kanban/boards] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(board, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/kanban/boards] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
