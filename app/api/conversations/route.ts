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

    // Get conversations where user is a participant
    const { data: conversations, error } = await supabase
      .from("conversations")
      .select(`
        *,
        conversation_participants!inner(user_id)
      `)
      .eq("conversation_participants.user_id", publicUser.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("[GET /api/conversations] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(conversations || []);
  } catch (error: any) {
    console.error("[GET /api/conversations] Error:", error);
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
    const { name, type = "direct", participant_ids = [] } = body;

    // Create conversation
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .insert({
        name,
        type,
        created_by: publicUser.id,
        user_id: publicUser.id  // Added per schema fix
      })
      .select()
      .single();

    if (convError) {
      console.error("[POST /api/conversations] Error:", convError);
      return NextResponse.json({ error: convError.message }, { status: 500 });
    }

    // Add participants (including creator)
    const allParticipants = [publicUser.id, ...participant_ids.filter((id: string) => id !== publicUser.id)];
    const participantData = allParticipants.map((userId: string) => ({
      conversation_id: conversation.id,
      user_id: userId
    }));

    const { error: partError } = await supabase
      .from("conversation_participants")
      .insert(participantData);

    if (partError) {
      console.error("[POST /api/conversations] Participant error:", partError);
      // Rollback conversation creation
      await supabase.from("conversations").delete().eq("id", conversation.id);
      return NextResponse.json({ error: partError.message }, { status: 500 });
    }

    return NextResponse.json(conversation, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/conversations] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
