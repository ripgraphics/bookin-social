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

    const { searchParams } = new URL(request.url);
    const folder_id = searchParams.get("folder_id");
    const search = searchParams.get("search");

    let query = supabase
      .from("notes")
      .select("*")
      .eq("user_id", publicUser.id);

    if (folder_id) {
      query = query.eq("folder_id", folder_id);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    const { data: notes, error } = await query.order("updated_at", { ascending: false });

    if (error) {
      console.error("[GET /api/notes] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(notes || []);
  } catch (error: any) {
    console.error("[GET /api/notes] Error:", error);
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
    const { title, content, folder_id, tags = [], is_pinned = false } = body;

    // Create note
    const { data: note, error: noteError } = await supabase
      .from("notes")
      .insert({
        title,
        content,
        folder_id,
        user_id: publicUser.id,
        is_pinned
      })
      .select()
      .single();

    if (noteError) {
      console.error("[POST /api/notes] Error:", noteError);
      return NextResponse.json({ error: noteError.message }, { status: 500 });
    }

    // Note: Tags functionality removed until notes_tags junction table is created
    // if (tags.length > 0) {
    //   const tagData = tags.map((tagId: string) => ({
    //     note_id: note.id,
    //     tag_id: tagId
    //   }));
    //   await supabase.from("note_tags").insert(tagData);
    // }

    return NextResponse.json(note, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/notes] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

