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

    // Get the user's public.users id
    const { data: publicUser } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!publicUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify user is a participant in the conversation
    const { data: participant } = await supabase
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", conversationId)
      .eq("user_id", publicUser.id)
      .single();

    if (!participant) {
      return NextResponse.json({ error: "Not authorized to view this conversation" }, { status: 403 });
    }

    // Get messages with sender details
    const { data: messages, error } = await supabase
      .from("messages")
      .select(`
        id,
        content,
        message_type,
        created_at,
        updated_at,
        sender:users!messages_sender_id_fkey(id, email, first_name, last_name)
      `)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[GET /api/conversations/:id/messages] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(messages || []);
  } catch (error: any) {
    console.error("[GET /api/conversations/:id/messages] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
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

    // Get the user's public.users id
    const { data: publicUser } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!publicUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify user is a participant in the conversation
    const { data: participant } = await supabase
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", conversationId)
      .eq("user_id", publicUser.id)
      .single();

    if (!participant) {
      return NextResponse.json({ error: "Not authorized to send messages to this conversation" }, { status: 403 });
    }

    const body = await request.json();
    const { content, message_type = "text" } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    // Insert message
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: publicUser.id,
        user_id: publicUser.id,  // Added per schema fix
        content: content.trim(),
        message_type
      })
      .select(`
        id,
        content,
        message_type,
        created_at,
        updated_at,
        sender:users!messages_sender_id_fkey(id, email, first_name, last_name)
      `)
      .single();

    if (messageError) {
      console.error("[POST /api/conversations/:id/messages] Error:", messageError);
      return NextResponse.json({ error: messageError.message }, { status: 500 });
    }

    // Update conversation's updated_at timestamp
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);

    return NextResponse.json(message, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/conversations/:id/messages] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
