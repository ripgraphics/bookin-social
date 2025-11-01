import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const { noteId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: note, error } = await supabase
      .from("notes")
      .select(`
        *,
        folder:note_folders(id, name, color),
        note_tags(
          tag_id,
          tag:tags(id, name, color)
        )
      `)
      .eq("id", noteId)
      .single();

    if (error) {
      console.error("[GET /api/notes/[id]] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(note);
  } catch (error: any) {
    console.error("[GET /api/notes/[id]] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const { noteId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, folder_id, is_pinned, tags } = body;

    const updateData: any = { updated_at: new Date().toISOString() };
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (folder_id !== undefined) updateData.folder_id = folder_id;
    if (is_pinned !== undefined) updateData.is_pinned = is_pinned;

    const { data: note, error } = await supabase
      .from("notes")
      .update(updateData)
      .eq("id", noteId)
      .select()
      .single();

    if (error) {
      console.error("[PATCH /api/notes/[id]] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update tags if provided
    if (tags !== undefined) {
      // Delete existing tags
      await supabase.from("note_tags").delete().eq("note_id", noteId);

      // Add new tags
      if (tags.length > 0) {
        const tagData = tags.map((tagId: string) => ({
          note_id: noteId,
          tag_id: tagId
        }));

        await supabase.from("note_tags").insert(tagData);
      }
    }

    return NextResponse.json(note);
  } catch (error: any) {
    console.error("[PATCH /api/notes/[id]] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const { noteId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("notes")
      .delete()
      .eq("id", noteId);

    if (error) {
      console.error("[DELETE /api/notes/[id]] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/notes/[id]] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

