import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: conversation, error } = await supabase
      .from("conversations")
      .select(`
        *,
        conversation_participants(
          user_id,
          user:users(id, email, first_name, last_name)
        )
      `)
      .eq("id", conversationId)
      .single();

    if (error) {
      console.error("[GET /api/conversations/[id]] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(conversation);
  } catch (error: any) {
    console.error("[GET /api/conversations/[id]] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    const { data: conversation, error } = await supabase
      .from("conversations")
      .update({ name, updated_at: new Date().toISOString() })
      .eq("id", conversationId)
      .select()
      .single();

    if (error) {
      console.error("[PATCH /api/conversations/[id]] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(conversation);
  } catch (error: any) {
    console.error("[PATCH /api/conversations/[id]] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", conversationId);

    if (error) {
      console.error("[DELETE /api/conversations/[id]] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/conversations/[id]] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

